import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { actDefinition, EscapeWorld, type WorldInteraction } from './scene'
import { ENDINGS, JourneyState, MedicinePuzzle, NinePalacePuzzle, type ActId, type EndingId } from './story'

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
scene.background = new THREE.Color(0x0b0a0d)
scene.fog = new THREE.FogExp2(0x0b0a0d, 0.035)

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 130)
camera.position.set(0, 1.65, 4.4)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = false
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
app.appendChild(renderer.domElement)

const world = new EscapeWorld(scene)
const medicine = new MedicinePuzzle()
const palace = new NinePalacePuzzle()
const journey = new JourneyState()
const completed = new Set<ActId>()

const controls = new PointerLockControls(camera, renderer.domElement)
const clock = new THREE.Clock()
const keys = new Set<string>()
const raycaster = new THREE.Raycaster()
const center = new THREE.Vector2(0, 0)

let won = false
let focused: WorldInteraction | null = null
let currentAct: ActId = 'medicine'
let toastTimer = 0
let combined = false
let standingStone = 0

function setPrompt(text: string | null): void {
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

function updateAct(): void {
  const act = world.actAt(camera.position.z)
  if (act === currentAct) return
  currentAct = act
  const definition = actDefinition(act)
  actEl.textContent = `${definition.number} · ${definition.title}`
  objectiveEl.textContent = definition.objective
  toast(`${definition.number} · ${definition.title}｜${definition.subtitle}`, 3)
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
  if (event.code === 'F8') camera.position.set(0, 1.65, -21)
  if (event.code === 'F9') camera.position.set(0, 2, -47)
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

dialogue('孟婆', '本房核汤。今天这碗，你自己配。当归三钱，远志一盏，合欢未开，忘忧在碗底。按君、臣、佐、使。', 12)
updateInventory()
