import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { actDefinition, EscapeWorld, type WorldInteraction } from './scene'
import { ACTS, ENDINGS, HERBS, JourneyState, MedicinePuzzle, NinePalacePuzzle, type ActId, type EndingId } from './story'
import { ArchivePuzzle, CORRECT_HOUR, ScalePuzzle } from './puzzles_act23'

const app = document.getElementById('app')!
const promptEl = document.getElementById('prompt')!
const actEl = document.getElementById('act')!
const objectiveEl = document.getElementById('objective')!
const inventoryEl = document.getElementById('inventory')!
const toastEl = document.getElementById('toast')!
const dialogueEl = document.getElementById('dialogue')!
const endingEl = document.getElementById('ending')!
const endingContent = document.getElementById('ending-content')!
const restartButton = document.getElementById('restart') as HTMLButtonElement

// 首屏引路遮罩：必须在 EscapeWorld（程序化贴图 + GLB）之前挂进 DOM。
// 数据只来自 scene.ts 的 window 事件契约：assets-progress {loaded,total} / assets-ready {total}。
const veil = createLoadingVeil()
window.addEventListener('assets-progress', (event) => {
  const detail = (event as CustomEvent<{ loaded?: number; total?: number }>).detail
  if (!detail) return
  veil.progress(Number(detail.loaded) || 0, Number(detail.total) || 0)
})
window.addEventListener('assets-ready', (event) => {
  const detail = (event as CustomEvent<{ total?: number }>).detail
  veil.ready(Number(detail?.total) || 0)
})

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x080d0d)
scene.fog = new THREE.FogExp2(0x121c1a, 0.018)

const previewMode = new URLSearchParams(window.location.search)
const previewViews: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  scale: { position: [0, 2.9, 51.5], target: [0, 1.5, 45.5] },
  archive: { position: [-2.2, 2.2, 27.5], target: [4.8, 1.9, 18.5] },
  medicine: { position: [0, 2.4, 4.7], target: [0, 1.35, -1.8] },
  // —— 审官 v2 复审导航分用的玩家机位（全部 clean=1 出图，不依赖对白）——
  medicineEntry: { position: [0, 1.65, 6.2], target: [0, 1.4, -4] },
  medicineBench: { position: [-0.7, 1.6, 0.6], target: [0.6, 1.25, -1.6] },
  medicineExit: { position: [0, 1.65, -5.2], target: [0, 1.7, -9.4] },
  palace: { position: [0, 1.7, -21.6], target: [0, 1.3, -30.4] },
  palaceEntry: { position: [0, 1.65, -20.6], target: [0, 0.6, -28] },
  palaceCenter: { position: [0, 2.3, -24.6], target: [0, 0.5, -28.2] },
  palaceExit: { position: [1.4, 1.65, -32.8], target: [0.6, 1.5, -36.5] },
  river: { position: [-4.2, 2.5, -44.6], target: [0, 2.6, -68] },
  riverBridge: { position: [0, 2.0, -46], target: [0, 1.6, -58] },
  riverMid: { position: [-1.6, 2.4, -57], target: [0, 2.2, -78.5] },
  riverEnd: { position: [-4.6, 1.7, -50.5], target: [-6.6, 1.9, -51] },
  riverSide: { position: [8.2, 1.9, -54.5], target: [-0.4, 1.6, -64] }
}
const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.05, 130)
const preview = previewViews[previewMode.get('view') ?? '']
const previewFocusEnabled = previewMode.has('shots') && Boolean(preview)
camera.position.set(...(preview?.position ?? [1.6, 1.65, 52]))
if (preview) camera.lookAt(...preview.target)
else camera.lookAt(0, 1.7, 46.8)

// shots=1（截图/自动验证模式）保留绘制缓冲，否则 WebGL canvas 在渲染帧外回读恒为全黑。
const preserveBuffer = previewMode.has('shots')
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: preserveBuffer })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
app.appendChild(renderer.domElement)

const world = new EscapeWorld(scene)
const scalePuzzle = new ScalePuzzle()
const archive = new ArchivePuzzle()
const medicine = new MedicinePuzzle()
const palace = new NinePalacePuzzle()
const journey = new JourneyState()
const completed = new Set<ActId>()
const carried: string[] = []
let balanceDialogueShown = false

const controls = new PointerLockControls(camera, renderer.domElement)

// 指针锁只在人工浏览器里启用；自动化验收进程（navigator.webdriver）一律免锁。
// 事故记录：
// 1) 夸克退出指针锁时偶发不还原 Windows ClipCursor；
// 2) 自动化浏览器（1440×900 窗口）点画布上锁后失焦，剪裁残留到桌面。
// 因此 webdriver 环境退回「按住左键拖动环视」，人工环境保留点击锁定 + 下面两条兜底。
const usePointerLock = !navigator.webdriver
const isQuark = /QuarkPC/i.test(navigator.userAgent)
// 指针锁最后一次被释放的时刻：夸克二次 Esc 刷新兜底只看这个时间戳，
// 只有「刚退出过锁」才允许刷新，避免无关的连按 Esc 把玩家踢回上一幕。
let lockReleasedAt = 0
const dragLook = { active: false }
const lookEngaged = (): boolean => (usePointerLock ? controls.isLocked : true)

const lookEuler = new THREE.Euler(0, 0, 0, 'YXZ')

// ===================== 起点浮层（序厅 → 第一殿 → 第二至第六殿） =====================
// 序厅与第一殿是队友的独立页面，第二至第六殿是本页连续推进的一局。
// 这里给一个统一入口：主按钮去序厅，次按钮留在本页直接开局。
// 规则：
// 1) 出图/回归模式（?clean=1 / ?shots=1）不弹浮层——脚本要干净画面与自由操作；
// 2) 从第一殿「入第二殿」进来的（?from=hall1=1）不再拦一次，直接进二殿；
// 3) 按钮要等 body[data-assets="ready"]（加载遮罩撤除）之后才可点。
const startOverlay = document.getElementById('start-overlay')
const startPrologueButton = document.getElementById('start-prologue') as HTMLButtonElement | null
const startDirectButton = document.getElementById('start-direct') as HTMLButtonElement | null
const fromHallOne = (previewMode.get('from') ?? '').startsWith('hall1')
const startOverlayEnabled = Boolean(startOverlay) && !previewMode.has('clean') && !previewMode.has('shots') && !fromHallOne

if (startOverlay) {
  if (!startOverlayEnabled) {
    startOverlay.remove()
  } else {
    const setStartButtons = (enabled: boolean): void => {
      if (startPrologueButton) startPrologueButton.disabled = !enabled
      if (startDirectButton) startDirectButton.disabled = !enabled
    }
    setStartButtons(false)
    // 浮层开着时藏掉底部锁定提示条，避免两层提示叠着说话。
    document.body.classList.add('start-overlay-open')
    // 遮罩撤除时派发的 assets-veil-hidden —— 此刻才允许点击起点按钮。
    window.addEventListener('assets-veil-hidden', () => setStartButtons(true))
    startPrologueButton?.addEventListener('click', () => {
      window.location.href = 'prologue/index.html'
    })
    startDirectButton?.addEventListener('click', () => {
      startOverlay?.classList.add('closed')
      document.body.classList.remove('start-overlay-open')
      // 按钮点击本身就是用户手势，可以直接请求指针锁；免锁模式（自动化）只关浮层。
      if (usePointerLock && !won && !controls.isLocked) controls.lock()
    })
  }
}

const moveDir = new THREE.Vector3()
function applyLook(dx: number, dy: number): void {
  const sensitivity = 0.0022
  lookEuler.setFromQuaternion(camera.quaternion)
  lookEuler.y -= dx * sensitivity
  lookEuler.x -= dy * sensitivity
  const limit = Math.PI / 2 - 0.02
  lookEuler.x = Math.max(-limit, Math.min(limit, lookEuler.x))
  camera.quaternion.setFromEuler(lookEuler)
}
function moveForward(distance: number): void {
  camera.getWorldDirection(moveDir)
  moveDir.y = 0
  if (moveDir.lengthSq() < 1e-8) return
  moveDir.normalize()
  camera.position.addScaledVector(moveDir, distance)
}
function moveRight(distance: number): void {
  camera.getWorldDirection(moveDir)
  moveDir.y = 0
  if (moveDir.lengthSq() < 1e-8) return
  moveDir.normalize()
  moveDir.cross(camera.up)
  camera.position.addScaledVector(moveDir, distance)
}

const clock = new THREE.Clock()
const keys = new Set<string>()
const raycaster = new THREE.Raycaster()
raycaster.far = 3.4
const center = new THREE.Vector2(0, 0)

// B8：准星聚焦物的线框高亮。BoxHelper 每次目标变化时重建，指向 focused 的 object。
let focusOutline: THREE.BoxHelper | null = null
let focusOutlineTarget: THREE.Object3D | null = null
function updateFocusOutline(): void {
  const target = focused?.object ?? null
  if (focusOutlineTarget === target) return
  if (focusOutline) {
    scene.remove(focusOutline)
    focusOutline.geometry.dispose()
    focusOutline.material.dispose()
    focusOutline = null
  }
  focusOutlineTarget = target
  if (target) {
    focusOutline = new THREE.BoxHelper(target, 0xc9a25a)
    const material = focusOutline.material as THREE.LineBasicMaterial
    material.transparent = true
    material.opacity = 0.55
    scene.add(focusOutline)
  }
}

let won = false
let focused: WorldInteraction | null = null
let currentAct: ActId = world.actAt(camera.position.z)
let toastTimer = 0
let combined = false
let standingStone = 0
let stepDistance = 0
world.setAtmosphere(currentAct)

const initialAct = actDefinition(currentAct)
actEl.textContent = `${initialAct.number} · ${initialAct.title}`
objectiveEl.textContent = initialAct.objective
// 预览/导航机位：HUD 殿名按机位所在殿显示（仅显示，不推进剧情、不切氛围），
// 否则所有 ?view= 机位的 HUD 都写死第四殿，导航评审会误判。
if (preview) {
  const previewAct = actDefinition(world.actAt(camera.position.z))
  actEl.textContent = `${previewAct.number} · ${previewAct.title}`
}

let lastPrompt: string | null = null
function setPrompt(text: string | null): void {
  if (text === lastPrompt) return
  lastPrompt = text
  if (text === null) {
    promptEl.classList.add('hidden')
    promptEl.textContent = ''
  } else {
    promptEl.classList.remove('hidden')
    promptEl.textContent = text
  }
}

function toast(message: string, seconds = 4): void {
  toastEl.textContent = message
  toastEl.classList.remove('hidden')
  toastTimer = seconds
}

function dialogue(speaker: string, text: string, seconds = 7): void {
  dialogueEl.innerHTML = `<strong>${speaker}</strong><p>${text}</p>`
  dialogueEl.classList.remove('hidden')
  window.setTimeout(() => dialogueEl.classList.add('hidden'), seconds * 1000)
}

function updateInventory(): void {
  inventoryEl.textContent = `路引 · 半印 ${journey.seals.size}/6　${journey.hasSoup ? '不忘汤 · 已收' : '不忘汤 · 未配'}　证据 ${['A', 'B', 'C', 'D'].filter((id) => journey.evidence.has(id)).join('/') || '无'}`
}

function updateScaleObjective(): void {
  if (scalePuzzle.isSolved) {
    objectiveEl.textContent = '业秤已平，半印②到手。南门已开——去第三殿籍库。'
    return
  }
  if (scalePuzzle.isBalanced) {
    objectiveEl.textContent = `①配平五十两 ✓　②把多出的一两压进未时（左盘 ${scalePuzzle.sum} 两）`
    return
  }
  objectiveEl.textContent = `①读偈文，往左盘补足五十两（左盘 ${scalePuzzle.sum} 两 · 还差 ${50 - scalePuzzle.sum} 两）　②那一两压进未时`
}

function updateArchiveObjective(): void {
  objectiveEl.textContent = `①找出丙午年册 ${archive.isFound ? '✓' : ''}　→　②正光照字，侧光照改。 ${archive.isRevealed ? '✓' : ''}　→　③朱笔勘合 ${archive.isSolved ? '✓' : ''}`
}

function updateAct(): void {
  const act = world.actAt(camera.position.z)
  if (act === currentAct) return
  currentAct = act
  world.setAtmosphere(act)
  rig?.setAct(act)
  const definition = actDefinition(act)
  actEl.textContent = `${definition.number} · ${definition.title}`
  objectiveEl.textContent = definition.objective
  toast(`${definition.number} · ${definition.title}｜${definition.subtitle}`, 3)
  if (act === 'scale') {
    dialogue('业秤司吏', '善恶自有斤两。左盘三十两，是你生前自己称下的。补足它，一样都不能少，也一样都不能多。', 10)
    updateScaleObjective()
  }
  if (act === 'archive') {
    dialogue('籍房司吏', '落户要三样：生辰、卒年、案由。你缺一样。', 10)
    updateArchiveObjective()
  }
  if (act === 'medicine') dialogue('孟婆', '汤温刚好。药渣别剩。')
  if (act === 'palace') dialogue('掌印司吏', '本房核位。戴九履一，左三右七。踩完，印自己会落。')
  if (act === 'reincarnation') dialogue('孟婆', '汤带了没有？')
}

function finishAct(act: ActId): void {
  completed.add(act)
  journey.completeAct(act)
  world.openExit(act)
  if (act === 'medicine') {
    toast('半印④落下。不忘汤入手。北门已开。', 6)
    dialogue('孟婆', '别人求忘，你求记。稀奇。')
  } else if (act === 'palace') {
    toast('半印⑤落下。路引浮字：按规矩，本该先问一句案由的，可没人问。', 7)
    dialogue('掌印司吏', '完了。下一房。')
  } else if (act === 'scale') {
    journey.collectEvidence('B')
    toast('半印②落下。证据 B 已入路引：你名下多出了一两，却不是你挣的。南门已开。', 7)
    dialogue('业秤司吏', '称过了。下一房，籍房。')
  } else if (act === 'archive') {
    journey.collectEvidence('C')
    toast('半印③落下。证据 C：簿页残片。刮改的笔迹，是你的。南门已开。', 7)
    dialogue('籍房司吏', '落户要三样。你现在齐了。去吧。')
  }
  updateInventory()
}

function showEnding(id: EndingId): void {
  won = true
  controls.unlock()
  dragLook.active = false
  lockHint.classList.add('hidden')
  wayfinder.classList.add('hidden')
  const ending = ENDINGS[id]
  endingContent.innerHTML = `<span>${ending.subtitle}</span><h2>${ending.title}</h2><p>${ending.text}</p><small>${ending.condition}</small>`
  endingEl.classList.remove('hidden')
}

function interact(target: WorldInteraction): CueKind {
  if (target.kind === 'herb') {
    const result = medicine.select(target.id)
    toast(result.message)
    if (result.solved) world.setActSolved('medicine')
    return result.ok ? (result.solved ? 'seal' : 'ok') : 'fail'
  } else if (target.kind === 'bowl') {
    dialogue('青瓷药碗', '碗沿一圈旧药渍。碗底刻着两个字：阿满。你不认得这个名字。手却没放下。', 10)
    return 'ok'
  } else if (target.kind === 'evidence') {
    journey.collectEvidence(target.id)
    target.enabled = false
    target.object.visible = false
    toast(`证据 ${target.id} 已收入路引。`)
    updateInventory()
    return 'ok'
  } else if (target.kind === 'seal') {
    finishAct(target.act)
    return 'seal'
  } else if (target.kind === 'weight') {
    if (target.id === 'yiliang-extra') {
      const result = scalePuzzle.pressHour(CORRECT_HOUR)
      toast(result.message, 6)
      if (result.solved) {
        target.enabled = false
        world.pressHourVisual()
        world.setActSolved('scale')
        updateScaleObjective()
      }
      return result.solved ? 'seal' : result.ok ? 'ok' : 'fail'
    } else {
      const result = scalePuzzle.place(target.id)
      toast(result.message, 5)
      if (result.ok && !scalePuzzle.isBalanced) {
        carried.push(target.id)
        world.setWeightVisible(target.id, false)
        world.markScalePlaced(scalePuzzle.sum, false)
      } else if (!result.ok && carried.length > 0) {
        world.resetWeights([...carried])
        carried.length = 0
        world.markScalePlaced(scalePuzzle.sum, true)
      }
      if (scalePuzzle.isBalanced && !balanceDialogueShown) {
        balanceDialogueShown = true
        world.spawnHourWeight()
        dialogue('业秤司吏', '善恶自有斤两。多出这一两，虽然不是你的，可一旦压进未时，这一案就算你认了。', 10)
      }
      updateScaleObjective()
      return result.ok ? 'ok' : 'fail'
    }
  } else if (target.kind === 'inscription') {
    dialogue('足秤偈', '十六两为一斤，五十两为足秤。左盘三十两，是你生前自己称下的。补足它。多一两者过，少一两者贪。', 12)
    return 'ok'
  } else if (target.kind === 'hourplate') {
    dialogue('十二时辰盘', '盘上共十二槽，只有未时那一槽落了东西——等秤持平了，它自会认你。', 9)
    return 'ok'
  } else if (target.kind === 'register') {
    const result = archive.openRegister(target.id)
    toast(result.message, 6)
    if (archive.isFound) {
      world.markRegisterFound()
      updateArchiveObjective()
    }
    return result.ok ? 'ok' : 'fail'
  } else if (target.kind === 'lamp') {
    const result = archive.shineLamp()
    toast(result.message, 7)
    if (archive.isRevealed) {
      world.revealScrape()
      const brushTarget = world.interactions.find((item) => item.kind === 'brush')
      if (brushTarget) brushTarget.enabled = true
      updateArchiveObjective()
    }
    return result.ok ? 'ok' : 'fail'
  } else if (target.kind === 'brush') {
    const result = archive.compare()
    toast(result.message, 7)
    if (result.solved) {
      target.enabled = false
      target.object.visible = false
      world.setActSolved('archive')
      updateArchiveObjective()
    }
    return result.solved ? 'seal' : result.ok ? 'ok' : 'fail'
  } else if (target.kind === 'exit') {
    // 二殿出口距 actAt 分界仅差 0.45m，一格推进切不了殿——二三殿出口直接传送到下一殿入口
    if (target.act === 'scale') camera.position.set(0, 1.65, 30)
    else if (target.act === 'archive') camera.position.set(0, 1.65, 6)
    else camera.position.z -= 1.1
    updateAct()
    return 'ok'
  } else if (target.kind === 'combine') {
    if (!journey.canCombine) {
      toast('骑缝未合。先取得第四、第五殿的半印。')
      return 'fail'
    }
    if (combined) return 'fail'
    combined = true
    world.showEndings()
    journey.completeAct('reincarnation')
    updateInventory()
    dialogue('崔珏', '三年前，阿满病危。你拿自己的名字，押她几年阳寿。原告是你。被告是你。办案的，也是你。这案子，我审不了。', 14)
    toast('六印合成。朱字浮出——那是你的笔迹。前方三条路已经亮了。', 8)
    return 'seal'
  } else if (target.kind === 'ending') {
    const id = target.id as EndingId
    if (journey.unlockedEndings.includes(id)) {
      showEnding(id)
      return 'ending'
    }
    toast(`结局未解锁：${ENDINGS[id].condition}`)
    return 'fail'
  }
  return 'fail'
}

restartButton.addEventListener('click', () => window.location.reload())

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyM') {
    toggleMute()
    return
  }
  // Esc：先释放指针锁；已释放时再按一次（1.5s 内）刷新页面。
  // 夸克偶发exitPointerLock 后系统 ClipCursor 不还原，刷新是唯一稳定的脱困手段。
  // 兜底窗口只在「刚刚发生过指针锁释放」时有效：与锁无关的连按 Esc 不会把玩家踢回上一幕。
  if (event.code === 'Escape') {
    if (document.pointerLockElement !== null) {
      document.exitPointerLock()
      lockReleasedAt = performance.now()
      return
    }
    if (isQuark && performance.now() - lockReleasedAt < 1500) {
      window.location.reload()
      return
    }
    return
  }
  if (won) return
  unlockAudio()
  keys.add(event.code)
  if (event.code === 'KeyE' && lookEngaged()) {
    if (focused) rig?.cue(interact(focused))
    else rig?.cue('fail')
  }
})

window.addEventListener('keyup', (event) => {
  keys.delete(event.code)
})

// 指针锁只在「页面拥有焦点」时保留。切走窗口 / 最小化 / 关闭标签时立刻释放，
// 否则浏览器会把系统光标 ClipCursor 裁在网页矩形里，连任务栏都点不到。
function releasePointerLock(): void {
  // 失焦时先清按键：否则切回窗口后 W/A/S/D 可能仍停在"按下"状态，人会一直漂移。
  keys.clear()
  if (document.pointerLockElement !== null) {
    document.exitPointerLock()
    lockReleasedAt = performance.now()
  }
}
window.addEventListener('blur', releasePointerLock)
window.addEventListener('pagehide', releasePointerLock)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releasePointerLock()
})

const LOCK_HINT_IDLE = usePointerLock
  ? '点击画面 · 锁定鼠标，开始引路'
  : '按住左键拖动 · 环视；WASD 移动，E 交互'
// 夸克退出锁偶发 ClipCursor 不还原：给出明确的二次 Esc 刷新兜底。
const LOCK_HINT_IDLE_ESCAPE = isQuark && usePointerLock
  ? '点击画面重新锁定；若光标被困，连按 Esc 刷新页面'
  : LOCK_HINT_IDLE
const LOCK_HINT_ACTIVE = '按 Esc 可随时释放鼠标'
let lockHintTimer = 0

// 提示条元素必须早于所有 lock/unlock/拖拽监听器创建：
// setLockHint 与免锁模式的 pointerdown 回调都直接摸 lockHint，
// 放在模块末尾会出现 const 的 TDZ 风险（初始化未完成就被调用 → 读未初始化的绑定）。
const lockHint = document.createElement('div')
lockHint.id = 'lock-hint'
lockHint.textContent = LOCK_HINT_IDLE
document.body.appendChild(lockHint)

function setLockHint(text: string, visible: boolean, autoHideMs = 0): void {
  window.clearTimeout(lockHintTimer)
  lockHint.textContent = text
  lockHint.classList.toggle('hidden', !visible)
  if (visible && autoHideMs > 0) {
    lockHintTimer = window.setTimeout(() => lockHint.classList.add('hidden'), autoHideMs)
  }
}

renderer.domElement.addEventListener('click', () => {
  unlockAudio()
  if (usePointerLock && !won && !controls.isLocked) controls.lock()
})

// 免锁模式：不碰 Pointer Lock，系统光标永远自由，夸克也就不可能残留 ClipCursor。
if (!usePointerLock) {
  const canvas = renderer.domElement
  canvas.style.cursor = 'grab'
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    dragLook.active = true
    canvas.setPointerCapture(event.pointerId)
    canvas.style.cursor = 'grabbing'
    lockHint.classList.add('hidden')
  })
  const endDrag = (event: PointerEvent): void => {
    if (!dragLook.active) return
    dragLook.active = false
    canvas.style.cursor = 'grab'
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
  }
  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)
  canvas.addEventListener('pointermove', (event) => {
    if (!dragLook.active) return
    applyLook(event.movementX, event.movementY)
  })
}

controls.addEventListener('lock', () => {
  unlockAudio()
  // 锁定时鼠标被裁在页面矩形内，键盘 Esc 是唯一稳定出口——明确写出来。
  setLockHint(LOCK_HINT_ACTIVE, true, 4000)
})

controls.addEventListener('unlock', () => {
  keys.clear()
  lockReleasedAt = performance.now()
  if (!won) setLockHint(LOCK_HINT_IDLE_ESCAPE, true)
})

// D4：原生 pointerlockchange 兜底。controls 的 unlock 事件在 headless 环境
// 可能不触发（Esc 由浏览器内部处理时），原生事件保证提示一定同步。
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === null) {
    keys.clear()
    // 浏览器自己吞掉 Esc（键没派发到页面）时，释放时刻只能从这里记。
    lockReleasedAt = performance.now()
    if (!won) setLockHint(LOCK_HINT_IDLE_ESCAPE, true)
  } else {
    setLockHint(LOCK_HINT_ACTIVE, true, 4000)
  }
})

document.addEventListener('pointerlockerror', () => {
  setLockHint('鼠标锁定被浏览器拒绝，再点一次画面重试', true, 4000)
})

function updateMovement(delta: number): void {
  if (!lookEngaged() || won) return
  const speed = 3.1
  const step = speed * delta
  const previous = camera.position.clone()

  if (keys.has('KeyW') || keys.has('ArrowUp')) moveForward(step)
  if (keys.has('KeyS') || keys.has('ArrowDown')) moveForward(-step)
  if (keys.has('KeyA') || keys.has('ArrowLeft')) moveRight(-step)
  if (keys.has('KeyD') || keys.has('ArrowRight')) moveRight(step)

  world.constrain(camera.position, previous, completed)
  const travelled = Math.hypot(camera.position.x - previous.x, camera.position.z - previous.z)
  if (travelled > 0.0005) {
    stepDistance += travelled
    if (stepDistance >= 0.78) {
      stepDistance = 0
      rig?.cue('step')
    }
  }
  updateAct()
  if (currentAct === 'palace' && !palace.isSolved) {
    const layout = [[8, 1, 6], [3, 5, 7], [4, 9, 2]]
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const x = (column - 1) * 2.05
        const z = -25.7 - row * 2.05
        if (Math.abs(camera.position.x - x) < 0.55 && Math.abs(camera.position.z - z) < 0.55) {
          const value = layout[row][column]
          if (standingStone !== value) {
            standingStone = value
            const result = palace.step(value)
            toast(result.message, 3)
            rig?.cue(result.solved ? 'seal' : result.ok ? 'ok' : 'fail')
            world.markPalaceStep(value, result.ok, result.solved)
            if (result.solved) world.setActSolved('palace')
          }
        }
      }
    }
    const onStone = Math.abs(camera.position.x) <= 2.9 && camera.position.z <= -24.8 && camera.position.z >= -32.5
    if (!onStone) standingStone = 0
  }
}

const previewFocusPosition = new THREE.Vector3()
let previewFocusCandidate: WorldInteraction | null | undefined

function findPreviewFocus(enabled: WorldInteraction[]): WorldInteraction | null {
  // clean 预览机位固定，候选只算一次；BoxHelper 仍由 focusOutlineTarget 缓存。
  if (previewFocusCandidate !== undefined) return previewFocusCandidate
  let bestScore = Number.POSITIVE_INFINITY
  previewFocusCandidate = null
  for (const item of enabled) {
    item.object.getWorldPosition(previewFocusPosition)
    previewFocusPosition.project(camera)
    if (
      previewFocusPosition.z < -1 || previewFocusPosition.z > 1 ||
      Math.abs(previewFocusPosition.x) > 0.92 ||
      Math.abs(previewFocusPosition.y) > 0.92
    ) continue
    const score = previewFocusPosition.x ** 2 + previewFocusPosition.y ** 2
    if (score < bestScore) {
      bestScore = score
      previewFocusCandidate = item
    }
  }
  return previewFocusCandidate
}

function updateFocus(): void {
  focused = null
  if ((!lookEngaged() && !previewFocusEnabled) || won) {
    setPrompt(null)
    setNearbyList([])
    return
  }

  raycaster.setFromCamera(center, camera)
  raycaster.far = lookEngaged() ? 3.4 : Number.POSITIVE_INFINITY
  const enabled = world.interactions.filter((item) =>
    item.enabled && (lookEngaged() || item.act === currentAct))
  const hits = raycaster.intersectObjects(enabled.map((item) => item.object), false)
  const hit = hits.find((item) => item.distance <= raycaster.far)
  focused = hit ? enabled.find((item) => item.object === hit.object) ?? null : null
  if (!focused && !lookEngaged()) focused = findPreviewFocus(enabled)
  setPrompt(lookEngaged() && focused ? promptFor(focused) : null)
  setNearbyList(enabled)
}

// B8：近距物名提示——3.4m 内的交互物在 HUD 侧栏列名（含距离），玩家没瞄准也知道能点什么。
// 正在准星上的那个由 #prompt 显示，这里排除，避免重复。
const nearbyList = document.createElement('ul')
nearbyList.id = 'nearby-list'
nearbyList.setAttribute('aria-hidden', 'true')
// 初始即隐藏：setNearbyList 在 markup 未变化时会提前 return，空列表若不预置 hidden 会一直显示空框。
nearbyList.classList.add('hidden')
document.body.appendChild(nearbyList)

const nearbyWorldPosition = new THREE.Vector3()

function setNearbyList(enabled: WorldInteraction[]): void {
  const entries: string[] = []
  for (const item of enabled) {
    if (item === focused) continue
    item.object.getWorldPosition(nearbyWorldPosition)
    const distance = nearbyWorldPosition.distanceTo(camera.position)
    if (distance <= 3.4) entries.push(`${item.label} · ${distance.toFixed(1)}m`)
  }
  const markup = entries.map((entry) => `<li>${entry}</li>`).join('')
  nearbyList.classList.toggle('hidden', entries.length === 0)
  if (nearbyList.innerHTML === markup) return
  nearbyList.innerHTML = markup
}

// B8：把「E · 标签」补成带去向/条件的可读提示，出口与结局不再只写一句泛泛的动词。
function promptFor(target: WorldInteraction): string {
  if (target.kind === 'exit') {
    const index = ACTS.findIndex((item) => item.id === target.act)
    const next = ACTS[index + 1]
    return next ? `E · 推门 → ${next.number} · ${next.title}` : 'E · 推门 → 下一殿'
  }
  if (target.kind === 'ending') {
    const id = target.id as EndingId
    return journey.unlockedEndings.includes(id)
      ? `E · 走这条路 · ${ENDINGS[id].title}`
      : `E · ${ENDINGS[id].title}（未解锁：${ENDINGS[id].condition}）`
  }
  if (target.kind === 'combine' && !journey.canCombine) return 'E · 合六印（还缺半印④⑤）'
  if (target.kind === 'seal') return `E · 收取${target.label}`
  return `E · ${target.label}`
}

// ===================== 首屏引路遮罩 =====================
type LoadingVeil = {
  element: HTMLDivElement
  progress: (loaded: number, total: number) => void
  ready: (total: number) => void
}

function createLoadingVeil(): LoadingVeil {
  const element = document.createElement('div')
  element.id = 'loading-veil'
  element.setAttribute('aria-hidden', 'true')
  // pointer-events 全程 none：遮罩绝不拦截 canvas 点击与指针锁定，也不吃键盘。
  element.style.pointerEvents = 'none'
  element.innerHTML = `
    <div class="veil-inner">
      <p class="veil-eyebrow">阴司 · 引路</p>
      <h1 class="veil-title">还魂路引</h1>
      <p class="veil-sub">引路中…</p>
      <div class="veil-track"><span class="veil-bar"></span></div>
      <p class="veil-meta"><span class="veil-percent">0%</span><span class="veil-count">正在铺开阴司</span></p>
      <p class="veil-hint">WASD 移动 · 鼠标环视 · E 交互 · M 静音</p>
    </div>`
  document.body.appendChild(element)

  const bar = element.querySelector<HTMLElement>('.veil-bar')!
  const percentEl = element.querySelector<HTMLElement>('.veil-percent')!
  const countEl = element.querySelector<HTMLElement>('.veil-count')!
  const subEl = element.querySelector<HTMLElement>('.veil-sub')!
  let dismissed = false
  let sawProgress = false
  let readyTotal = 0

  const dismiss = (): void => {
    if (dismissed) return
    dismissed = true
    stopObserver()
    element.classList.remove('veil-indeterminate')
    element.classList.add('veil-out')
    // 撤除即打可等待信号：body[data-assets="ready"] + assets-veil-hidden 事件，供截图脚本 waitForSelector / waitForFunction。
    document.body.dataset.assets = 'ready'
    window.dispatchEvent(new CustomEvent('assets-veil-hidden'))
    window.setTimeout(() => {
      element.style.display = 'none'
      element.style.pointerEvents = 'none'
      element.classList.add('veil-gone')
    }, 420)
  }

  const paint = (loaded: number, total: number): void => {
    if (total > 0 && loaded > 0) {
      const ratio = Math.max(0, Math.min(1, loaded / total))
      element.classList.remove('veil-indeterminate')
      bar.style.width = `${(ratio * 100).toFixed(1)}%`
      percentEl.textContent = `${Math.round(ratio * 100)}%`
      countEl.textContent = `${loaded} / ${total} 件资产`
    } else {
      // loaded 恒 0（或 total 未知）：走不确定态动画，不假报百分比。
      element.classList.add('veil-indeterminate')
      bar.style.width = ''
      percentEl.textContent = '…'
      countEl.textContent = total > 0 ? `共 ${total} 件资产` : '正在铺开阴司'
    }
  }

  paint(0, 0)
  // 兜底一：6s 内没收到 ready 也强制淡出（截图脚本等 body[data-assets="ready"]，不能晚于此），宁可早退也不卡死。
  window.setTimeout(dismiss, 6000)
  // 兜底二：scene.ts 若完全没派发进度事件，2.6s 后早退；但 .glb 还没落地时继续等（最多到 6.5s 硬上限）。
  // 用 PerformanceObserver 数已完成的 .glb 请求，不依赖 scene.ts 内部结构。
  let glbDone = 0
  let observer: PerformanceObserver | null = null
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (/\.glb(\?|$)/.test(entry.name)) glbDone += 1
    })
    observer.observe({ type: 'resource', buffered: true })
  } catch {
    observer = null
  }
  const stopObserver = (): void => {
    observer?.disconnect()
    observer = null
  }
  window.setTimeout(() => {
    if (sawProgress || dismissed) return
    const settle = (): void => {
      stopObserver()
      window.setTimeout(dismiss, 500)
    }
    if (glbDone > 0 || !observer) {
      settle()
      return
    }
    const poll = window.setInterval(() => {
      if (dismissed) {
        window.clearInterval(poll)
        stopObserver()
        return
      }
      if (glbDone > 0) {
        window.clearInterval(poll)
        settle()
        return
      }
      // 最晚 5.4s：让 6s 硬兜底接管，截图脚本不必无限等 GLB。
      if (window.performance.now() > 5400) {
        window.clearInterval(poll)
        stopObserver()
      }
    }, 400)
  }, 2600)

  return {
    element,
    progress: (loaded, total) => {
      sawProgress = true
      if (dismissed) return
      paint(loaded, total)
    },
    ready: (total) => {
      sawProgress = true
      readyTotal = total
      if (dismissed) return
      if (total > 0) paint(total, total)
      else {
        element.classList.remove('veil-indeterminate')
        bar.style.width = '100%'
        percentEl.textContent = '100%'
      }
      subEl.textContent = readyTotal > 0 ? `引路已毕 · ${readyTotal} 件资产就位` : '引路已毕'
      window.setTimeout(dismiss, 220)
    }
  }
}

// ===================== 程序化声音（Web Audio，零音频文件） =====================
const MASTER_VOLUME = 0.22
type CueKind = 'ok' | 'fail' | 'seal' | 'ending' | 'step' | 'ui'
type AudioRig = {
  context: AudioContext
  setAct: (act: ActId) => void
  cue: (kind: CueKind) => void
  setMuted: (value: boolean) => void
}

let rig: AudioRig | null = null
let muted = false
let audioUnlocked = false

function createAudioRig(): AudioRig | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  const context = new Ctor()
  const master = context.createGain()
  master.gain.value = MASTER_VOLUME
  master.connect(context.destination)
  const ambience = context.createGain()
  ambience.gain.value = 0.9
  ambience.connect(master)
  const sfx = context.createGain()
  sfx.gain.value = 0.85
  sfx.connect(master)

  // 一段 3s 棕噪 + 少量白噪，循环复用：风、研药、水声都由它滤波而来。
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 3), context.sampleRate)
  const data = buffer.getChannelData(0)
  let brown = 0
  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1
    brown = (brown + 0.02 * white) / 1.02
    data[index] = Math.max(-1, Math.min(1, brown * 3.2 + white * 0.22))
  }

  const gainNode = (value: number): GainNode => {
    const node = context.createGain()
    node.gain.value = value
    return node
  }
  const filter = (type: BiquadFilterType, frequency: number, q: number): BiquadFilterNode => {
    const node = context.createBiquadFilter()
    node.type = type
    node.frequency.value = frequency
    node.Q.value = q
    return node
  }
  const noise = (): AudioBufferSourceNode => {
    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.start()
    return source
  }
  const tone = (type: OscillatorType, frequency: number): OscillatorNode => {
    const osc = context.createOscillator()
    osc.type = type
    osc.frequency.value = frequency
    osc.start()
    return osc
  }
  const lfo = (frequency: number, depth: number, target: AudioParam): void => {
    const osc = context.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency
    const depthGain = gainNode(depth)
    osc.connect(depthGain)
    depthGain.connect(target)
    osc.start()
  }

  // 底噪风：所有殿共用，音量极低。
  const windFilter = filter('lowpass', 300, 0.7)
  const windGain = gainNode(0.42)
  noise().connect(windFilter)
  windFilter.connect(windGain)
  windGain.connect(ambience)
  lfo(0.06, 0.16, windGain.gain)

  const layers = {} as Record<ActId, GainNode>
  const buildLayer = (act: ActId, build: (out: GainNode) => void): void => {
    const out = gainNode(0)
    out.connect(ambience)
    build(out)
    layers[act] = out
  }

  // 第四殿药局：研药沙沙 + 石碾低鸣。
  buildLayer('medicine', (out) => {
    const grind = filter('bandpass', 1750, 0.9)
    const grindGain = gainNode(0.16)
    noise().connect(grind)
    grind.connect(grindGain)
    grindGain.connect(out)
    lfo(0.55, 0.12, grindGain.gain)
    const rumble = filter('lowpass', 190, 0.7)
    const rumbleGain = gainNode(0.2)
    noise().connect(rumble)
    rumble.connect(rumbleGain)
    rumbleGain.connect(out)
    lfo(0.4, 0.08, rumbleGain.gain)
    const mortar = gainNode(0.05)
    tone('sine', 96).connect(mortar)
    mortar.connect(out)
  })

  // 第五殿九宫：低沉石鸣 + 缓慢共振。
  buildLayer('palace', (out) => {
    const low = filter('lowpass', 240, 1.2)
    const lowGain = gainNode(0.28)
    low.connect(lowGain)
    lowGain.connect(out)
    tone('triangle', 57).connect(low)
    tone('sine', 85.5).connect(low)
    lfo(0.13, 0.1, lowGain.gain)
    const ring = filter('bandpass', 430, 7)
    const ringGain = gainNode(0.14)
    noise().connect(ring)
    ring.connect(ringGain)
    ringGain.connect(out)
    lfo(0.07, 0.11, ringGain.gain)
  })

  // 第六殿忘川：水流 + 拍岸碎响 + 河底低吟。
  buildLayer('reincarnation', (out) => {
    const flow = filter('bandpass', 880, 0.6)
    const flowGain = gainNode(0.28)
    noise().connect(flow)
    flow.connect(flowGain)
    flowGain.connect(out)
    lfo(0.21, 0.15, flowGain.gain)
    lfo(0.09, 260, flow.frequency)
    const lap = filter('highpass', 2400, 0.7)
    const lapGain = gainNode(0.06)
    noise().connect(lap)
    lap.connect(lapGain)
    lapGain.connect(out)
    lfo(0.33, 0.045, lapGain.gain)
    const drone = gainNode(0.11)
    tone('sine', 48).connect(drone)
    drone.connect(out)
  })

  // 第二殿业秤：铜梁微颤。
  buildLayer('scale', (out) => {
    const beam = filter('lowpass', 520, 1)
    const beamGain = gainNode(0.18)
    beam.connect(beamGain)
    beamGain.connect(out)
    tone('sine', 110).connect(beam)
    tone('sine', 164.8).connect(beam)
    lfo(0.19, 0.07, beamGain.gain)
    const air = filter('highpass', 1800, 0.6)
    const airGain = gainNode(0.045)
    noise().connect(air)
    air.connect(airGain)
    airGain.connect(out)
  })

  // 第三殿簿库：纸页浮尘。
  buildLayer('archive', (out) => {
    const paper = filter('highpass', 1500, 0.5)
    const paperGain = gainNode(0.08)
    noise().connect(paper)
    paper.connect(paperGain)
    paperGain.connect(out)
    lfo(0.27, 0.055, paperGain.gain)
    const dust = gainNode(0.09)
    tone('sine', 72).connect(dust)
    dust.connect(out)
  })

  const setAct = (act: ActId): void => {
    const now = context.currentTime
    for (const key of Object.keys(layers) as ActId[]) {
      const param = layers[key].gain
      param.cancelScheduledValues(now)
      param.setValueAtTime(param.value, now)
      param.linearRampToValueAtTime(key === act ? 1 : 0, now + 1.4)
    }
  }

  const cue = (kind: CueKind): void => {
    const now = context.currentTime
    const blip = (type: OscillatorType, frequency: number, peak: number, decay: number): void => {
      const osc = context.createOscillator()
      osc.type = type
      osc.frequency.value = frequency
      const env = gainNode(0.0001)
      env.gain.setValueAtTime(0.0001, now)
      env.gain.exponentialRampToValueAtTime(peak, now + 0.012)
      env.gain.exponentialRampToValueAtTime(0.0001, now + decay)
      osc.connect(env)
      env.connect(sfx)
      osc.start(now)
      osc.stop(now + decay + 0.05)
      osc.onended = () => { osc.disconnect(); env.disconnect() }
    }
    const burst = (type: BiquadFilterType, frequency: number, peak: number, decay: number): void => {
      const source = context.createBufferSource()
      source.buffer = buffer
      source.loop = true
      const shaped = filter(type, frequency, 0.8)
      const env = gainNode(0.0001)
      env.gain.setValueAtTime(0.0001, now)
      env.gain.exponentialRampToValueAtTime(peak, now + 0.01)
      env.gain.exponentialRampToValueAtTime(0.0001, now + decay)
      source.connect(shaped)
      shaped.connect(env)
      env.connect(sfx)
      source.start(now)
      source.stop(now + decay + 0.05)
      source.onended = () => { source.disconnect(); shaped.disconnect(); env.disconnect() }
    }
    if (kind === 'ok') {
      blip('sine', 660, 0.3, 0.24)
      blip('sine', 990, 0.15, 0.2)
      burst('bandpass', 2600, 0.06, 0.07)
    } else if (kind === 'fail') {
      blip('sine', 98, 0.32, 0.3)
      blip('triangle', 62, 0.16, 0.26)
      burst('lowpass', 200, 0.13, 0.16)
    } else if (kind === 'seal') {
      blip('sine', 523.25, 0.26, 0.9)
      blip('sine', 784, 0.17, 0.8)
      blip('sine', 1046.5, 0.1, 0.7)
      burst('bandpass', 1800, 0.08, 0.12)
    } else if (kind === 'ending') {
      blip('sine', 130.8, 0.3, 2.4)
      blip('sine', 196, 0.19, 2)
      blip('triangle', 261.6, 0.1, 1.6)
      burst('bandpass', 320, 0.12, 0.9)
    } else if (kind === 'step') {
      burst('lowpass', 340 + Math.random() * 90, 0.085, 0.1)
    } else {
      blip('sine', 440, 0.12, 0.12)
    }
  }

  const setMuted = (value: boolean): void => {
    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(value ? 0 : MASTER_VOLUME, now + 0.18)
  }

  return { context, setAct, cue, setMuted }
}

const audioToggle = document.createElement('button')
audioToggle.id = 'audio-toggle'
audioToggle.type = 'button'
document.body.appendChild(audioToggle)

function updateAudioToggle(): void {
  audioToggle.textContent = !audioUnlocked ? '音 · 待启（M）' : muted ? '音 · 静音（M）' : '音 · 开（M）'
  audioToggle.classList.toggle('muted', muted)
  audioToggle.setAttribute('aria-pressed', String(muted))
}

// 只在真实用户手势里创建 / 恢复 AudioContext，无手势绝不出声。
function unlockAudio(): void {
  if (rig) {
    if (rig.context.state === 'suspended') void rig.context.resume().catch(() => undefined)
    return
  }
  try {
    rig = createAudioRig()
    if (!rig) return
    audioUnlocked = true
    rig.setMuted(muted)
    rig.setAct(currentAct)
    void rig.context.resume().catch(() => undefined)
  } catch {
    rig = null
    audioUnlocked = false
  }
  updateAudioToggle()
}

function toggleMute(): void {
  muted = !muted
  if (!rig) unlockAudio()
  rig?.setMuted(muted)
  updateAudioToggle()
  toast(muted ? '声音已静音。再按 M 恢复。' : '声音已开启。', 2.5)
}

audioToggle.addEventListener('click', (event) => {
  event.stopPropagation()
  toggleMute()
})

document.addEventListener('visibilitychange', () => {
  if (!rig) return
  if (document.hidden) void rig.context.suspend().catch(() => undefined)
  else if (audioUnlocked) void rig.context.resume().catch(() => undefined)
})

updateAudioToggle()

// ===================== 引路牌（B8 导航可读性） =====================
// 锁定提示条 lockHint 已在指针锁段落创建（必须早于监听器注册，避免 TDZ）。
const wayfinder = document.createElement('div')
wayfinder.id = 'wayfinder'
wayfinder.innerHTML = `
  <span class="wf-arrow" aria-hidden="true">↑</span>
  <span class="wf-body"><strong class="wf-name">引路</strong><small class="wf-meta">—</small></span>`
document.body.appendChild(wayfinder)
const wfArrow = wayfinder.querySelector<HTMLElement>('.wf-arrow')!
const wfName = wayfinder.querySelector<HTMLElement>('.wf-name')!
const wfMeta = wayfinder.querySelector<HTMLElement>('.wf-meta')!

const PALACE_LAYOUT = [[8, 1, 6], [3, 5, 7], [4, 9, 2]]
const goalPosition = new THREE.Vector3()
const goalForward = new THREE.Vector3()
const goalDelta = new THREE.Vector3()
const goalRight = new THREE.Vector3()
let wayfinderTimer = 0
let lastWayfinderKey = ''

function findInteraction(kind: string, id?: string, act?: ActId): WorldInteraction | null {
  return world.interactions.find((item) => item.kind === kind && item.enabled && (id === undefined || item.id === id) && (act === undefined || item.act === act)) ?? null
}

function currentGoal(): { name: string; meta: string; position: THREE.Vector3 } | null {
  const act = currentAct
  const definition = actDefinition(act)
  const nextAct = ACTS[ACTS.findIndex((item) => item.id === act) + 1]
  const exit = findInteraction('exit', 'exit', act)
  const seal = findInteraction('seal', undefined, act)

  if (act === 'reincarnation') {
    if (!combined) {
      const combine = findInteraction('combine')
      if (combine) return { name: '合六印 · 开三条路', meta: journey.canCombine ? '骑缝可合' : '还缺半印④⑤', position: combine.object.getWorldPosition(goalPosition) }
      return null
    }
    const unlocked = journey.unlockedEndings
    let best: WorldInteraction | null = null
    let bestDistance = Number.POSITIVE_INFINITY
    for (const id of unlocked) {
      const candidate = findInteraction('ending', id)
      if (!candidate) continue
      const distance = candidate.object.getWorldPosition(goalDelta).distanceTo(camera.position)
      if (distance < bestDistance) { bestDistance = distance; best = candidate }
    }
    if (best) return { name: `结局 · ${ENDINGS[best.id as EndingId].title}`, meta: `已解锁 ${unlocked.length} / 3`, position: best.object.getWorldPosition(goalPosition) }
    return null
  }

  if (completed.has(act) && exit) {
    return { name: nextAct ? `出门 → ${nextAct.number} · ${nextAct.title}` : '出门 → 下一殿', meta: '殿门已开', position: exit.object.getWorldPosition(goalPosition) }
  }
  if (seal) return { name: seal.label, meta: '谜题已成 · 收印', position: seal.object.getWorldPosition(goalPosition) }

  if (act === 'medicine') {
    const taken = medicine.progress
    const next = HERBS.find((herb) => !taken.includes(herb.id))
    const herb = next ? findInteraction('herb', next.id) : null
    if (herb && next) return { name: `药柜 · ${next.name}（${next.role}）`, meta: `已入 ${taken.length} / 4 味`, position: herb.object.getWorldPosition(goalPosition) }
  }
  if (act === 'palace') {
    const value = PALACE_LAYOUT.flat().includes(palace.progress + 1) ? palace.progress + 1 : 1
    const row = PALACE_LAYOUT.findIndex((line) => line.includes(value))
    const column = PALACE_LAYOUT[row].indexOf(value)
    goalPosition.set((column - 1) * 2.05, 0.2, -25.7 - row * 2.05)
    return { name: `踏石板 ${value}`, meta: `已踏 ${palace.progress} / 9 步`, position: goalPosition }
  }
  if (act === 'scale') {
    if (scalePuzzle.isBalanced) {
      const hour = findInteraction('weight', 'yiliang-extra')
      if (hour) return { name: '把多出的一两压进未时', meta: `左盘 ${scalePuzzle.sum} 两 · 已平`, position: hour.object.getWorldPosition(goalPosition) }
    }
    const weight = findInteraction('weight', undefined, 'scale')
    if (weight) return { name: weight.label, meta: `左盘 ${scalePuzzle.sum} / 50 两`, position: weight.object.getWorldPosition(goalPosition) }
    const gatha = findInteraction('inscription', 'gatha')
    if (gatha) return { name: '偈要一句句读，读到秤平为止', meta: '十六两为一斤', position: gatha.object.getWorldPosition(goalPosition) }
  }
  if (act === 'archive') {
    // 架上另有甲午/庚申两册错册且永不禁用；不指定 id 会一直指向甲午册，玩家永远找不到丙午册。
    const target = !archive.isFound ? findInteraction('register', 'bingwu', 'archive')
      : !archive.isRevealed ? findInteraction('lamp', undefined, 'archive')
        : findInteraction('brush', undefined, 'archive')
    if (target) {
      const meta = !archive.isFound ? '先找丙午年册' : !archive.isRevealed ? '正光照字，侧光照改。' : '朱笔勘合'
      return { name: target.label, meta, position: target.object.getWorldPosition(goalPosition) }
    }
  }
  const fallback = findInteraction('exit', 'exit', act) ?? findInteraction('herb', undefined, act)
  if (fallback) return { name: fallback.label, meta: definition.subtitle, position: fallback.object.getWorldPosition(goalPosition) }
  return null
}

function updateWayfinder(): void {
  if (won) {
    wayfinder.classList.add('hidden')
    return
  }
  wayfinder.classList.remove('hidden')
  const goal = currentGoal()
  if (!goal) {
    wfArrow.style.transform = 'rotate(0deg)'
    wfName.textContent = '引路'
    wfMeta.textContent = '殿内已无事 · 找暗门'
    return
  }
  goalDelta.copy(goal.position).sub(camera.position)
  goalDelta.y = 0
  const distance = goalDelta.length()
  camera.getWorldDirection(goalForward)
  goalForward.y = 0
  if (goalForward.lengthSq() < 1e-6) goalForward.set(0, 0, -1)
  goalForward.normalize()
  goalRight.set(-goalForward.z, 0, goalForward.x)
  const angle = Math.atan2(goalDelta.dot(goalRight), goalDelta.dot(goalForward))
  wfArrow.style.transform = `rotate(${(angle * 180 / Math.PI).toFixed(1)}deg)`
  const key = `${goal.name}|${goal.meta}|${distance.toFixed(1)}`
  if (key === lastWayfinderKey) return
  lastWayfinderKey = key
  wfName.textContent = goal.name
  wfMeta.textContent = `${goal.meta} · ${distance.toFixed(1)} m`
  wayfinder.classList.toggle('near', distance <= 3.4)
}

function animate(): void {
  const delta = Math.min(clock.getDelta(), 0.05)
  updateMovement(delta)
  world.update(delta)
  updateFocus()
  updateFocusOutline()
  focusOutline?.update()
  if (toastTimer > 0) {
    toastTimer -= delta
    if (toastTimer <= 0) toastEl.classList.add('hidden')
  }
  wayfinderTimer -= delta
  if (wayfinderTimer <= 0) {
    wayfinderTimer = 0.1
    updateWayfinder()
  }
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

animate()

// 供自动化截图与回归测试读取机位，不参与渲染。
Object.assign(window, { __camera: camera })

if (!previewMode.has('clean')) {
  if (currentAct === 'scale') dialogue('业秤司吏', '善恶自有斤两。左盘三十两，是你生前自己称下的。补足它，一样都不能少，也一样都不能多。', 12)
  if (currentAct === 'archive') dialogue('籍房司吏', '落户要三样：生辰、卒年、案由。你缺一样。', 12)
  if (currentAct === 'medicine') dialogue('孟婆', '本房核汤。今天这碗，你自己配。当归三钱，远志一盏，合欢未开，忘忧在碗底。按君、臣、佐、使。', 12)
  if (currentAct === 'palace') dialogue('掌印司吏', '本房核位。戴九履一，左三右七。踩完，印自己会落。', 12)
  if (currentAct === 'reincarnation') dialogue('孟婆', '汤带了没有？', 12)
}
updateInventory()
if (currentAct === 'scale') updateScaleObjective()
if (currentAct === 'archive') updateArchiveObjective()
