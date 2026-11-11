import * as THREE from 'three'

export interface Room {
  readonly keypad: THREE.Mesh
  openDoor: () => void
  update: (delta: number) => void
  setKeypadHighlight: (on: boolean) => void
}

const WALL = 0x2a2730
const FLOOR = 0x1b1a20
const DOOR = 0x3b2b22

export function buildRoom(scene: THREE.Scene): Room {
  const room = new THREE.Group()
  scene.add(room)

  const wallMaterial = new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.92 })
  const floorMaterial = new THREE.MeshStandardMaterial({ color: FLOOR, roughness: 0.82 })
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x151419, roughness: 1 })
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x5d4b33,
    roughness: 0.45,
    metalness: 0.65
  })
  const keypadMaterial = new THREE.MeshStandardMaterial({
    color: 0x9d7b3f,
    roughness: 0.35,
    metalness: 0.4,
    emissive: 0x2a1a08,
    emissiveIntensity: 0.7
  })

  const addBox = (
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    room.add(mesh)
    return mesh
  }

  // 12 x 12 room, four metres high.
  addBox(12, 0.2, 12, 0, -0.1, 0, floorMaterial)
  addBox(12, 0.2, 12, 0, 4.1, 0, ceilingMaterial)
  addBox(12, 4, 0.2, 0, 2, 6, wallMaterial)
  addBox(0.2, 4, 12, 6, 2, 0, wallMaterial)
  addBox(0.2, 4, 12, -6, 2, 0, wallMaterial)

  // North wall with a 1.6 m doorway.
  addBox(5.2, 4, 0.2, -3.4, 2, -6, wallMaterial)
  addBox(5.2, 4, 0.2, 3.4, 2, -6, wallMaterial)
  addBox(1.6, 1.4, 0.2, 0, 3.3, -6, wallMaterial)

  const doorPivot = new THREE.Group()
  doorPivot.position.set(-0.8, 0, -5.88)
  room.add(doorPivot)

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.08), metalDoorMaterial())
  door.position.set(0.8, 1.3, 0)
  door.castShadow = true
  doorPivot.add(door)
  addDoorBands(doorPivot)

  // Keypad beside the doorway.
  addBox(0.46, 0.64, 0.07, 1.55, 1.45, -5.9, metalMaterial)
  const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.05), keypadMaterial)
  keypad.position.set(1.55, 1.45, -5.84)
  keypad.castShadow = true
  keypad.userData.interactive = 'keypad'
  room.add(keypad)

  addTorch(room, -4.6, 2.6, 4.6)
  addTorch(room, 4.6, 2.6, 4.6)
  addTorch(room, -4.6, 2.6, -4.6)

  let doorOpen = false
  let doorProgress = 0

  const update = (delta: number): void => {
    if (!doorOpen || doorProgress >= 1) return
    doorProgress = Math.min(1, doorProgress + delta / 1.4)
    const eased = 1 - Math.pow(1 - doorProgress, 3)
    doorPivot.rotation.y = -Math.PI * 0.52 * eased
  }

  const setKeypadHighlight = (on: boolean): void => {
    keypadMaterial.emissive.setHex(on ? 0x8a5b16 : 0x2a1a08)
    keypadMaterial.emissiveIntensity = on ? 1.6 : 0.7
  }

  return {
    keypad,
    openDoor: () => {
      doorOpen = true
    },
    update,
    setKeypadHighlight
  }
}

function metalDoorMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: DOOR,
    roughness: 0.55,
    metalness: 0.5
  })
}

function addDoorBands(pivot: THREE.Group): void {
  const bandMaterial = new THREE.MeshStandardMaterial({ color: 0x8a6a34, roughness: 0.4, metalness: 0.7 })
  for (const y of [0.55, 1.95]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.11), bandMaterial)
    band.position.set(0.8, y, 0)
    pivot.add(band)
  }
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), bandMaterial)
  handle.position.set(1.42, 1.28, 0.09)
  pivot.add(handle)
}

function addTorch(parent: THREE.Group, x: number, y: number, z: number): void {
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffb15a, emissive: 0xff7a1a, emissiveIntensity: 2 })
  )
  flame.position.set(x, y, z)
  parent.add(flame)

  const light = new THREE.PointLight(0xff9a4a, 18, 14, 2)
  light.position.set(x, y - 0.1, z)
  light.castShadow = true
  light.shadow.mapSize.set(512, 512)
  parent.add(light)
}
