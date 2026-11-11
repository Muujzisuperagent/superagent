import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { PasswordLock } from './puzzle'
import { buildRoom } from './scene'

const app = document.getElementById('app')!
const promptEl = document.getElementById('prompt')!
const keypadEl = document.getElementById('keypad')!
const keypadForm = document.getElementById('keypad-form') as HTMLFormElement
const keypadInput = document.getElementById('keypad-input') as HTMLInputElement
const keypadMessage = document.getElementById('keypad-message')!
const keypadClose = document.getElementById('keypad-close') as HTMLButtonElement
const winEl = document.getElementById('win')!

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0b0a0d)
scene.fog = new THREE.FogExp2(0x0b0a0d, 0.035)

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100)
camera.position.set(0, 1.65, 4.4)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
app.appendChild(renderer.domElement)

scene.add(new THREE.HemisphereLight(0x8a7a63, 0x0a0910, 0.7))
const fill = new THREE.PointLight(0x6f7cff, 6, 18, 2)
fill.position.set(0, 3.4, 2.5)
scene.add(fill)

const room = buildRoom(scene)
const lock = new PasswordLock()

const controls = new PointerLockControls(camera, renderer.domElement)
const clock = new THREE.Clock()
const keys = new Set<string>()
const raycaster = new THREE.Raycaster()
const center = new THREE.Vector2(0, 0)

let keypadOpen = false
let won = false
let focused = false

function setPrompt(text: string | null): void {
  if (text === null) {
    promptEl.classList.add('hidden')
    promptEl.textContent = ''
  } else {
    promptEl.classList.remove('hidden')
    promptEl.textContent = text
  }
}

function openKeypad(): void {
  keypadOpen = true
  setPrompt(null)
  keypadMessage.textContent = '四位数。注意墙上的划痕。'
  keypadMessage.classList.remove('error')
  keypadInput.value = ''
  keypadEl.classList.remove('hidden')
  controls.unlock()
  keypadInput.focus()
}

function closeKeypad(): void {
  keypadOpen = false
  keypadEl.classList.add('hidden')
}

keypadClose.addEventListener('click', closeKeypad)

keypadInput.addEventListener('input', () => {
  keypadInput.value = keypadInput.value.replace(/\D/g, '').slice(0, 4)
})

keypadForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const result = lock.tryCode(keypadInput.value)
  keypadMessage.textContent = result.message
  keypadMessage.classList.toggle('error', !result.ok)

  if (!result.ok) {
    keypadInput.select()
    return
  }

  closeKeypad()
  room.openDoor()
  setPrompt('门开了。')
  window.setTimeout(() => {
    won = true
    controls.unlock()
    winEl.classList.remove('hidden')
  }, 1400)
})

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && keypadOpen) {
    closeKeypad()
    return
  }
  if (keypadOpen || won) return
  keys.add(event.code)
  if (event.code === 'KeyE' && focused) openKeypad()
})

window.addEventListener('keyup', (event) => {
  keys.delete(event.code)
})

renderer.domElement.addEventListener('click', () => {
  if (!keypadOpen && !won && !controls.isLocked) controls.lock()
})

function updateMovement(delta: number): void {
  if (!controls.isLocked || keypadOpen || won) return
  const speed = 3.1
  const step = speed * delta

  if (keys.has('KeyW') || keys.has('ArrowUp')) controls.moveForward(step)
  if (keys.has('KeyS') || keys.has('ArrowDown')) controls.moveForward(-step)
  if (keys.has('KeyA') || keys.has('ArrowLeft')) controls.moveRight(-step)
  if (keys.has('KeyD') || keys.has('ArrowRight')) controls.moveRight(step)

  const limit = 5.45
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -limit, limit)
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -limit, limit)
  camera.position.y = 1.65
}

function updateFocus(): void {
  focused = false
  if (!controls.isLocked || keypadOpen || won) {
    room.setKeypadHighlight(false)
    if (!keypadOpen && !won) setPrompt(null)
    return
  }

  raycaster.setFromCamera(center, camera)
  const hit = raycaster.intersectObject(room.keypad, false)[0]
  const near = hit !== undefined && hit.distance <= 3.2
  room.setKeypadHighlight(near)
  focused = near
  setPrompt(near ? '按 E 输入密码' : null)
}

function animate(): void {
  const delta = Math.min(clock.getDelta(), 0.05)
  updateMovement(delta)
  room.update(delta)
  updateFocus()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

animate()
