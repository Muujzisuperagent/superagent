import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { ACTS, type ActId } from './story'

export type InteractionKind = 'herb' | 'bowl' | 'seal' | 'exit' | 'combine' | 'ending' | 'evidence'

export type WorldInteraction = {
  object: THREE.Object3D
  kind: InteractionKind
  act: ActId
  id: string
  label: string
  enabled: boolean
}

type Zone = { act: ActId; center: number; halfDepth: number; width: number }

function surfaceTexture(kind: 'wood' | 'stone' | 'plaster' | 'cloth' | 'paper'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')!
  const palettes = {
    wood: ['#514b3f', '#6a6250', '#7a705b', '#575346'],
    stone: ['#47514c', '#59645f', '#68716b', '#3f4b47'],
    plaster: ['#343b37', '#414a45', '#535a52', '#3e4742'],
    cloth: ['#707971', '#8a9085', '#56615a', '#a0a18f'],
    paper: ['#b9b294', '#d4c9aa', '#918a73', '#ddd2b4']
  }
  context.fillStyle = palettes[kind][0]
  context.fillRect(0, 0, 512, 512)
  for (let index = 0; index < 2400; index += 1) {
    const color = palettes[kind][Math.floor(Math.random() * palettes[kind].length)]
    context.globalAlpha = 0.04 + Math.random() * 0.13
    context.fillStyle = color
    if (kind === 'wood') {
      const y = Math.random() * 512
      context.fillRect(0, y, 512, 1 + Math.random() * 8)
    } else if (kind === 'cloth') {
      context.fillRect(Math.random() * 512, 0, 1, 512)
    } else {
      context.beginPath()
      context.ellipse(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 35, 2 + Math.random() * 18, Math.random(), 0, Math.PI * 2)
      context.fill()
    }
  }
  context.globalAlpha = 0.2
  if (kind === 'wood') {
    for (let index = 0; index < 34; index += 1) {
      const y = Math.random() * 512
      context.strokeStyle = index % 2 ? '#080b0b' : '#80775f'
      context.lineWidth = Math.random() * 1.5 + 0.25
      context.beginPath()
      context.moveTo(0, y)
      context.bezierCurveTo(140, y - 18, 300, y + 22, 512, y - 5)
      context.stroke()
    }
  }
  context.globalAlpha = 1
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function mistTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')!
  context.clearRect(0, 0, canvas.width, canvas.height)
  for (let index = 0; index < 11; index += 1) {
    const x = 40 + Math.random() * 430
    const y = 35 + Math.random() * 190
    const radius = 24 + Math.random() * 95
    const cloud = context.createRadialGradient(x, y, 1, x, y, radius)
    cloud.addColorStop(0, 'rgba(221,232,226,0.36)')
    cloud.addColorStop(0.36, 'rgba(199,216,209,0.18)')
    cloud.addColorStop(1, 'rgba(160,182,176,0)')
    context.fillStyle = cloud
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const woodTexture = surfaceTexture('wood')
const stoneTexture = surfaceTexture('stone')
const plasterTexture = surfaceTexture('plaster')
const clothTexture = surfaceTexture('cloth')
const paperTexture = surfaceTexture('paper')
const mistMap = mistTexture()
const STONE = new THREE.MeshStandardMaterial({ map: stoneTexture, bumpMap: stoneTexture, bumpScale: 0.04, color: 0x87908b, roughness: 0.78, metalness: 0.015 })
const WET_STONE = new THREE.MeshPhysicalMaterial({ map: stoneTexture, bumpMap: stoneTexture, bumpScale: 0.045, color: 0x6f7974, roughness: 0.68, metalness: 0.015, clearcoat: 0.1, clearcoatRoughness: 0.52 })
const DARK_STONE = new THREE.MeshStandardMaterial({ map: plasterTexture, bumpMap: plasterTexture, bumpScale: 0.035, color: 0x8a9188, roughness: 0.9 })
const WOOD = new THREE.MeshStandardMaterial({ map: woodTexture, bumpMap: woodTexture, bumpScale: 0.025, color: 0x95876c, roughness: 0.62 })
const BRONZE = new THREE.MeshStandardMaterial({ color: 0x58635a, roughness: 0.43, metalness: 0.72 })
const CLOTH = new THREE.MeshStandardMaterial({ map: clothTexture, bumpMap: clothTexture, bumpScale: 0.025, color: 0xc6c5b3, roughness: 0.92, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
const PAPER = new THREE.MeshStandardMaterial({ map: paperTexture, color: 0xe0d7b8, emissive: 0x171408, emissiveIntensity: 0.12, roughness: 0.95, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
const CELADON = new THREE.MeshPhysicalMaterial({ color: 0x718f83, roughness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.12 })
const RED = new THREE.MeshStandardMaterial({ color: 0x761824, roughness: 0.7, side: THREE.DoubleSide })

const floatingObjects: THREE.Object3D[] = []
const animatedSteam: THREE.Object3D[] = []

function box(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material)
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function roundedBox(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material, radius = 0.04): THREE.Mesh {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 2, radius), material)
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function cylinder(parent: THREE.Object3D, radius: number, height: number, position: [number, number, number], material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20), material)
  mesh.position.set(...position)
  mesh.castShadow = true
  parent.add(mesh)
  return mesh
}

function bowl(parent: THREE.Object3D, position: [number, number, number], radius: number, height: number, material: THREE.Material): THREE.Mesh {
  const profile = [
    new THREE.Vector2(0, height * 0.08),
    new THREE.Vector2(radius * 0.62, height * 0.08),
    new THREE.Vector2(radius * 0.86, height * 0.15),
    new THREE.Vector2(radius, height * 0.84),
    new THREE.Vector2(radius * 0.92, height),
    new THREE.Vector2(radius * 0.8, height * 0.94),
    new THREE.Vector2(radius * 0.68, height * 0.2),
    new THREE.Vector2(0, height * 0.16)
  ]
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), material)
  mesh.position.set(...position)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function label(parent: THREE.Object3D, text: string, position: [number, number, number], width = 3.2, floor = false): void {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 160
  const context = canvas.getContext('2d')!
  context.fillStyle = '#211a15'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#756649'
  context.lineWidth = 5
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16)
  context.fillStyle = '#c9b78c'
  context.font = '56px "Noto Serif SC", serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4.8), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, side: THREE.DoubleSide }))
  mesh.position.set(...position)
  if (floor) mesh.rotation.x = -Math.PI / 2
  parent.add(mesh)
}

function light(parent: THREE.Object3D, position: [number, number, number], color = 0xa8d8c3, intensity = 5, radius = 0.11): void {
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 10), new THREE.MeshBasicMaterial({ color }))
  lamp.position.set(...position)
  parent.add(lamp)
  const source = new THREE.PointLight(color, intensity, 9, 1.7)
  source.position.set(...position)
  parent.add(source)
}

function addPaper(parent: THREE.Object3D, position: [number, number, number], size: [number, number], rotation: [number, number, number] = [0, 0, 0]): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), PAPER.clone())
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.userData.origin = mesh.position.clone()
  floatingObjects.push(mesh)
  parent.add(mesh)
  return mesh
}

function addBanner(parent: THREE.Object3D, position: [number, number, number], size: [number, number], rotationY = 0): THREE.Mesh {
  const rows = 10
  const columns = 6
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const t = row / rows
      const edge = (column === 0 || column === columns) && row === rows ? (column === 0 ? 0.08 : -0.05) : 0
      const x = (column / columns - 0.5) * size[0]
      const y = -t * size[1] + edge
      const wave = Math.sin(column * 0.9 + row * 0.36) * t * 0.24
      positions.push(x, y, wave)
      uvs.push(column / columns, 1 - t)
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column
        const b = a + columns + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const banner = new THREE.Mesh(geometry, CLOTH)
  banner.position.set(...position)
  banner.rotation.y = rotationY
  banner.userData.hang = true
  floatingObjects.push(banner)
  parent.add(banner)
  return banner
}

function addSteam(parent: THREE.Object3D, position: [number, number, number]): void {
  const steamMaterial = new THREE.MeshBasicMaterial({ color: 0xb5c9c1, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })
  for (let index = 0; index < 4; index += 1) {
    const points = []
    for (let step = 0; step <= 10; step += 1) {
      const t = step / 10
      points.push(new THREE.Vector3(Math.sin(t * 5 + index) * 0.08, t * (0.8 + index * 0.11), Math.cos(t * 3 + index) * 0.05))
    }
    const path = new THREE.CatmullRomCurve3(points)
    const wisp = new THREE.Mesh(new THREE.TubeGeometry(path, 20, 0.018 + index * 0.003, 5, false), steamMaterial.clone())
    wisp.position.set(position[0] + index * 0.05, position[1], position[2])
    wisp.userData.steamOffset = index
    animatedSteam.push(wisp)
    parent.add(wisp)
  }
}

function addLantern(parent: THREE.Object3D, position: [number, number, number], scale = 1): void {
  const lantern = new THREE.Group()
  lantern.position.set(...position)
  lantern.scale.setScalar(scale)
  parent.add(lantern)
  const lanternPaper = new THREE.MeshPhysicalMaterial({ color: 0xd4d2bb, roughness: 0.75, transparent: true, opacity: 0.78, emissive: 0x38433c, emissiveIntensity: 0.24 })
  roundedBox(lantern, [0.42, 0.7, 0.42], [0, 0, 0], lanternPaper, 0.12)
  for (const y of [-0.26, 0.26]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.018, 6, 24), BRONZE)
    ring.position.y = y
    ring.rotation.x = Math.PI / 2
    lantern.add(ring)
  }
  for (let index = 0; index < 4; index += 1) {
    const bar = box(lantern, [0.018, 0.64, 0.018], [Math.cos(index * Math.PI / 2) * 0.19, 0, Math.sin(index * Math.PI / 2) * 0.19], BRONZE)
    bar.castShadow = false
  }
  light(lantern, [0, 0, 0], 0xb8e7d5, 4.5, 0.07)
}

function addFootprint(parent: THREE.Object3D, position: [number, number, number], rotation = 0): void {
  const group = new THREE.Group()
  group.position.set(...position)
  group.rotation.y = rotation
  parent.add(group)
  const ink = new THREE.MeshBasicMaterial({ color: 0x111b1b, transparent: true, opacity: 0.68, depthWrite: false })
  const sole = new THREE.Mesh(new THREE.CircleGeometry(0.12, 18), ink)
  sole.scale.set(0.78, 1.65, 1)
  sole.rotation.x = -Math.PI / 2
  sole.position.y = 0.015
  group.add(sole)
  const toes = new THREE.Mesh(new THREE.CircleGeometry(0.075, 18), ink)
  toes.rotation.x = -Math.PI / 2
  toes.position.set(0, 0.016, -0.12)
  group.add(toes)
}

function addSoulSilhouette(parent: THREE.Object3D, position: [number, number, number], scale = 1): THREE.Group {
  const soul = new THREE.Group()
  soul.position.set(...position)
  soul.scale.setScalar(scale)
  parent.add(soul)
  const robeMaterial = new THREE.MeshStandardMaterial({ color: 0x171d1d, roughness: 0.98, side: THREE.DoubleSide })
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.45, 1.35, 10, 1, true), robeMaterial)
  robe.position.y = 0.82
  soul.add(robe)
  const innerRobe = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.4, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x202726, roughness: 1, side: THREE.DoubleSide }))
  innerRobe.position.y = 0.83
  soul.add(innerRobe)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0x101515, roughness: 1 }))
  head.position.y = 1.68
  soul.add(head)
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.43, 0.055, 20), WOOD)
  brim.position.y = 1.77
  soul.add(brim)
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.2, 16), WOOD)
  hat.position.y = 1.88
  soul.add(hat)
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.48), CLOTH)
  veil.position.set(0, 1.49, -0.12)
  soul.add(veil)
  for (const side of [-1, 1]) {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.62, 8), robeMaterial)
    sleeve.position.set(side * 0.32, 1.02, 0.03)
    sleeve.rotation.z = side * -0.18
    soul.add(sleeve)
  }
  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.055, 0.025), new THREE.MeshStandardMaterial({ color: 0x5a2524, roughness: 0.85 }))
  sash.position.set(0, 0.75, 0.34)
  soul.add(sash)
  return soul
}

function addBareTree(parent: THREE.Object3D, position: [number, number, number]): void {
  const tree = new THREE.Group()
  tree.position.set(...position)
  parent.add(tree)
  const bark = new THREE.MeshStandardMaterial({ color: 0x222928, roughness: 1, bumpMap: woodTexture, bumpScale: 0.06 })
  const paths = [
    [[0, 0, 0], [0.15, 2.2, 0], [-0.22, 3.9, 0.08], [0.12, 5.5, 0]],
    [[0.1, 2.5, 0], [0.95, 3.5, 0.05], [1.65, 4.5, 0], [2.4, 4.7, 0]],
    [[-0.1, 3.4, 0], [-0.95, 4.0, -0.05], [-1.55, 4.95, 0], [-2.25, 5.12, 0]],
    [[0.0, 4.45, 0], [0.42, 5.0, 0.08], [0.3, 5.65, 0.1], [0.7, 6.2, 0.1]],
    [[-0.88, 3.95, 0], [-1.5, 3.82, 0], [-1.95, 4.28, 0], [-2.45, 4.3, 0]]
  ] as const
  for (let index = 0; index < paths.length; index += 1) {
    const curve = new THREE.CatmullRomCurve3(paths[index].map((point) => new THREE.Vector3(...point)))
    const limb = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, index === 0 ? 0.16 : 0.07, 7, false), bark)
    tree.add(limb)
  }
}

export class EscapeWorld {
  readonly root = new THREE.Group()
  readonly interactions: WorldInteraction[] = []
  readonly zones: Zone[] = [
    { act: 'medicine', center: 0, halfDepth: 8, width: 13.6 },
    { act: 'palace', center: -28, halfDepth: 8, width: 13.6 },
    { act: 'reincarnation', center: -64, halfDepth: 19, width: 29 }
  ]
  private readonly stones = new Map<number, THREE.Mesh>()
  private readonly seals: THREE.Object3D[] = []
  private readonly wheels: THREE.Object3D[] = []
  private portal: THREE.Mesh | null = null
  private elapsed = 0
  private readonly backgroundTarget = new THREE.Color(0x080d0d)
  private readonly fogTarget = new THREE.Color(0x121c1a)
  private readonly fog = new THREE.FogExp2(0x121c1a, 0.018)

  constructor(private readonly scene: THREE.Scene) {
    scene.add(this.root)
    scene.background = new THREE.Color(0x080d0d)
    scene.fog = this.fog
    scene.add(new THREE.HemisphereLight(0x97aaa1, 0x1a211d, 0.92))
    const fill = new THREE.DirectionalLight(0x9caaa1, 0.58)
    fill.position.set(-2, 7, 4)
    fill.castShadow = true
    fill.shadow.mapSize.set(2048, 2048)
    fill.shadow.camera.left = -30
    fill.shadow.camera.right = 30
    fill.shadow.camera.top = 30
    fill.shadow.camera.bottom = -30
    scene.add(fill)
    this.buildMedicine()
    this.buildCorridor(-12)
    this.buildPalace()
    this.buildCorridor(-40)
    this.buildReincarnation()
    this.loadAssets()
  }

  private room(act: ActId, center: number, title: string): THREE.Group {
    const group = new THREE.Group()
    this.root.add(group)
    box(group, [14, 0.35, 16], [0, -0.175, center], STONE)
    const floorGeometry = new RoundedBoxGeometry(1.84, 0.13, 1.84, 1, 0.035)
    const pavers = new THREE.InstancedMesh(floorGeometry, STONE, 56)
    const paverTransform = new THREE.Object3D()
    let paverIndex = 0
    for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        paverTransform.position.set(-5.7 + column * 1.9 + (row % 2) * 0.12, 0.09, center - 6.65 + row * 1.9)
        paverTransform.rotation.y = Math.sin(row * 5 + column) * 0.012
        paverTransform.updateMatrix()
        pavers.setMatrixAt(paverIndex, paverTransform.matrix)
        pavers.setColorAt(paverIndex, new THREE.Color().setHSL(0.46, 0.055, 0.27 + Math.random() * 0.1))
        paverIndex += 1
      }
    }
    pavers.instanceMatrix.needsUpdate = true
    if (pavers.instanceColor) pavers.instanceColor.needsUpdate = true
    pavers.receiveShadow = true
    group.add(pavers)
    box(group, [0.35, 5.2, 16], [-7, 2.6, center], DARK_STONE)
    box(group, [0.35, 5.2, 16], [7, 2.6, center], DARK_STONE)
    for (const end of [-1, 1]) {
      const z = center + end * 8
      box(group, [5.7, 5.2, 0.35], [-4.15, 2.6, z], DARK_STONE)
      box(group, [5.7, 5.2, 0.35], [4.15, 2.6, z], DARK_STONE)
      box(group, [2.6, 1.9, 0.35], [0, 4.25, z], DARK_STONE)
      box(group, [0.28, 3.3, 0.6], [-1.45, 1.65, z], WOOD)
      box(group, [0.28, 3.3, 0.6], [1.45, 1.65, z], WOOD)
      box(group, [3.3, 0.28, 0.6], [0, 3.15, z], WOOD)
      box(group, [3.1, 0.13, 0.18], [0, 0.14, z + end * 0.19], BRONZE)
    }
    for (const x of [-6.55, 6.55]) {
      for (const z of [center - 6.2, center, center + 6.2]) {
        roundedBox(group, [0.66, 0.32, 0.75], [x, 0.18, z], WOOD, 0.045)
        cylinder(group, 0.22, 4.6, [x, 2.65, z], WOOD)
        roundedBox(group, [0.64, 0.28, 0.72], [x, 4.96, z], WOOD, 0.04)
      }
    }
    if (act !== 'palace') {
      box(group, [14, 0.22, 0.36], [0, 4.78, center - 5.2], WOOD)
      box(group, [14, 0.22, 0.36], [0, 4.78, center + 5.2], WOOD)
      box(group, [0.36, 0.22, 10], [-5.4, 4.78, center], WOOD)
      box(group, [0.36, 0.22, 10], [5.4, 4.78, center], WOOD)
      for (let index = -2; index <= 2; index += 2) box(group, [0.08, 0.09, 10.3], [index * 1.55, 4.72, center], WOOD)
    }
    roundedBox(group, [3.7, 0.62, 0.26], [0, 4.0, center + 7.72], WOOD, 0.055)
    label(group, title, [0, 4.0, center + 7.575], 3.3)
    for (const x of [-5.6, 5.6]) {
      box(group, [0.06, 2.3, 2.1], [x, 2.35, center + 0.4], CLOTH)
      for (let index = 0; index < 5; index += 1) box(group, [0.045, 2.35, 0.035], [x + (x < 0 ? 0.035 : -0.035), 2.35, center - 0.45 + index * 0.42], WOOD)
    }
    addPaper(group, [-6.72, 2.3, center - 2.8], [0.68, 1.4], [0, Math.PI / 2, -0.04])
    addPaper(group, [6.72, 2.6, center + 2.7], [0.58, 1.2], [0, -Math.PI / 2, 0.06])
    this.addInteraction(group, 'exit', act, 'exit', '穿过暗门，前往下一殿', [0, 1.3, center - 7.65], [1.65, 2.5, 0.25], false)
    return group
  }

  private buildMedicine(): void {
    const group = this.room('medicine', 0, '第四殿 · 药局')
    const cabinet = new THREE.Group()
    cabinet.name = 'medicine-cabinet-fallback'
    group.add(cabinet)
    box(cabinet, [10.9, 4.35, 0.76], [0, 2.42, -7.02], WOOD)
    const drawerMaterial = WOOD.clone()
    drawerMaterial.color.setHex(0x999078)
    const drawerGeometry = new RoundedBoxGeometry(0.76, 0.37, 0.43, 2, 0.035)
    const drawers = new THREE.InstancedMesh(drawerGeometry, drawerMaterial, 108)
    const transform = new THREE.Object3D()
    for (let index = 0; index < 108; index += 1) {
      const row = Math.floor(index / 12)
      const column = index % 12
      const openDrawer = row === 4 && column === 5
      transform.position.set(-4.85 + column * 0.88, 0.58 + row * 0.45, -6.56 + (openDrawer ? 0.22 : 0))
      transform.updateMatrix()
      drawers.setMatrixAt(index, transform.matrix)
    }
    drawers.instanceMatrix.needsUpdate = true
    cabinet.add(drawers)
    const pulls = new THREE.InstancedMesh(new THREE.TorusGeometry(0.058, 0.015, 7, 18), BRONZE, 108)
    const drawerLabels = new THREE.InstancedMesh(new RoundedBoxGeometry(0.2, 0.105, 0.035, 1, 0.018), BRONZE, 108)
    for (let index = 0; index < 108; index += 1) {
      const row = Math.floor(index / 12)
      const column = index % 12
      const openDrawer = row === 4 && column === 5
      transform.position.set(-4.85 + column * 0.88, 0.58 + row * 0.45, -6.295 + (openDrawer ? 0.22 : 0))
      transform.rotation.set(0, 0, 0)
      transform.updateMatrix()
      pulls.setMatrixAt(index, transform.matrix)
      transform.position.set(-5.08 + column * 0.88, 0.64 + row * 0.45, -6.27 + (openDrawer ? 0.22 : 0))
      transform.updateMatrix()
      drawerLabels.setMatrixAt(index, transform.matrix)
    }
    pulls.instanceMatrix.needsUpdate = true
    drawerLabels.instanceMatrix.needsUpdate = true
    cabinet.add(pulls)
    cabinet.add(drawerLabels)
    for (const x of [-5.45, 5.45]) {
      roundedBox(cabinet, [0.18, 4.55, 0.92], [x, 2.42, -7.02], WOOD, 0.04)
      roundedBox(cabinet, [0.22, 0.18, 1.0], [x, 0.25, -7.02], BRONZE, 0.035)
    }

    const openTray = new THREE.Group()
    openTray.position.set(0, 0, -6.06)
    group.add(openTray)
    roundedBox(openTray, [0.9, 0.08, 0.62], [0, 2.42, 0], WOOD, 0.04)
    const heroBowl = bowl(openTray, [0, 2.43, 0.03], 0.3, 0.24, CELADON)
    heroBowl.name = 'celadon-bowl-fallback'
    light(openTray, [0, 2.91, 0.03], 0xb6e7d4, 3.5, 0.045)

    const sideCabinet = new THREE.Group()
    sideCabinet.position.set(5.65, 0, -2.5)
    group.add(sideCabinet)
    roundedBox(sideCabinet, [1.35, 2.65, 4.6], [0, 1.35, 0], WOOD, 0.055)
    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column < 2; column += 1) {
        roundedBox(sideCabinet, [0.34, 0.36, 1.85], [-0.72, 0.34 + row * 0.47, -1.02 + column * 2.04], WOOD, 0.035)
        const pull = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.012, 6, 14), BRONZE)
        pull.position.set(-0.51, 0.34 + row * 0.47, -1.02 + column * 2.04)
        pull.rotation.y = Math.PI / 2
        sideCabinet.add(pull)
      }
    }
    roundedBox(sideCabinet, [1.12, 0.2, 4.75], [-0.22, 2.75, 0], WET_STONE, 0.04)
    for (let index = 0; index < 5; index += 1) {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.16 + (index % 2) * 0.04, 0.18, 0.42 + (index % 3) * 0.08, 18), new THREE.MeshPhysicalMaterial({ color: index % 2 ? 0x5e6860 : 0x6e6551, roughness: 0.38, clearcoat: 0.35 }))
      jar.position.set(-0.18, 3.05, -1.8 + index * 0.9)
      sideCabinet.add(jar)
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.055, 16), BRONZE)
      lid.position.set(-0.18, 3.32 + (index % 3) * 0.04, -1.8 + index * 0.9)
      sideCabinet.add(lid)
    }

    const bench = new THREE.Group()
    bench.position.set(0, 0, 0)
    group.add(bench)
    roundedBox(bench, [4.2, 0.2, 1.48], [-0.5, 1.05, -1.48], WOOD, 0.085)
    roundedBox(bench, [4.06, 0.11, 1.35], [-0.5, 1.17, -1.48], WOOD, 0.035)
    for (const x of [-2.25, 1.25]) for (const z of [-1.99, -0.97]) roundedBox(bench, [0.2, 1.05, 0.2], [x, 0.52, z], WOOD, 0.035)
    for (let index = 0; index < 5; index += 1) roundedBox(bench, [0.68, 0.3, 0.07], [-2.14 + index * 0.82, 0.78, -0.71], WOOD, 0.025)

    const mill = new THREE.Group()
    mill.position.set(-1.6, 1.3, -1.48)
    bench.add(mill)
    const millBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.47, 0.22, 32), BRONZE)
    mill.add(millBowl)
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 28), WET_STONE)
    roller.rotation.x = Math.PI / 2
    roller.position.set(0.04, 0.23, 0)
    mill.add(roller)
    const pestle = cylinder(mill, 0.05, 0.96, [0, 0.28, 0], WOOD)
    pestle.rotation.z = Math.PI / 2

    const herbs = [
      { id: 'danggui', x: -0.35, color: 0x927455, name: '当归（君）', type: 'root' },
      { id: 'yuanzhi', x: 0.48, color: 0x7c855f, name: '远志（臣）', type: 'leaf' },
      { id: 'hehuan', x: 1.28, color: 0x9a6262, name: '合欢（佐）', type: 'flower' },
      { id: 'wangyou', x: 2.08, color: 0x9a8b5d, name: '忘忧（使）', type: 'leaf' }
    ]
    for (const herb of herbs) {
      const bundle = new THREE.Group()
      bundle.position.set(herb.x, 1.29, -1.53)
      bench.add(bundle)
      const material = new THREE.MeshStandardMaterial({ color: herb.color, roughness: 0.94, bumpMap: paperTexture, bumpScale: 0.018 })
      for (let piece = 0; piece < 10; piece += 1) {
        if (herb.type === 'root') {
          const root = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.007, 0.25 + (piece % 3) * 0.07, 7), material)
          root.position.set(Math.sin(piece * 4) * 0.11, 0.03, Math.cos(piece * 2) * 0.09)
          root.rotation.z = (piece - 3) * 0.12
          bundle.add(root)
        } else {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 7), material)
          leaf.scale.set(0.58, 0.15, 1.35)
          leaf.position.set(Math.sin(piece * 5) * 0.11, 0.04, Math.cos(piece * 3) * 0.1)
          leaf.rotation.y = piece * 0.72
          bundle.add(leaf)
        }
      }
      if (herb.type === 'flower') {
        for (let petal = 0; petal < 8; petal += 1) {
          const flower = new THREE.Mesh(new THREE.SphereGeometry(0.12, 9, 6), new THREE.MeshStandardMaterial({ color: 0xa56368, roughness: 0.82 }))
          flower.scale.set(0.4, 0.16, 0.9)
          flower.position.set(Math.cos(petal * Math.PI / 4) * 0.12, 0.14, Math.sin(petal * Math.PI / 4) * 0.12)
          flower.rotation.y = petal * Math.PI / 4
          bundle.add(flower)
        }
      }
      const target = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
      target.position.y = 0.14
      bundle.add(target)
      this.interactions.push({ object: target, kind: 'herb', act: 'medicine', id: herb.id, label: `取药 · ${herb.name}`, enabled: true })
    }

    const amanBowl = bowl(bench, [3.25, 1.25, -1.48], 0.29, 0.24, CELADON)
    roundedBox(bench, [0.62, 0.16, 0.62], [3.25, 1.19, -1.48], WOOD, 0.055)
    const bowlTarget = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
    bowlTarget.position.copy(amanBowl.position).add(new THREE.Vector3(0, 0.16, 0))
    bench.add(bowlTarget)
    this.interactions.push({ object: bowlTarget, kind: 'bowl', act: 'medicine', id: 'aman', label: '查看青瓷药碗', enabled: true })

    const evidence = new THREE.Group()
    evidence.position.set(3.85, 1.3, -1.48)
    bench.add(evidence)
    for (let index = 0; index < 4; index += 1) addPaper(evidence, [Math.sin(index) * 0.1, index * 0.012, Math.cos(index) * 0.07], [0.3, 0.4], [index * 0.02, index * 0.11, index * 0.05])
    this.addInteraction(evidence, 'evidence', 'medicine', 'C', '取得证据 C · 朱笔改字与簿页残片', [0, 0.2, 0], [0.46, 0.42, 0.12], true)
    roundedBox(bench, [0.42, 0.4, 0.42], [4.55, 1.38, -2.6], BRONZE, 0.045)
    this.addSeal(group, 'medicine', 'seal4', '半印④ · 不忘汤已成', [4.55, 1.52, -2.6])

    const pot = new THREE.Group()
    pot.position.set(4.4, 0, -5.5)
    group.add(pot)
    const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.55, 0.78, 32), BRONZE)
    cauldron.position.y = 0.63
    pot.add(cauldron)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.055, 10, 40), BRONZE)
    rim.rotation.x = Math.PI / 2
    rim.position.y = 1.03
    pot.add(rim)
    const broth = new THREE.Mesh(new THREE.CircleGeometry(0.59, 32), new THREE.MeshPhysicalMaterial({ color: 0x66776b, roughness: 0.18, transparent: true, opacity: 0.86 }))
    broth.rotation.x = -Math.PI / 2
    broth.position.y = 1.02
    pot.add(broth)
    addSteam(group, [4.4, 1.08, -5.5])
    addLantern(group, [5.35, 2.55, -4.0], 1.22)
    addLantern(group, [-5.8, 2.8, -2.4], 0.72)
    light(group, [-4.5, 2.4, -5.8], 0xb4e7d5, 8, 0.055)
    light(group, [0.2, 3.55, -5.7], 0xa9d6c5, 13, 0.05)
    light(group, [0.2, 3.4, -1.5], 0xb3d4c5, 17, 0.065)
    light(group, [0.7, 3.2, -6.1], 0x9bc9b7, 8, 0.05)
    for (let index = 0; index < 18; index += 1) {
      addPaper(group, [-5.5 + Math.random() * 11, 1.3 + Math.random() * 3.4, -6.3 + Math.random() * 11], [0.12 + Math.random() * 0.13, 0.18 + Math.random() * 0.16], [Math.random() * 0.7, Math.random() * Math.PI, Math.random()])
    }
    for (let index = 0; index < 12; index += 1) {
      const slip = addPaper(group, [-6.0, 1.15 + index * 0.27, -4.0 + index * 0.22], [0.16, 0.32], [0.03, 0.18, (index % 3 - 1) * 0.08])
      slip.material = PAPER.clone()
    }
    for (const x of [-5.8, -4.7, 4.7, 5.8]) addBanner(group, [x, 4.5, -4.2 + Math.random() * 7.5], [0.65, 2.1], x < 0 ? 0.04 : Math.PI - 0.04)
  }

  private buildCorridor(center: number): void {
    const group = new THREE.Group()
    this.root.add(group)
    box(group, [3.2, 0.2, 8], [0, -0.1, center], STONE)
    box(group, [0.25, 3.3, 8], [-1.7, 1.65, center], DARK_STONE)
    box(group, [0.25, 3.3, 8], [1.7, 1.65, center], DARK_STONE)
    box(group, [3.65, 0.25, 8], [0, 3.35, center], WOOD)
    light(group, [0, 2.8, center], 0x89bcaa, 4)
  }

  private buildPalace(): void {
    const group = this.room('palace', -28, '第五殿 · 九宫阵')
    const layout = [[8, 1, 6], [3, 5, 7], [4, 9, 2]]
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const value = layout[row][column]
        const material = STONE.clone()
        material.color.setHex(0x68736f + Math.floor(Math.random() * 0x101010))
        const x = (column - 1) * 2.05
        const z = -25.7 - row * 2.05
        const tile = roundedBox(group, [1.96, 0.24, 1.96], [x, 0.13, z], material, 0.055)
        tile.userData.value = value
        this.stones.set(value, tile)
        this.addEngraving(group, String(value), [x, 0.255, z], 0.64)
        if ((row + column) % 2 === 0) addFootprint(group, [x + 0.28, 0.26, z + 0.48], row * 0.35)
      }
    }
    const altar = new THREE.Group()
    altar.position.set(0, 0, -34.25)
    group.add(altar)
    roundedBox(altar, [3.7, 0.24, 1.15], [0, 1.02, 0], WOOD, 0.06)
    for (const x of [-1.55, 1.55]) for (const z of [-0.35, 0.35]) roundedBox(altar, [0.2, 1.0, 0.2], [x, 0.48, z], WOOD, 0.035)
    roundedBox(altar, [0.45, 0.2, 0.45], [0, 1.25, 0], BRONZE, 0.035)
    const halfSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.26, 8), BRONZE)
    halfSeal.position.set(0, 1.5, 0)
    altar.add(halfSeal)
    this.addSeal(group, 'palace', 'seal5', '半印⑤ · 案由未问', [0, 1.58, -34.25])
    const evidence = new THREE.Group()
    evidence.position.set(1.2, 1.18, -34.25)
    altar.add(evidence)
    addPaper(evidence, [0, 0, 0], [0.45, 0.6], [0, 0.2, 0])
    this.addInteraction(evidence, 'evidence', 'palace', 'D', '取得证据 D · 有人一直在替你担责', [0, 0.13, 0], [0.42, 0.4, 0.1], true)
    label(group, '戴九履一 · 左三右七', [0, 2.7, -35.72], 4.0)

    const lampSpots: [number, number, number][] = [
      [-4.6, 0.34, -23.6], [0, 0.34, -23.6], [4.6, 0.34, -23.6],
      [-4.6, 0.34, -28], [4.6, 0.34, -28],
      [-4.6, 0.34, -32.5], [0, 0.34, -32.5], [4.6, 0.34, -32.5]
    ]
    for (const [x, y, z] of lampSpots.filter((spot) => Math.abs(spot[0]) > 0.1 || spot[2] < -31)) {
      const lamp = new THREE.Group()
      lamp.position.set(x, y, z)
      group.add(lamp)
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.12, 18), BRONZE)
      lamp.add(cup)
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 8), new THREE.MeshBasicMaterial({ color: 0xb4f2d5 }))
      flame.position.y = 0.12
      lamp.add(flame)
      light(lamp, [0, 0.28, 0], 0x8de1bc, 3.4, 0.05)
    }
    for (const x of [-5.6, 5.6]) {
      for (const z of [-23.5, -27.5, -31.5]) {
        const banner = addBanner(group, [x, 4.35, z], [0.92, 3.25], x < 0 ? Math.PI / 2 : -Math.PI / 2)
        for (let row = 0; row < 3; row += 1) {
          const broken = row === 1
          const mark = new THREE.Mesh(new THREE.BoxGeometry(broken ? 0.28 : 0.46, 0.055, 0.025), new THREE.MeshStandardMaterial({ color: 0x34423c, roughness: 1, transparent: true, opacity: 0.72 }))
          mark.position.set(0, -0.55 - row * 0.18, 0.1)
          banner.add(mark)
          if (broken) {
            const second = mark.clone()
            second.position.x = 0.17
            banner.add(second)
          }
        }
      }
    }
    for (let index = 0; index < 20; index += 1) {
      addPaper(group, [-5.8 + Math.random() * 11.6, 1.6 + Math.random() * 3.1, -23 + Math.random() * 10], [0.1 + Math.random() * 0.12, 0.18 + Math.random() * 0.18], [Math.random(), Math.random() * Math.PI, Math.random()])
    }
    light(group, [-5.1, 2.1, -27], 0x95e1bf, 2.5, 0.055)
    light(group, [5.1, 2.1, -30], 0x95e1bf, 2.5, 0.055)
  }

  private addEngraving(parent: THREE.Object3D, text: string, position: [number, number, number], width: number): void {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')!
    context.clearRect(0, 0, 256, 256)
    context.fillStyle = '#4c5752'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = 'bold 164px serif'
    context.fillText(text, 128, 132)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.82, depthWrite: false, side: THREE.DoubleSide })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width), material)
    mesh.position.set(...position)
    mesh.rotation.x = -Math.PI / 2
    parent.add(mesh)
  }

  private buildReincarnation(): void {
    const group = new THREE.Group()
    this.root.add(group)
    box(group, [18, 0.36, 10], [0, -0.18, -47], STONE)
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const x = -7.1 + column * 2.03 + (row % 2) * 0.28
        const z = -43.2 - row * 2.1
        roundedBox(group, [1.92, 0.17, 1.96], [x, 0.08, z], WET_STONE, 0.045)
      }
    }

    const waterMaterial = new THREE.MeshPhysicalMaterial({ color: 0x0c2221, roughness: 0.22, metalness: 0.26, clearcoat: 0.85, clearcoatRoughness: 0.18 })
    const water = new THREE.Mesh(new THREE.PlaneGeometry(34, 31, 64, 48), waterMaterial)
    water.rotation.x = -Math.PI / 2
    water.position.set(0, -0.55, -63)
    water.userData.water = true
    group.add(water)
    for (const x of [-12, 12]) {
      for (let index = 0; index < 14; index += 1) {
        const z = -49 - index * 1.9
        const bankStone = roundedBox(group, [1.1 + (index % 3) * 0.35, 0.5, 1.7], [x + Math.sin(index) * 0.4, -0.05, z], STONE, 0.08)
        bankStone.rotation.y = Math.sin(index * 7) * 0.16
      }
    }

    const bridgeArchHeight = 1.8
    const bridgeVisual = new THREE.Group()
    bridgeVisual.name = 'stone-bridge-fallback'
    group.add(bridgeVisual)
    this.createBridge(bridgeVisual, -52.2, -72.6, 4.3, bridgeArchHeight)
    roundedBox(group, [5.2, 0.32, 8.2], [0, 0.06, -76.1], WET_STONE, 0.055)
    for (let index = 0; index < 25; index += 1) {
      const t = index / 24
      const z = -52.2 + t * 20.4
      const y = 0.22 + Math.sin(t * Math.PI) * bridgeArchHeight
      const slab = roundedBox(bridgeVisual, [1.0, 0.1, 0.68], [(index % 3 - 1) * 1.04, y + 0.08, z], STONE, 0.025)
      slab.rotation.y = Math.sin(index * 4) * 0.025
      if (index % 5 === 1) addFootprint(group, [0.14 * (index % 3), y + 0.15, z], Math.sin(index) * 0.12)
    }
    for (const side of [-1, 1]) {
      for (let index = 0; index <= 12; index += 1) {
        const t = index / 12
        const z = -52.4 - t * 19.8
        const y = 0.4 + Math.sin(t * Math.PI) * bridgeArchHeight
        cylinder(bridgeVisual, 0.12, 0.82, [side * 2.35, y + 0.3, z], STONE)
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), WET_STONE)
        cap.position.set(side * 2.35, y + 0.75, z)
        bridgeVisual.add(cap)
      }
      const railCurvePoints: THREE.Vector3[] = []
      for (let index = 0; index <= 36; index += 1) {
        const t = index / 36
        railCurvePoints.push(new THREE.Vector3(side * 2.35, 0.78 + Math.sin(t * Math.PI) * bridgeArchHeight, -52.4 - t * 19.8))
      }
      const railCurve = new THREE.CatmullRomCurve3(railCurvePoints)
      const rail = new THREE.Mesh(new THREE.TubeGeometry(railCurve, 48, 0.1, 8, false), WET_STONE)
      bridgeVisual.add(rail)
    }

    for (let index = 0; index < 130; index += 1) {
      const side = index % 2 === 0 ? -1 : 1
      const x = side * (3.0 + Math.random() * 6.2)
      const z = -49 - Math.random() * 26
      const stem = cylinder(group, 0.018, 0.34 + Math.random() * 0.32, [x, -0.15, z], BRONZE)
      stem.castShadow = false
      const bloom = new THREE.Group()
      bloom.position.set(x, 0.08, z)
      group.add(bloom)
      const petals = 5
      for (let petal = 0; petal < petals; petal += 1) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 6), RED)
        flower.scale.set(0.36, 0.14, 1.2)
        flower.position.set(Math.cos(petal * Math.PI * 2 / petals) * 0.12, 0.05, Math.sin(petal * Math.PI * 2 / petals) * 0.12)
        flower.rotation.y = petal * Math.PI * 2 / petals
        bloom.add(flower)
      }
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc6a982, roughness: 0.7 }))
      center.position.y = 0.07
      bloom.add(center)
    }
    for (const [x, y, z, width, height] of [
      [-7.5, 2.4, -71.8, 18, 7],
      [7.0, 3.8, -81, 22, 10],
      [0, 6.5, -88, 24, 8],
      [-2.4, 1.3, -60, 17, 4]
    ] as const) {
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: mistMap, color: 0x95a6a0, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }))
      mist.position.set(x, y, z)
      mist.userData.mist = true
      group.add(mist)
    }

    for (const x of [-4.1, 4.1]) {
      for (let index = 0; index < 3; index += 1) {
        const z = -54 - index * 5
        addBanner(group, [x, 5.1, z], [1.1, 4.0], x < 0 ? 0.22 : -0.22)
      }
    }

    const pavilion = new THREE.Group()
    pavilion.position.set(-5.6, 0, -51.6)
    group.add(pavilion)
    for (const x of [-1.35, 1.35]) for (const z of [-1.35, 1.35]) {
      roundedBox(pavilion, [0.22, 3.0, 0.22], [x, 1.5, z], WOOD, 0.035)
      roundedBox(pavilion, [0.4, 0.28, 0.4], [x, 0.18, z], BRONZE, 0.045)
    }
    roundedBox(pavilion, [3.4, 0.22, 3.4], [0, 3.0, 0], WOOD, 0.045)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.55, 1.2, 4), WOOD)
    roof.rotation.y = Math.PI / 4
    roof.position.y = 3.55
    pavilion.add(roof)
    roundedBox(pavilion, [2.3, 0.18, 0.88], [0, 0.95, 0], WOOD, 0.05)
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.42, 0.64, 24), BRONZE)
    pot.position.set(0, 1.4, 0)
    pavilion.add(pot)
    addSteam(pavilion, [0, 1.75, 0])
    addLantern(pavilion, [1.65, 2.05, 1.45], 0.8)

    for (let z = -50; z >= -70; z -= 4) {
      const t = (-z - 52.2) / 20.4
      const y = 0.55 + Math.sin(THREE.MathUtils.clamp(t, 0, 1) * Math.PI) * bridgeArchHeight
      for (const side of [-1, 1]) {
        const lampBase = roundedBox(group, [0.38, 0.3, 0.38], [side * 1.9, y + 0.25, z], BRONZE, 0.04)
        lampBase.castShadow = false
        addLantern(group, [side * 1.9, y + 1.0, z], 0.65)
      }
    }
    for (let index = 0; index < 10; index += 1) {
      const z = -58.0 - index * 1.3
      const t = (z + 52.2) / (-72.6 + 52.2)
      const y = 0.22 + Math.sin(Math.PI * t) * bridgeArchHeight
      const x = index % 2 === 0 ? -1.5 : 1.5
      addSoulSilhouette(group, [x, y + 0.02, z], 0.78 + (index % 3) * 0.025)
    }

    addBareTree(group, [6.7, -0.48, -61.5])
    for (const [y, z] of [[3.15, -62.2], [4.25, -60.8], [3.75, -64.1], [5.15, -62.4]] as const) {
      addLantern(group, [6.7 + Math.sin(y * 2) * 1.35, y, z], 0.52)
    }

    const wheelCenter = new THREE.Group()
    wheelCenter.name = 'six-realm-wheel-fallback'
    wheelCenter.position.set(0, 2.8, -75.6)
    group.add(wheelCenter)
    const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.16, 12, 64), BRONZE)
    wheelCenter.add(wheelRing)
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.07, 10, 48), WOOD)
    wheelCenter.add(innerRing)
    for (let index = 0; index < 6; index += 1) {
      const spoke = roundedBox(wheelCenter, [0.16, 3.65, 0.18], [0, 0, 0], WOOD, 0.045)
      spoke.rotation.z = index * Math.PI / 3
      this.wheels.push(spoke)
      const sector = this.makeWheelSector(index)
      sector.position.z = -0.12
      wheelCenter.add(sector)
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), BRONZE)
    wheelCenter.add(hub)
    this.wheels.push(wheelRing, innerRing, hub)

    const distantWheel = new THREE.Group()
    distantWheel.position.set(0, 5.4, -90)
    group.add(distantWheel)
    const shadowRing = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.075, 8, 64), new THREE.MeshBasicMaterial({ color: 0x8fa19a, transparent: true, opacity: 0.17 }))
    distantWheel.add(shadowRing)
    for (let index = 0; index < 6; index += 1) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.07, 8.1, 0.08), new THREE.MeshBasicMaterial({ color: 0x87938d, transparent: true, opacity: 0.15 }))
      spoke.rotation.z = index * Math.PI / 3
      distantWheel.add(spoke)
    }

    const doorFrame = new THREE.Group()
    doorFrame.position.set(0, 0, -80.2)
    group.add(doorFrame)
    for (const x of [-2.1, 2.1]) {
      roundedBox(doorFrame, [0.52, 5.2, 0.62], [x, 2.6, 0], WET_STONE, 0.055)
      for (let index = 0; index < 4; index += 1) roundedBox(doorFrame, [0.68, 0.14, 0.72], [x, 0.7 + index * 1.1, 0], BRONZE, 0.03)
    }
    roundedBox(doorFrame, [4.55, 0.58, 0.7], [0, 5.05, 0], WET_STONE, 0.06)
    const portalMaterial = new THREE.MeshBasicMaterial({ color: 0xbadaca, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
    this.portal = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 4.8), portalMaterial)
    this.portal.position.set(0, 2.7, -80.3)
    group.add(this.portal)
    light(group, [0, 3.5, -79.0], 0xc1e4d5, 18, 0.12)
    roundedBox(group, [1.65, 0.26, 1.0], [0, 0.16, -70.3], WET_STONE, 0.04)
    this.addInteraction(group, 'combine', 'reincarnation', 'combine', '将六枚半印合于路引', [0, 1.25, -70.3], [1.35, 0.48, 0.78], true)
    const endings = [
      { id: 'return', x: -2.7, title: '还阳' },
      { id: 'replace', x: 0, title: '顶名' },
      { id: 'judge', x: 2.7, title: '留司' }
    ]
    for (const ending of endings) {
      const marker = roundedBox(group, [1.2, 0.18, 0.65], [ending.x, 0.12, -77.6], WOOD, 0.045)
      marker.rotation.y = Math.PI
      const object = this.addInteraction(group, 'ending', 'reincarnation', ending.id, `选择结局 · ${ending.title}`, [ending.x, 1.25, -77.6], [1.12, 1.8, 0.22], false)
      object.material = new THREE.MeshStandardMaterial({ color: 0x283531, emissive: 0x111d19, transparent: true, opacity: 0.28, roughness: 0.9 })
      label(group, ending.title, [ending.x, 2.55, -77.42], 1.35)
      object.userData.ending = ending.id
    }
  }

  private createBridge(parent: THREE.Object3D, startZ: number, endZ: number, width: number, archHeight: number): THREE.Mesh {
    const segments = 48
    const halfWidth = width / 2
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    for (let step = 0; step <= segments; step += 1) {
      const t = step / segments
      const z = startZ + (endZ - startZ) * t
      const y = 0.22 + Math.sin(Math.PI * t) * archHeight
      for (const x of [-halfWidth, halfWidth]) {
        positions.push(x, y, z)
        uvs.push((x + halfWidth) / width, t)
      }
      if (step < segments) {
        const index = step * 2
        indices.push(index, index + 2, index + 1, index + 1, index + 2, index + 3)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    const deck = new THREE.Mesh(geometry, WET_STONE)
    deck.material.side = THREE.DoubleSide
    deck.receiveShadow = true
    parent.add(deck)
    return deck
  }

  private makeWheelSector(index: number): THREE.Mesh {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    const start = index * Math.PI / 3
    shape.lineTo(Math.cos(start) * 1.43, Math.sin(start) * 1.43)
    for (let step = 0; step <= 12; step += 1) {
      const angle = start + (step / 12) * Math.PI / 3
      shape.lineTo(Math.cos(angle) * 1.43, Math.sin(angle) * 1.43)
    }
    shape.closePath()
    const material = new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? 0x303a34 : 0x4a4d40, roughness: 0.82, side: THREE.DoubleSide })
    return new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), material)
  }

  private addInteraction(parent: THREE.Object3D, kind: InteractionKind, act: ActId, id: string, interactionLabel: string, position: [number, number, number], size: [number, number, number], enabled: boolean): THREE.Mesh {
    const material = new THREE.MeshStandardMaterial({ color: kind === 'exit' ? 0x243c34 : 0x665437, emissive: 0x324f40, emissiveIntensity: 0.35, transparent: kind === 'exit', opacity: kind === 'exit' ? 0.12 : 1 })
    const object = box(parent, size, position, material)
    this.interactions.push({ object, kind, act, id, label: interactionLabel, enabled })
    return object
  }

  private addSeal(parent: THREE.Object3D, act: ActId, id: string, interactionLabel: string, position: [number, number, number]): void {
    const visual = new THREE.Group()
    visual.position.set(...position)
    visual.position.y -= 0.38
    visual.visible = false
    parent.add(visual)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.29, 0.12, 8), BRONZE)
    visual.add(base)
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.32, 8), WOOD)
    collar.position.y = 0.2
    visual.add(collar)
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.38), BRONZE)
    cap.position.y = 0.39
    visual.add(cap)
    const seal = this.addInteraction(parent, 'seal', act, id, interactionLabel, position, [0.72, 0.7, 0.72], false)
    seal.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    seal.userData.visual = visual
    this.seals.push(visual)
  }

  setActSolved(act: ActId): void {
    const interaction = this.interactions.find((item) => item.act === act && item.kind === 'seal')
    if (interaction) {
      interaction.enabled = true
      const visual = interaction.object.userData.visual as THREE.Object3D | undefined
      if (visual) visual.visible = true
    }
  }

  markPalaceStep(value: number, correct: boolean, solved: boolean): void {
    const tile = this.stones.get(value)
    if (!tile) return
    const material = tile.material as THREE.MeshPhysicalMaterial
    material.emissive = new THREE.Color(correct ? (solved ? 0x345947 : 0x1b3b2e) : 0x160d0b)
    material.emissiveIntensity = correct ? 0.72 : 0.24
    tile.position.y = correct ? 0.02 : 0.13
    if (!correct) window.setTimeout(() => { tile.position.y = 0.13 }, 420)
  }

  openExit(act: ActId): void {
    const interaction = this.interactions.find((item) => item.act === act && item.kind === 'exit')
    if (interaction) interaction.enabled = true
  }

  showEndings(): void {
    for (const interaction of this.interactions) if (interaction.kind === 'ending') interaction.enabled = true
  }

  setAtmosphere(act: ActId): void {
    if (act === 'reincarnation') {
      this.backgroundTarget.setHex(0x1c2929)
      this.fogTarget.setHex(0x71817e)
      this.fog.density = 0.031
    } else {
      this.backgroundTarget.setHex(0x080d0d)
      this.fogTarget.setHex(0x121c1a)
      this.fog.density = 0.018
    }
  }

  actAt(z: number): ActId {
    if (z > -16) return 'medicine'
    if (z > -40) return 'palace'
    return 'reincarnation'
  }

  constrain(position: THREE.Vector3, previous: THREE.Vector3, completed: Set<ActId>): void {
    const act = this.actAt(position.z)
    const zone = this.zones.find((item) => item.act === act)!
    position.z = THREE.MathUtils.clamp(position.z, -81, 7)
    let width = 1.25
    if (position.z > -8 || (position.z < -20 && position.z > -36) || position.z < -44) width = zone.width / 2
    if (position.z < -50 && position.z > -74) width = 1.45
    position.x = THREE.MathUtils.clamp(position.x, -width, width)
    if (position.z < -8 && position.z > -20 && !completed.has('medicine')) position.z = Math.max(position.z, -7.8)
    if (position.z < -36 && position.z > -44 && !completed.has('palace')) position.z = Math.max(position.z, -35.8)
    let floorHeight = 0
    if (position.z < -24.5 && position.z > -32.5 && Math.abs(position.x) < 3.2) floorHeight = 0.25
    if (position.z <= -52.2 && position.z >= -72.6) {
      const t = (position.z + 52.2) / (-72.6 + 52.2)
      floorHeight = 0.22 + Math.sin(Math.PI * t) * 1.8
    }
    if (position.z < -72.6 && position.z > -80.5) floorHeight = 0.22
    position.y = floorHeight + 1.65
    if (!Number.isFinite(position.x)) position.copy(previous)
  }

  update(delta: number): void {
    this.elapsed += delta
    ;(this.scene.background as THREE.Color).lerp(this.backgroundTarget, Math.min(1, delta * 0.65))
    this.fog.color.lerp(this.fogTarget, Math.min(1, delta * 0.65))
    for (const seal of this.seals) seal.rotation.y += delta * 0.55
    for (const wheel of this.wheels) wheel.rotation.z += delta * 0.035
    if (this.portal) {
      const material = this.portal.material as THREE.MeshStandardMaterial
      material.opacity = 0.23 + Math.sin(this.elapsed * 1.3) * 0.07
    }
    for (const object of floatingObjects) {
      if (object.userData.hang) {
        object.rotation.z = Math.sin(this.elapsed * 0.36 + object.position.z) * 0.018
      } else {
        const origin = object.userData.origin as THREE.Vector3
        object.position.y = origin.y + Math.sin(this.elapsed * 0.7 + origin.x * 3 + origin.z) * 0.11
        object.rotation.z += delta * 0.018
      }
    }
    for (const wisp of animatedSteam) {
      const phase = this.elapsed * 1.1 + wisp.userData.steamOffset
      wisp.position.x += Math.sin(phase) * delta * 0.025
      wisp.scale.y = 0.92 + Math.sin(phase * 0.6) * 0.1
      ;((wisp as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.07 + (Math.sin(phase) + 1) * 0.035
    }
    this.root.traverse((object) => {
      if (object.userData.mist) {
        object.position.y += Math.sin(this.elapsed * 0.08 + object.position.x) * delta * 0.025
        const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial
        material.opacity = 0.43 + Math.sin(this.elapsed * 0.12 + object.position.z) * 0.055
      }
    })
  }

  private loadAssets(): void {
    const loader = new GLTFLoader()
    const assets: {
      file: string
      position: [number, number, number]
      size: [number, number, number]
      rotation: number
      nonUniform?: boolean
      longAxis?: 'z'
      replaces?: string
    }[] = [
      { file: 'herbal-cabinet.glb', position: [0, 2.42, -7.02], size: [10.9, 4.35, 0.76], rotation: 0, nonUniform: true, replaces: 'medicine-cabinet-fallback' },
      { file: 'dengzi-scale.glb', position: [1.9, 1.31, -1.48], size: [0.72, 0.5, 0.54], rotation: 0 },
      { file: 'celadon-bowl.glb', position: [0, 2.54, -6.04], size: [0.5, 0.34, 0.48], rotation: 0, replaces: 'celadon-bowl-fallback' },
      { file: 'nine-palace.glb', position: [0, -0.12, -28], size: [7, 0.22, 7], rotation: 0, nonUniform: true },
      { file: 'stone-bridge.glb', position: [0, 1.52, -62.4], size: [4.3, 2.6, 20.4], rotation: 0, nonUniform: true, longAxis: 'z', replaces: 'stone-bridge-fallback' },
      { file: 'six-realm-wheel.glb', position: [0, 2.8, -75.6], size: [4.1, 4.1, 0.45], rotation: 0, nonUniform: true, replaces: 'six-realm-wheel-fallback' }
    ]
    for (const asset of assets) {
      loader.load(`/assets/generated/${asset.file}`, (gltf) => {
        const model = gltf.scene
        const bounds = new THREE.Box3().setFromObject(model)
        const dimensions = bounds.getSize(new THREE.Vector3())
        const center = bounds.getCenter(new THREE.Vector3())
        model.position.sub(center)
        const wrapper = new THREE.Group()
        wrapper.add(model)
        const safeDimensions = [Math.max(dimensions.x, 0.001), Math.max(dimensions.y, 0.001), Math.max(dimensions.z, 0.001)]
        const rotateToLength = asset.longAxis === 'z' && dimensions.x > dimensions.z
        if (asset.nonUniform) {
          if (rotateToLength) {
            wrapper.rotation.y = Math.PI / 2
            wrapper.scale.set(asset.size[2] / safeDimensions[0], asset.size[1] / safeDimensions[1], asset.size[0] / safeDimensions[2])
          } else {
            wrapper.scale.set(asset.size[0] / safeDimensions[0], asset.size[1] / safeDimensions[1], asset.size[2] / safeDimensions[2])
          }
        } else {
          const uniformScale = Math.min(asset.size[0] / safeDimensions[0], asset.size[1] / safeDimensions[1], asset.size[2] / safeDimensions[2])
          wrapper.scale.setScalar(uniformScale)
        }
        wrapper.position.set(asset.position[0], asset.position[1], asset.position[2])
        wrapper.rotation.y += asset.rotation
        wrapper.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        this.root.add(wrapper)
        if (asset.replaces) {
          const fallback = this.root.getObjectByName(asset.replaces)
          if (fallback) fallback.visible = false
        }
        if (asset.file === 'six-realm-wheel.glb') this.wheels.push(wrapper)
      }, undefined, () => undefined)
    }
  }
}

export function actDefinition(act: ActId) {
  return ACTS.find((item) => item.id === act)!
}
