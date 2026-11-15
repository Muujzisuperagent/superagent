import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { actDefinition, EscapeWorld, type WorldInteraction } from './scene'
import { ENDINGS, JourneyState, MedicinePuzzle, NinePalacePuzzle, type ActId, type EndingId } from './story'
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

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x080d0d)
scene.fog = new THREE.FogExp2(0x121c1a, 0.018)

const previewMode = new URLSearchParams(window.location.search)
const previewViews: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  scale: { position: [0, 2.9, 51.5], target: [0, 1.5, 45.5] },
  archive: { position: [-2.2, 2.2, 27.5], target: [4.8, 1.9, 18.5] },
  medicine: { position: [0, 2.4, 4.7], target: [0, 1.35, -1.8] },
  palace: { position: [0, 5, -21.2], target: [0, 0.2, -29.5] },
  river: { position: [-3, 4.5, -43], target: [0, 1.4, -62] }
}
const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.05, 130)
const preview = previewViews[previewMode.get('view') ?? '']
camera.position.set(...(preview?.position ?? [1.6, 1.65, 52]))
if (preview) camera.lookAt(...preview.target)
else camera.lookAt(0, 1.7, 46.8)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
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
const clock = new THREE.Clock()
const keys = new Set<string>()
const raycaster = new THREE.Raycaster()
raycaster.far = 3.4
const center = new THREE.Vector2(0, 0)

let won = false
let focused: WorldInteraction | null = null
let currentAct: ActId = world.actAt(camera.position.z)
let toastTimer = 0
let combined = false
let standingStone = 0
world.setAtmosphere(currentAct)

const initialAct = actDefinition(currentAct)
actEl.textContent = `${initialAct.number} · ${initialAct.title}`
objectiveEl.textContent = initialAct.objective

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
  objectiveEl.textContent = `①找出丙午年册 ${archive.isFound ? '✓' : ''}　→　②侧光验刮改 ${archive.isRevealed ? '✓' : ''}　→　③朱笔勘合 ${archive.isSolved ? '✓' : ''}`
}

function updateAct(): void {
  const act = world.actAt(camera.position.z)
  if (act === currentAct) return
  currentAct = act
  world.setAtmosphere(act)
  const definition = actDefinition(act)
  actEl.textContent = `${definition.number} · ${definition.title}`
  objectiveEl.textContent = definition.objective
  toast(`${definition.number} · ${definition.title}｜${definition.subtitle}`, 3)
  if (act === 'scale') {
    dialogue('业秤司吏', '善恶自有斤两。左盘三十两，是你生前自己称下的。补足它，一样都不能多。', 10)
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
  updateInventory()
  if (act === 'medicine') {
    toast('半印④落下。不忘汤入手。北门已开。', 6)
    dialogue('孟婆', '别人求忘，你求记。稀奇。')
  } else if (act === 'palace') {
    toast('半印⑤落下。路引浮字：按例应问案由。未问。', 7)
    dialogue('掌印司吏', '完了。下一房。')
  } else if (act === 'scale') {
    journey.collectEvidence('B')
    toast('半印②落下。证据 B 已入路引：你名下多出的一两——不是你挣的。南门已开。', 7)
    dialogue('业秤司吏', '称过了。下一房，籍房。')
  } else if (act === 'archive') {
    journey.collectEvidence('C')
    toast('半印③落下。证据 C：簿页残片。刮改的笔迹，是你的。南门已开。', 7)
    dialogue('籍房司吏', '落户要三样。你现在齐了。去吧。')
  }
}

function showEnding(id: EndingId): void {
  won = true
  controls.unlock()
  const ending = ENDINGS[id]
  endingContent.innerHTML = `<span>${ending.subtitle}</span><h2>${ending.title}</h2><p>${ending.text}</p><small>${ending.condition}</small>`
  endingEl.classList.remove('hidden')
}

function interact(target: WorldInteraction): void {
  if (target.kind === 'herb') {
    const result = medicine.select(target.id)
    toast(result.message)
    if (result.solved) world.setActSolved('medicine')
  } else if (target.kind === 'bowl') {
    dialogue('青瓷药碗', '碗沿一圈旧药渍。碗底刻着两个字：阿满。你不认得这个名字。手却没放下。', 10)
  } else if (target.kind === 'evidence') {
    journey.collectEvidence(target.id)
    target.enabled = false
    target.object.visible = false
    toast(`证据 ${target.id} 已收入路引。`)
    updateInventory()
  } else if (target.kind === 'seal') {
    finishAct(target.act)
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
        dialogue('业秤司吏', '善恶自有斤两。多出这一两，不是你的。压进未时，这一案就算你认了。', 10)
      }
      updateScaleObjective()
    }
  } else if (target.kind === 'inscription') {
    dialogue('足秤偈', '十六两为一斤，五十两为足秤。左盘三十两，是你生前自己称下的。补足它。多一两者过，少一两者贪。', 12)
  } else if (target.kind === 'hourplate') {
    dialogue('十二时辰盘', '盘上十二槽。只有未时槽里落了东西——秤平之后，它自己会认你。', 9)
  } else if (target.kind === 'register') {
    const result = archive.openRegister(target.id)
    toast(result.message, 6)
    if (archive.isFound) {
      world.markRegisterFound()
      updateArchiveObjective()
    }
  } else if (target.kind === 'lamp') {
    const result = archive.shineLamp()
    toast(result.message, 7)
    if (archive.isRevealed) {
      world.revealScrape()
      const brushTarget = world.interactions.find((item) => item.kind === 'brush')
      if (brushTarget) brushTarget.enabled = true
      updateArchiveObjective()
    }
  } else if (target.kind === 'brush') {
    const result = archive.compare()
    toast(result.message, 7)
    if (result.solved) {
      world.setActSolved('archive')
      updateArchiveObjective()
    }
  } else if (target.kind === 'exit') {
    camera.position.z -= 1.1
    updateAct()
  } else if (target.kind === 'combine') {
    if (!journey.canCombine) {
      toast('骑缝未合。先取得第四、第五殿的半印。')
      return
    }
    if (combined) return
    combined = true
    world.showEndings()
    journey.completeAct('reincarnation')
    updateInventory()
    dialogue('崔珏', '三年前，阿满病危。你拿自己的名字，押她几年阳寿。原告是你。被告是你。办案的，也是你。这案子，我审不了。', 14)
    toast('六印合成。朱字浮出——那是你的笔迹。三条路已亮。', 8)
  } else if (target.kind === 'ending') {
    const id = target.id as EndingId
    if (journey.unlockedEndings.includes(id)) showEnding(id)
    else toast(`结局未解锁：${ENDINGS[id].condition}`)
  }
}

restartButton.addEventListener('click', () => window.location.reload())

window.addEventListener('keydown', (event) => {
  if (won) return
  keys.add(event.code)
  if (event.code === 'KeyE' && focused) interact(focused)
})

window.addEventListener('keyup', (event) => {
  keys.delete(event.code)
})

renderer.domElement.addEventListener('click', () => {
  if (!won && !controls.isLocked) controls.lock()
})

function updateMovement(delta: number): void {
  if (!controls.isLocked || won) return
  const speed = 3.1
  const step = speed * delta
  const previous = camera.position.clone()

  if (keys.has('KeyW') || keys.has('ArrowUp')) controls.moveForward(step)
  if (keys.has('KeyS') || keys.has('ArrowDown')) controls.moveForward(-step)
  if (keys.has('KeyA') || keys.has('ArrowLeft')) controls.moveRight(-step)
  if (keys.has('KeyD') || keys.has('ArrowRight')) controls.moveRight(step)

  world.constrain(camera.position, previous, completed)
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

function updateFocus(): void {
  focused = null
  if (!controls.isLocked || won) {
    setPrompt(null)
    return
  }

  raycaster.setFromCamera(center, camera)
  const enabled = world.interactions.filter((item) => item.enabled)
  const hits = raycaster.intersectObjects(enabled.map((item) => item.object), false)
  const hit = hits.find((item) => item.distance <= 3.4)
  focused = hit ? enabled.find((item) => item.object === hit.object) ?? null : null
  setPrompt(focused ? `E · ${focused.label}` : null)
}

function animate(): void {
  const delta = Math.min(clock.getDelta(), 0.05)
  updateMovement(delta)
  world.update(delta)
  updateFocus()
  if (toastTimer > 0) {
    toastTimer -= delta
    if (toastTimer <= 0) toastEl.classList.add('hidden')
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

if (!previewMode.has('clean')) {
  if (currentAct === 'scale') dialogue('业秤司吏', '善恶自有斤两。左盘三十两，是你生前自己称下的。补足它，一样都不能多。', 12)
  if (currentAct === 'archive') dialogue('籍房司吏', '落户要三样：生辰、卒年、案由。你缺一样。', 12)
  if (currentAct === 'medicine') dialogue('孟婆', '本房核汤。今天这碗，你自己配。当归三钱，远志一盏，合欢未开，忘忧在碗底。按君、臣、佐、使。', 12)
  if (currentAct === 'palace') dialogue('掌印司吏', '本房核位。戴九履一，左三右七。踩完，印自己会落。', 12)
  if (currentAct === 'reincarnation') dialogue('孟婆', '汤带了没有？', 12)
}
updateInventory()
if (currentAct === 'scale') updateScaleObjective()
if (currentAct === 'archive') updateArchiveObjective()
