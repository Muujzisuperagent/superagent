import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ACTS, type ActId } from './story'
import { SCALE_WEIGHTS } from './puzzles_act23'

export type InteractionKind = 'herb' | 'bowl' | 'seal' | 'exit' | 'combine' | 'ending' | 'evidence' | 'weight' | 'inscription' | 'hourplate' | 'register' | 'lamp' | 'brush'

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
const TILE = new THREE.MeshStandardMaterial({ color: 0x2c3430, roughness: 0.88, metalness: 0.025 })
const TILE_EDGE = new THREE.MeshStandardMaterial({ color: 0x4b564d, roughness: 0.74, metalness: 0.04 })
const HEMP = new THREE.MeshStandardMaterial({ map: clothTexture, bumpMap: clothTexture, bumpScale: 0.03, color: 0x8d8267, roughness: 0.97, side: THREE.DoubleSide, transparent: true, opacity: 0.94 })
const LILY_RED = new THREE.MeshStandardMaterial({ color: 0x9c2530, emissive: 0x1c0608, emissiveIntensity: 0.45, roughness: 0.62, side: THREE.DoubleSide })
const SOUL_ROBE = new THREE.MeshStandardMaterial({ map: clothTexture, bumpMap: clothTexture, bumpScale: 0.02, color: 0x6f7164, roughness: 0.96, side: THREE.DoubleSide })
const SOUL_INNER = new THREE.MeshStandardMaterial({ map: clothTexture, color: 0x7b7d6c, roughness: 1, side: THREE.DoubleSide })
const SOUL_HEAD = new THREE.MeshStandardMaterial({ color: 0x565b52, roughness: 1 })
const SOUL_SASH = new THREE.MeshStandardMaterial({ color: 0x5a2524, roughness: 0.85 })
const SOUL_FOOT = new THREE.MeshStandardMaterial({ color: 0x25241f, roughness: 1 })
const LANTERN_PAPER = new THREE.MeshPhysicalMaterial({ color: 0xd4d2bb, roughness: 0.75, transparent: true, opacity: 0.78, emissive: 0x9fd8c0, emissiveIntensity: 0.5 })
const WHEEL_SECTOR = [
  new THREE.MeshStandardMaterial({ color: 0x303a34, emissive: 0x16211c, emissiveIntensity: 0.55, roughness: 0.82, side: THREE.DoubleSide }),
  new THREE.MeshStandardMaterial({ color: 0x4a4d40, emissive: 0x1d231a, emissiveIntensity: 0.55, roughness: 0.82, side: THREE.DoubleSide })
]
const bulbMaterials = new Map<number, THREE.MeshBasicMaterial>()
const GHOST_FLAME = new THREE.MeshBasicMaterial({ color: 0x69e6a8 })
const BANNER_MARK = new THREE.MeshStandardMaterial({ color: 0x34423c, roughness: 1, transparent: true, opacity: 0.72 })
const ROPE = new THREE.MeshStandardMaterial({ color: 0x6c6450, roughness: 1 })
const BROTH = new THREE.MeshPhysicalMaterial({ color: 0x66776b, roughness: 0.2 })
const STAR = new THREE.MeshStandardMaterial({ color: 0x93a493, metalness: 0.85, roughness: 0.3 })
const JAR_MATERIALS = [
  new THREE.MeshPhysicalMaterial({ color: 0x6e6551, roughness: 0.38, clearcoat: 0.35 }),
  new THREE.MeshPhysicalMaterial({ color: 0x5e6860, roughness: 0.38, clearcoat: 0.35 })
]

/** 静态几何合批：把 group 内无动画/无交互引用的 mesh 按材质合并，draw call 从 N 降到材质数。
 *  keep 集合里的节点（及其子树）原样保留；InstancedMesh 与带 userData 动画标记的节点跳过。 */
function bakeStatic(group: THREE.Object3D, keep: Set<THREE.Object3D>): void {
  group.updateMatrixWorld(true)
  const inverse = new THREE.Matrix4().copy(group.matrixWorld).invert()
  const buckets = new Map<THREE.Material, { geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[]; castShadow: boolean; receiveShadow: boolean }>()
  const visit = (node: THREE.Object3D): void => {
    if (keep.has(node)) return
    if (node.userData.water || node.userData.mist || node.userData.hang || node.userData.origin || node.userData.steamOffset !== undefined) return
    const mesh = node as THREE.Mesh
    if (mesh.isMesh && !(mesh as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(mesh.material)) {
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld))
      for (const name of Object.keys(geometry.attributes)) {
        if (name !== 'position' && name !== 'normal' && name !== 'uv') geometry.deleteAttribute(name)
      }
      if (!geometry.attributes.normal) geometry.computeVertexNormals()
      if (!geometry.attributes.uv) {
        const count = geometry.attributes.position.count
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2))
      }
      let bucket = buckets.get(mesh.material as THREE.Material)
      if (!bucket) {
        bucket = { geometries: [], meshes: [], castShadow: false, receiveShadow: false }
        buckets.set(mesh.material as THREE.Material, bucket)
      }
      bucket.geometries.push(geometry)
      bucket.meshes.push(mesh)
      bucket.castShadow = bucket.castShadow || mesh.castShadow
      bucket.receiveShadow = bucket.receiveShadow || mesh.receiveShadow
      return
    }
    for (const child of [...node.children]) visit(child)
  }
  for (const child of [...group.children]) visit(child)
  for (const [material, bucket] of buckets) {
    if (bucket.meshes.length < 2) {
      for (const geometry of bucket.geometries) geometry.dispose()
      continue
    }
    const merged = mergeGeometries(bucket.geometries, false)
    for (const geometry of bucket.geometries) geometry.dispose()
    if (!merged) continue
    const mesh = new THREE.Mesh(merged, material)
    mesh.castShadow = bucket.castShadow
    mesh.receiveShadow = bucket.receiveShadow
    mesh.name = `baked-${group.name || group.type}`
    for (const original of bucket.meshes) original.removeFromParent()
    group.add(mesh)
  }
}

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

function label(parent: THREE.Object3D, text: string, position: [number, number, number], width = 3.2, floor = false, rotationY = 0): void {
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
  mesh.rotation.y = rotationY
  parent.add(mesh)
}

function light(parent: THREE.Object3D, position: [number, number, number], color = 0xa8d8c3, intensity = 5, radius = 0.11): void {
  let bulbMaterial = bulbMaterials.get(color)
  if (!bulbMaterial) {
    bulbMaterial = new THREE.MeshBasicMaterial({ color })
    bulbMaterials.set(color, bulbMaterial)
  }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 10), bulbMaterial)
  lamp.position.set(...position)
  parent.add(lamp)
  const source = new THREE.PointLight(color, intensity, 9, 1.7)
  source.position.set(...position)
  parent.add(source)
}

function addPaper(parent: THREE.Object3D, position: [number, number, number], size: [number, number], rotation: [number, number, number] = [0, 0, 0], drift = true): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), PAPER)
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  if (drift) {
    mesh.userData.origin = mesh.position.clone()
    floatingObjects.push(mesh)
  }
  parent.add(mesh)
  return mesh
}

/** 成串纸钱：可见麻绳 + 等距纸片，贴墙垂挂，不飘不转（替代随机 confetti）。 */
function addPaperString(parent: THREE.Object3D, position: [number, number, number], count: number, rotationY = 0): void {
  const string = new THREE.Group()
  string.position.set(...position)
  string.rotation.y = rotationY
  parent.add(string)
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, count * 0.3 + 0.2, 5), ROPE)
  cord.position.y = -(count * 0.3) / 2
  string.add(cord)
  for (let index = 0; index < count; index += 1) {
    addPaper(string, [0, -0.16 - index * 0.3, 0.012], [0.2, 0.26], [0, 0, (index % 2 ? 1 : -1) * 0.05], false)
  }
}

function addBanner(parent: THREE.Object3D, position: [number, number, number], size: [number, number], rotationY = 0): THREE.Mesh {
  const rows = 12
  const columns = 8
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const t = row / rows
      const edge = (column === 0 || column === columns) && row === rows ? (column === 0 ? 0.08 : -0.05) : 0
      const x = (column / columns - 0.5) * size[0]
      const y = -t * size[1] + edge
      const wave = Math.sin(column * 0.9 + row * 0.36) * t * 0.34 + Math.sin(row * 1.9 + column * 0.5) * t * 0.06
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
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, size[0] + 0.3, 8), WOOD)
  rod.rotation.z = Math.PI / 2
  rod.position.set(...position)
  rod.rotation.y = rotationY
  parent.add(rod)
  for (const side of [-1, 1]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 5), ROPE)
    rope.position.set(position[0] + Math.cos(rotationY) * side * (size[0] / 2 - 0.06), position[1] + 0.17, position[2] - Math.sin(rotationY) * side * (size[0] / 2 - 0.06))
    parent.add(rope)
  }
  return banner
}

function addRaggedBanner(parent: THREE.Object3D, position: [number, number, number], size: [number, number], rotationY = 0): THREE.Group {
  const group = new THREE.Group()
  group.position.set(...position)
  group.rotation.y = rotationY
  parent.add(group)
  const pole = cylinder(group, 0.032, size[0] + 0.55, [0, 0.03, 0], WOOD)
  pole.rotation.z = Math.PI / 2
  const rows = 9
  const columns = 9
  const ragged = Array.from({ length: columns + 1 }, () => size[1] * (0.8 + Math.random() * 0.26))
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows
    for (let column = 0; column <= columns; column += 1) {
      const x = (column / columns - 0.5) * size[0]
      const hem = ragged[column] ?? size[1]
      const y = -t * hem
      const wave = Math.sin(column * 0.85 + row * 0.42) * t * 0.2 + Math.sin(row * 1.7 + column * 0.3) * 0.035
      positions.push(x, y, wave + Math.sin(column * 1.3) * 0.045)
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
  const banner = new THREE.Mesh(geometry, HEMP)
  banner.castShadow = false
  banner.userData.hang = true
  floatingObjects.push(banner)
  group.add(banner)
  for (const x of [-size[0] / 2 + 0.12, size[0] / 2 - 0.12]) {
    const rope = cylinder(group, 0.012, 0.5, [x, 0.28, 0], ROPE)
    rope.castShadow = false
  }
  return group
}

function addTiledRoof(parent: THREE.Object3D, position: [number, number, number], span: number, height: number): THREE.Group {
  const roof = new THREE.Group()
  roof.position.set(...position)
  parent.add(roof)
  const layers = 5
  const eaveRise = 0.26
  const roofHeightAt = (t: number) => height * (0.4 * t + 0.6 * t * t) + eaveRise * Math.pow(1 - t, 3)
  for (let index = 0; index < layers; index += 1) {
    const t0 = index / layers
    const t1 = (index + 1) / layers
    const radiusBottom = (span / 2) * (1 - t0 * 0.88)
    const radiusTop = (span / 2) * (1 - t1 * 0.88)
    const y0 = roofHeightAt(t0)
    const y1 = roofHeightAt(t1)
    const layerHeight = Math.max(y1 - y0, 0.07)
    const layer = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(radiusTop, 0.06), radiusBottom, layerHeight, 4, 1), TILE)
    layer.rotation.y = Math.PI / 4
    layer.position.y = y0 + layerHeight / 2
    layer.castShadow = true
    layer.receiveShadow = true
    roof.add(layer)
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(radiusBottom * 1.02, radiusBottom * 1.02, 0.05, 4, 1, true), TILE_EDGE)
    lip.rotation.y = Math.PI / 4
    lip.position.y = y0 + 0.02
    roof.add(lip)
  }
  const cornerRadius = (span / 2) * 0.97
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
    const points = [
      new THREE.Vector3(0, height + 0.02, 0),
      new THREE.Vector3(sx * cornerRadius * 0.6, roofHeightAt(0.55) + 0.04, sz * cornerRadius * 0.6),
      new THREE.Vector3(sx * cornerRadius, eaveRise + 0.06, sz * cornerRadius),
      new THREE.Vector3(sx * cornerRadius * 1.04, eaveRise + 0.2, sz * cornerRadius * 1.04)
    ]
    const ridge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, 0.035, 6, false), TILE_EDGE)
    ridge.castShadow = true
    roof.add(ridge)
  }
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), TILE_EDGE)
  finial.position.y = height + 0.16
  roof.add(finial)
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 8), TILE_EDGE)
  tip.position.y = height + 0.34
  roof.add(tip)
  return roof
}

function addLanternBracket(parent: THREE.Object3D, postX: number, postY: number, postZ: number, side: number, scale = 0.62): void {
  const arm = cylinder(parent, 0.032, 0.62, [postX + side * 0.31, postY + 0.02, postZ], BRONZE)
  arm.rotation.z = Math.PI / 2
  arm.castShadow = false
  const hook = cylinder(parent, 0.016, 0.34, [postX + side * 0.6, postY - 0.17, postZ], BRONZE)
  hook.castShadow = false
  addLantern(parent, [postX + side * 0.6, postY - 0.55, postZ], scale)
}

function addLilyField(parent: THREE.Object3D): void {
  const clusters = 110
  // 细长反卷瓣：窄长球壳沿瓣轴渐卷，尖端下垂；另加外伸蕊丝，去掉星芒感。
  const petalGeometry = new THREE.SphereGeometry(0.15, 7, 5)
  const stamenGeometry = new THREE.CylinderGeometry(0.0045, 0.002, 1, 4)
  const coreGeometry = new THREE.SphereGeometry(0.032, 6, 5)
  const stemGeometry = new THREE.CylinderGeometry(0.011, 0.011, 1, 5)
  const petals = new THREE.InstancedMesh(petalGeometry, LILY_RED, clusters * 6)
  const stamens = new THREE.InstancedMesh(stamenGeometry, new THREE.MeshStandardMaterial({ color: 0xc9a08a, roughness: 0.85 }), clusters * 6)
  const cores = new THREE.InstancedMesh(coreGeometry, new THREE.MeshStandardMaterial({ color: 0x6e2a2c, roughness: 0.8 }), clusters)
  const stems = new THREE.InstancedMesh(stemGeometry, new THREE.MeshStandardMaterial({ color: 0x2c352a, roughness: 1 }), clusters)
  const matrix = new THREE.Matrix4()
  const quaternion = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  const point = new THREE.Vector3()
  const euler = new THREE.Euler()
  let petalIndex = 0
  let stamenIndex = 0
  for (let index = 0; index < clusters; index += 1) {
    const side = index % 2 === 0 ? -1 : 1
    const onBank = index % 5 !== 0
    const clump = Math.random() < 0.3 ? 0.45 : 1
    const x = onBank
      ? side * (10.2 + Math.random() * 3.9)
      : side * (2.6 + Math.random() * 4.6)
    const z = onBank
      ? -48.5 - Math.random() * 28
      : (Math.random() < 0.5 ? -48.4 - Math.random() * 3.2 : -72.8 - Math.random() * 3.4)
    const ground = onBank ? 0.27 : 0.07
    const stemHeight = (0.36 + Math.random() * 0.4) * clump
    const bloomScale = (0.75 + Math.random() * 0.55) * clump
    const yaw = Math.random() * Math.PI * 2
    point.set(x, ground + stemHeight / 2, z)
    scale.set(1, stemHeight, 1)
    quaternion.identity()
    matrix.compose(point, quaternion, scale)
    stems.setMatrixAt(index, matrix)
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = yaw + petal * Math.PI / 3
      const curl = 1.15 + (petal % 3) * 0.16
      const reach = 0.13 * bloomScale
      point.set(x + Math.cos(angle) * reach, ground + stemHeight + 0.06 * bloomScale - (petal % 2) * 0.03 * bloomScale, z + Math.sin(angle) * reach)
      euler.set(curl, angle, 0.1)
      quaternion.setFromEuler(euler)
      scale.set(0.05 * bloomScale, 0.055 * bloomScale, 2.0 * bloomScale)
      matrix.compose(point, quaternion, scale)
      petals.setMatrixAt(petalIndex, matrix)
      petalIndex += 1
      const sAngle = angle + Math.PI / 6
      point.set(x + Math.cos(sAngle) * 0.1 * bloomScale, ground + stemHeight + 0.12 * bloomScale, z + Math.sin(sAngle) * 0.1 * bloomScale)
      euler.set(0.55, sAngle, 0)
      quaternion.setFromEuler(euler)
      scale.set(1, 0.3 * bloomScale, 1)
      matrix.compose(point, quaternion, scale)
      stamens.setMatrixAt(stamenIndex, matrix)
      stamenIndex += 1
    }
    point.set(x, ground + stemHeight + 0.03, z)
    scale.set(1, 1, 1)
    quaternion.identity()
    matrix.compose(point, quaternion, scale)
    cores.setMatrixAt(index, matrix)
  }
  petals.instanceMatrix.needsUpdate = true
  stamens.instanceMatrix.needsUpdate = true
  cores.instanceMatrix.needsUpdate = true
  stems.instanceMatrix.needsUpdate = true
  petals.castShadow = false
  stamens.castShadow = false
  cores.castShadow = false
  stems.castShadow = false
  petals.receiveShadow = false
  parent.add(petals, stamens, cores, stems)
}

function addSteam(parent: THREE.Object3D, position: [number, number, number], heightScale = 1): void {
  const steamMaterial = new THREE.MeshBasicMaterial({ color: 0xb5c9c1, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })
  for (let index = 0; index < 4; index += 1) {
    const points = []
    for (let step = 0; step <= 10; step += 1) {
      const t = step / 10
      points.push(new THREE.Vector3(Math.sin(t * 5 + index) * 0.08 * heightScale, t * (0.8 + index * 0.11) * heightScale, Math.cos(t * 3 + index) * 0.05 * heightScale))
    }
    const path = new THREE.CatmullRomCurve3(points)
    const wisp = new THREE.Mesh(new THREE.TubeGeometry(path, 20, (0.018 + index * 0.003) * heightScale, 5, false), steamMaterial.clone())
    wisp.position.set(position[0] + index * 0.05 * heightScale, position[1], position[2])
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
  const lanternPaper = LANTERN_PAPER
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
  const robeMaterial = SOUL_ROBE
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.45, 1.35, 10, 1, true), robeMaterial)
  robe.position.y = 0.82
  soul.add(robe)
  const innerRobe = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.4, 10, 1, true), SOUL_INNER)
  innerRobe.position.y = 0.83
  soul.add(innerRobe)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), SOUL_HEAD)
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
  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.055, 0.025), SOUL_SASH)
  sash.position.set(0, 0.75, 0.34)
  soul.add(sash)
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.26), SOUL_FOOT)
    foot.position.set(side * 0.1, 0.045, 0.05)
    soul.add(foot)
  }
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
    { act: 'scale', center: 48, halfDepth: 8, width: 13.6 },
    { act: 'archive', center: 24, halfDepth: 8, width: 13.6 },
    { act: 'medicine', center: 0, halfDepth: 8, width: 13.6 },
    { act: 'palace', center: -28, halfDepth: 8, width: 13.6 },
    { act: 'reincarnation', center: -64, halfDepth: 19, width: 29 }
  ]
  private readonly stones = new Map<number, THREE.Mesh>()
  private readonly weightMeshes = new Map<string, THREE.Object3D>()
  private readonly obstacles: { x: number; z: number; r: number }[] = [
    { x: -2.35, z: 47, r: 0.78 },
    { x: 2.35, z: 47, r: 0.78 },
    { x: 2.3, z: 44, r: 0.62 },
    { x: -1.9, z: 22, r: 1.1 },
    { x: -5.5, z: 30.2, r: 0.5 }
  ]
  private scaleBeam: THREE.Object3D | null = null
  private scaleLeftPan: THREE.Object3D | null = null
  private scaleRightPan: THREE.Object3D | null = null
  private scaleTiltTarget = -0.085
  private hourWeight: THREE.Object3D | null = null
  private registerGlow: THREE.PointLight | null = null
  private scrapeMark: THREE.Object3D | null = null
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
    this.buildScale()
    this.buildCorridor(36)
    this.buildArchive()
    this.buildCorridor(12)
    this.buildMedicine()
    this.buildCorridor(-12)
    this.buildPalace()
    this.buildCorridor(-40)
    this.buildReincarnation()
    this.loadAssets()
  }

  private room(act: ActId, center: number, title: string): THREE.Group {
    const group = new THREE.Group()
    group.userData.act = act
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
    addPaper(group, [-6.72, 2.3, center - 2.8], [0.68, 1.4], [0, Math.PI / 2, -0.04], false)
    addPaper(group, [6.72, 2.6, center + 2.7], [0.58, 1.2], [0, -Math.PI / 2, 0.06], false)
    this.addInteraction(group, 'exit', act, 'exit', '穿过暗门，前往下一殿', [0, 1.3, center - 7.65], [1.65, 2.5, 0.25], false)
    return group
  }

  private buildMedicine(): void {
    const group = this.room('medicine', 0, '第四殿 · 药局')
    const cabinet = new THREE.Group()
    cabinet.name = 'medicine-cabinet-fallback'
    group.add(cabinet)
    // 柜分两段、中间留 2.9m 门洞对齐北门（x±1.45），出口与雾不再被柜体封死。
    for (const side of [-1, 1]) box(cabinet, [4.0, 4.35, 0.76], [side * 3.45, 2.42, -7.02], WOOD)
    const drawerMaterial = WOOD.clone()
    drawerMaterial.color.setHex(0x999078)
    const drawerGeometry = new RoundedBoxGeometry(0.6, 0.37, 0.43, 2, 0.035)
    const drawers = new THREE.InstancedMesh(drawerGeometry, drawerMaterial, 108)
    const transform = new THREE.Object3D()
    const drawerSpot = (index: number): [number, number, number] => {
      const bank = index < 54 ? -1 : 1
      const local = index % 54
      const row = Math.floor(local / 6)
      const column = local % 6
      const open = bank === -1 && row === 4 && column === 2
      return [bank * (1.78 + column * 0.66), 0.58 + row * 0.45, -6.56 + (open ? 0.22 : 0)]
    }
    for (let index = 0; index < 108; index += 1) {
      transform.position.set(...drawerSpot(index))
      transform.updateMatrix()
      drawers.setMatrixAt(index, transform.matrix)
    }
    drawers.instanceMatrix.needsUpdate = true
    cabinet.add(drawers)
    const pulls = new THREE.InstancedMesh(new THREE.TorusGeometry(0.058, 0.015, 7, 18), BRONZE, 108)
    const drawerLabels = new THREE.InstancedMesh(new RoundedBoxGeometry(0.2, 0.105, 0.035, 1, 0.018), BRONZE, 108)
    for (let index = 0; index < 108; index += 1) {
      const [dx, dy, dz] = drawerSpot(index)
      transform.position.set(dx, dy, dz + 0.265)
      transform.rotation.set(0, 0, 0)
      transform.updateMatrix()
      pulls.setMatrixAt(index, transform.matrix)
      transform.position.set(dx - 0.23, dy + 0.06, dz + 0.29)
      transform.updateMatrix()
      drawerLabels.setMatrixAt(index, transform.matrix)
    }
    pulls.instanceMatrix.needsUpdate = true
    drawerLabels.instanceMatrix.needsUpdate = true
    cabinet.add(pulls)
    cabinet.add(drawerLabels)
    for (const x of [-5.45, 5.45, -1.45, 1.45]) {
      roundedBox(cabinet, [0.18, 4.55, 0.92], [x, 2.42, -7.02], WOOD, 0.04)
      roundedBox(cabinet, [0.22, 0.18, 1.0], [x, 0.25, -7.02], BRONZE, 0.035)
    }

    const openTray = new THREE.Group()
    openTray.position.set(-3.1, 0, -6.12)
    group.add(openTray)
    roundedBox(openTray, [0.9, 0.08, 0.62], [0, 2.6, 0], WOOD, 0.04)
    const heroBowl = bowl(openTray, [0, 2.61, 0.03], 0.3, 0.24, CELADON)
    heroBowl.name = 'celadon-bowl-fallback'
    light(openTray, [0, 3.09, 0.03], 0xb6e7d4, 3.5, 0.045)

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
    // 船形碾槽 + 横立碾轮：读作药碾而非黑球
    roundedBox(mill, [1.05, 0.22, 0.44], [0, 0.04, 0], WET_STONE, 0.1)
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.1, 24), WET_STONE)
    roller.rotation.x = Math.PI / 2
    roller.position.set(0.08, 0.26, 0)
    mill.add(roller)
    const axle = cylinder(mill, 0.024, 0.56, [0.08, 0.26, 0], WOOD)
    axle.rotation.x = Math.PI / 2
    for (const side of [-1, 1]) {
      const handle = cylinder(mill, 0.028, 0.34, [0.08, 0.26, side * 0.36], WOOD)
      handle.rotation.x = Math.PI / 2
    }

    const herbs = [
      { id: 'danggui', x: -0.35, color: 0x927455, name: '当归（君）', type: 'root' },
      { id: 'yuanzhi', x: 0.48, color: 0x7c855f, name: '远志（臣）', type: 'leaf' },
      { id: 'hehuan', x: 1.28, color: 0x8a5a52, name: '合欢（佐）', type: 'flower' },
      { id: 'wangyou', x: 2.08, color: 0x9a8b5d, name: '忘忧（使）', type: 'leaf' }
    ]
    const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0x96605c, roughness: 0.82 })
    for (const herb of herbs) {
      const bundle = new THREE.Group()
      bundle.position.set(herb.x, 1.29, -1.53)
      bench.add(bundle)
      const material = new THREE.MeshStandardMaterial({ color: herb.color, roughness: 0.94, bumpMap: paperTexture, bumpScale: 0.018 })
      for (let piece = 0; piece < 10; piece += 1) {
        if (herb.type === 'root') {
          const root = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.007, 0.25 + (piece % 3) * 0.07, 7), material)
          root.position.set(Math.sin(piece * 4) * 0.11, 0.03 + (piece % 3) * 0.02, Math.cos(piece * 2) * 0.09)
          root.rotation.z = (piece - 3) * 0.12
          bundle.add(root)
        } else {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 7), material)
          leaf.scale.set(0.5, 0.3, 1.2)
          leaf.position.set(Math.sin(piece * 5) * 0.11, 0.04 + (piece % 4) * 0.035, Math.cos(piece * 3) * 0.1)
          leaf.rotation.y = piece * 0.72
          leaf.rotation.x = (piece % 3 - 1) * 0.22
          bundle.add(leaf)
        }
      }
      if (herb.type === 'flower') {
        for (let petal = 0; petal < 8; petal += 1) {
          const flower = new THREE.Mesh(new THREE.SphereGeometry(0.12, 9, 6), flowerMaterial)
          flower.scale.set(0.4, 0.22, 0.9)
          flower.position.set(Math.cos(petal * Math.PI / 4) * 0.12, 0.16 + (petal % 2) * 0.04, Math.sin(petal * Math.PI / 4) * 0.12)
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
    for (let index = 0; index < 4; index += 1) addPaper(evidence, [Math.sin(index) * 0.1, index * 0.012, Math.cos(index) * 0.07], [0.3, 0.4], [index * 0.02, index * 0.11, index * 0.05], false)
    this.addInteraction(evidence, 'evidence', 'medicine', 'C', '取得证据 C · 朱笔改字与簿页残片', [0, 0.2, 0], [0.46, 0.42, 0.12], true)
    // 朱砂点缀：印泥盒 + 药束朱绳
    roundedBox(bench, [0.18, 0.1, 0.18], [3.9, 1.28, -2.3], RED, 0.03)
    for (const herb of herbs) {
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.014, 6, 16), RED)
      cord.position.set(herb.x, 1.33, -1.53)
      cord.rotation.x = Math.PI / 2
      bench.add(cord)
    }
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
    // 纸钱成串贴墙 + 落地散张：不再随机 confetti（随机 z 曾落到相机脸上变成悬空大板）
    addPaperString(group, [-6.7, 3.4, -3.6], 6, Math.PI / 2)
    addPaperString(group, [-6.7, 3.1, -1.2], 5, Math.PI / 2)
    addPaperString(group, [6.7, 3.5, 1.6], 6, -Math.PI / 2)
    for (const [x, z, r] of [[-4.6, 2.6, 0.4], [-2.2, 3.4, 1.2], [3.4, 2.2, 2.1], [1.6, 4.2, 0.8], [-5.2, -3.4, 1.7]] as const) {
      addPaper(group, [x, 0.17, z], [0.24, 0.32], [-Math.PI / 2, 0, r], false)
    }
    addPaper(group, [-1.1, 1.24, -1.2], [0.26, 0.34], [-Math.PI / 2, 0, 0.5], false)
    // 北门洞见雾：门后一片乳白雾幕
    const doorMist = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.1), new THREE.MeshBasicMaterial({ map: mistMap, color: 0xb9c4bd, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }))
    doorMist.position.set(0, 1.7, -9.4)
    doorMist.userData.mist = true
    group.add(doorMist)
    for (const x of [-5.8, -4.7, 4.7, 5.8]) addBanner(group, [x, 4.5, -4.2 + Math.random() * 7.5], [0.65, 2.1], x < 0 ? 0.04 : Math.PI - 0.04)
  }

  /** 第二殿 · 业秤：挑高大殿中央悬一杆铜秤，右盘空而更低；地面散砝码，东南角立时辰盘 */
  private buildScale(): void {
    const group = this.room('scale', 48, '第二殿 · 业秤')

    // 北墙足秤偈碑
    roundedBox(group, [3.4, 1.7, 0.18], [0, 2.35, 55.55], STONE, 0.04)
    label(group, '十六两为斤 · 五十两为足秤', [0, 2.72, 55.43], 3.0, false, Math.PI)
    this.addInteraction(group, 'inscription', 'scale', 'gatha', '读足秤偈', [0, 2.35, 55.5], [3.2, 1.6, 0.4], true)

    // 中央杆秤：吊链 + 横梁 + 秤星 + 双盘
    for (const dx of [-0.55, 0, 0.55]) cylinder(group, 0.022, 2.0, [dx, 3.75, 47], BRONZE)
    const linkRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.024, 8, 18), BRONZE)
    linkRing.position.set(0, 2.76, 47)
    group.add(linkRing)
    const beam = new THREE.Group()
    beam.position.set(0, 2.72, 47)
    group.add(beam)
    const rod = cylinder(beam, 0.06, 5.4, [0, 0, 0], BRONZE)
    rod.rotation.z = Math.PI / 2
    for (let index = 0; index < 16; index += 1) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: 0x93a493, metalness: 0.85, roughness: 0.3 }))
      star.position.set(-2.3 + index * 0.306, 0.08, 0)
      beam.add(star)
    }
    this.scaleBeam = beam
    const makePan = (x: number, y: number, loaded: boolean): THREE.Group => {
      const pan = new THREE.Group()
      pan.position.set(x, y, 47)
      group.add(pan)
      for (const [rx, rz] of [[0.3, 0], [-0.15, 0.26], [-0.15, -0.26]]) cylinder(pan, 0.014, 1.16, [rx * 0.55, 0.62, rz * 0.55], BRONZE)
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.1, 28), BRONZE)
      pan.add(dish)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.032, 8, 32), BRONZE)
      rim.rotation.x = Math.PI / 2
      rim.position.y = 0.05
      pan.add(rim)
      if (loaded) {
        for (let index = 0; index < 9; index += 1) {
          const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.12, 0.18 + (index % 3) * 0.06, 14), BRONZE)
          weight.position.set(Math.sin(index * 2.4) * 0.3, 0.14 + Math.floor(index / 3) * 0.15, Math.cos(index * 1.7) * 0.3)
          weight.castShadow = true
          pan.add(weight)
        }
      }
      return pan
    }
    this.scaleLeftPan = makePan(-2.35, 1.42, true)
    this.scaleRightPan = makePan(2.35, 1.42, false)
    const ghostFlame = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 8), GHOST_FLAME)
    ghostFlame.position.set(2.35, 0.24, 47)
    group.add(ghostFlame)
    light(group, [2.35, 0.55, 47], 0x3fae7a, 2.4, 0.05)

    // 冷白光柱斜落秤盘
    const shaft = new THREE.SpotLight(0xdfeee6, 90, 15, 0.3, 0.55, 1.2)
    shaft.position.set(1.7, 5.3, 48.7)
    shaft.target.position.set(0.8, 1.3, 47)
    group.add(shaft)
    group.add(shaft.target)

    // 东南角时辰盘
    const pedestal = new THREE.Group()
    pedestal.position.set(2.3, 0, 44)
    group.add(pedestal)
    roundedBox(pedestal, [0.95, 0.9, 0.95], [0, 0.45, 0], WOOD, 0.05)
    roundedBox(pedestal, [1.15, 0.12, 1.15], [0, 0.95, 0], WOOD, 0.04)
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.055, 40), STONE)
    dial.position.y = 1.08
    pedestal.add(dial)
    for (let index = 0; index < 12; index += 1) {
      const tick = box(pedestal, [0.02, 0.012, 0.1], [Math.sin(index * Math.PI / 6) * 0.56, 1.115, Math.cos(index * Math.PI / 6) * 0.56], BRONZE)
      tick.castShadow = false
    }
    const slot = roundedBox(pedestal, [0.17, 0.05, 0.17], [0, 1.1, 0.42], DARK_STONE, 0.02)
    slot.castShadow = false
    this.addEngraving(pedestal, '未', [0, 1.115, 0.42], 0.26)
    label(pedestal, '十二时辰 · 未时压槽', [0, 1.66, 0], 0.95)
    this.addInteraction(pedestal, 'hourplate', 'scale', 'hourplate', '查看时辰盘', [0, 1.15, 0.2], [1.1, 0.5, 1.1], true)

    // 地面散砝码（六枚，可拾）
    const pileSpots: [number, number, number][] = [
      [-5.2, 0.14, 45.2], [-4.7, 0.16, 46.1], [-5.4, 0.13, 46.9],
      [-4.5, 0.17, 47.6], [-5.1, 0.15, 48.5], [-4.3, 0.16, 49.3]
    ]
    for (const [index, weight] of SCALE_WEIGHTS.entries()) {
      const mesh = new THREE.Group()
      const spot = pileSpots[index]
      mesh.position.set(spot[0], spot[1], spot[2])
      mesh.rotation.y = index * 0.7
      group.add(mesh)
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.22, 14), BRONZE)
      mesh.add(body)
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), BRONZE)
      knob.position.y = 0.15
      mesh.add(knob)
      label(group, weight.name, [spot[0], 0.55, spot[2]], 0.72, false, index % 2 ? -0.5 : 0.5)
      const target = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
      target.position.set(spot[0], 0.32, spot[2])
      group.add(target)
      this.weightMeshes.set(weight.id, mesh)
      this.interactions.push({ object: target, kind: 'weight', act: 'scale', id: weight.id, label: `拾起 · ${weight.name}`, enabled: true })
    }

    // 多出的一两（秤平后才现身，悬在未时槽上方）
    const extra = new THREE.Group()
    extra.position.set(2.3, 1.72, 44.42)
    extra.visible = false
    group.add(extra)
    const extraBody = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.13, 12), new THREE.MeshStandardMaterial({ color: 0xb8c7bb, metalness: 0.9, roughness: 0.25, emissive: 0x1c3328, emissiveIntensity: 0.5 }))
    extra.add(extraBody)
    extra.userData.origin = extra.position.clone()
    floatingObjects.push(extra)
    this.hourWeight = extra
    const extraTarget = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
    extra.add(extraTarget)
    this.interactions.push({ object: extraTarget, kind: 'weight', act: 'scale', id: 'yiliang-extra', label: '把多出的一两压进未时', enabled: false })

    // 半印② 落在时辰盘上
    this.addSeal(group, 'scale', 'seal2', '半印② · 多出的一两', [2.3, 1.85, 44])

    addLantern(group, [-5.5, 2.7, 43.2], 0.78)
    addLantern(group, [5.6, 2.9, 51], 0.82)
    light(group, [0, 3.9, 47.5], 0xcfe8dc, 10, 0.06)
    light(group, [-4.6, 2.9, 50.5], 0x9fcdb9, 4, 0.05)
    light(group, [0.5, 2.4, 44], 0xa9d6c5, 3.4, 0.05)
  }

  /** 第三殿 · 簿库：六层簿架三面围合，中央长案侧光斜照，架尽黑暗里悬空一册自翻 */
  private buildArchive(): void {
    const group = this.room('archive', 24, '第三殿 · 簿库')

    // 北墙大簿架（六层）
    const shelfMaterial = WOOD.clone()
    shelfMaterial.color.setHex(0x7d7158)
    box(group, [10.9, 4.5, 0.8], [0, 2.3, 31.05], shelfMaterial)
    const bookGeometry = new RoundedBoxGeometry(0.17, 0.32, 0.06, 1, 0.012)
    const bookMaterial = new THREE.MeshStandardMaterial({ map: paperTexture, color: 0xd4c9a8, roughness: 0.94, emissive: 0x241a0c, emissiveIntensity: 0.8 })
    const northBooks = new THREE.InstancedMesh(bookGeometry, bookMaterial, 168)
    const transform = new THREE.Object3D()
    let bookIndex = 0
    for (let tier = 0; tier < 6; tier += 1) {
      for (let column = 0; column < 28; column += 1) {
        transform.position.set(-5.1 + column * 0.36, 0.62 + tier * 0.68, 30.6)
        transform.rotation.set(0, Math.PI, (column % 5 - 2) * 0.02)
        transform.updateMatrix()
        northBooks.setMatrixAt(bookIndex, transform.matrix)
        bookIndex += 1
      }
    }
    northBooks.instanceMatrix.needsUpdate = true
    group.add(northBooks)
    // 东西两侧矮架
    for (const side of [-1, 1]) {
      box(group, [0.75, 3.1, 10.6], [side * 6.25, 1.58, 23.6], shelfMaterial)
      const sideBooks = new THREE.InstancedMesh(bookGeometry, bookMaterial, 88)
      let sideIndex = 0
      for (let tier = 0; tier < 4; tier += 1) {
        for (let row = 0; row < 22; row += 1) {
          transform.position.set(side * 6.1, 0.5 + tier * 0.66, 18.8 + row * 0.44)
          transform.rotation.set(0, side * Math.PI / 2, (row % 4 - 1) * 0.02)
          transform.updateMatrix()
          sideBooks.setMatrixAt(sideIndex, transform.matrix)
          sideIndex += 1
        }
      }
      sideBooks.instanceMatrix.needsUpdate = true
      group.add(sideBooks)
    }

    // 翻错的两册（突出架外一小截）
    for (const [id, x, y, name] of [
      ['jiawu', -1.6, 1.95, '甲午册'],
      ['gengshen', 1.9, 2.65, '庚申册']
    ] as const) {
      const poking = roundedBox(group, [0.2, 0.36, 0.3], [x, y, 30.55], bookMaterial, 0.015)
      poking.rotation.y = Math.PI
      this.addInteraction(group, 'register', 'archive', id, `翻查 · ${name}`, [x, y, 30.4], [0.42, 0.5, 0.5], true)
    }

    // 中央长案：摊开的簿子 + 侧光灯 + 朱笔
    const desk = new THREE.Group()
    desk.position.set(-1.9, 0, 22)
    group.add(desk)
    roundedBox(desk, [1.15, 0.09, 2.4], [0, 1.03, 0], WOOD, 0.045)
    for (const [lx, lz] of [[-0.45, -1.05], [0.45, -1.05], [-0.45, 1.05], [0.45, 1.05]]) roundedBox(desk, [0.14, 1.0, 0.14], [lx, 0.5, lz], WOOD, 0.03)
    const leftPage = roundedBox(desk, [0.44, 0.035, 0.62], [-0.23, 1.1, -0.3], PAPER, 0.012)
    leftPage.rotation.z = 0.03
    const rightPage = roundedBox(desk, [0.44, 0.035, 0.62], [0.23, 1.1, -0.3], PAPER, 0.012)
    rightPage.rotation.z = -0.03
    const spine = roundedBox(desk, [0.06, 0.05, 0.62], [0, 1.12, -0.3], shelfMaterial, 0.015)
    spine.castShadow = false
    this.addEngraving(desk, '卒于丙午', [0.23, 1.125, -0.28], 0.3)
    label(desk, '生于', [0.2, 1.128, -0.1], 0.34, true)
    this.scrapeMark = desk.children[desk.children.length - 1]
    this.scrapeMark.visible = false
    const brush = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.4, 10), WOOD)
    brush.position.set(0.05, 1.15, 0.55)
    brush.rotation.z = Math.PI / 2 - 0.2
    desk.add(brush)
    const brushTip = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.09, 8), new THREE.MeshStandardMaterial({ color: 0x7a1d26, roughness: 0.6 }))
    brushTip.position.set(0.05, 1.16, 0.78)
    brushTip.rotation.x = Math.PI / 2
    desk.add(brushTip)
    const brushTarget = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
    brushTarget.position.set(0.05, 1.25, 0.6)
    desk.add(brushTarget)
    this.interactions.push({ object: brushTarget, kind: 'brush', act: 'archive', id: 'brush', label: '取朱笔勘合', enabled: false })

    // 铜侧光灯（窄束斜打纸面）
    const lamp = new THREE.Group()
    lamp.position.set(-0.52, 1.08, 0.15)
    desk.add(lamp)
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.05, 16), BRONZE)
    lamp.add(lampBase)
    const lampArm = cylinder(lamp, 0.016, 0.42, [0, 0.22, 0], BRONZE)
    lampArm.rotation.x = -0.5
    const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 12), BRONZE)
    lampHead.position.set(0.02, 0.4, 0.18)
    lampHead.rotation.x = 2.2
    lamp.add(lampHead)
    const sideBeam = new THREE.SpotLight(0xe8d9b0, 55, 6, 0.24, 0.65, 1.4)
    sideBeam.position.set(-1.35, 1.62, 22.25)
    sideBeam.target.position.set(-1.6, 1.12, 21.75)
    desk.add(sideBeam)
    desk.add(sideBeam.target)
    const lampTarget = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
    lampTarget.position.set(-0.52, 1.4, 0.15)
    desk.add(lampTarget)
    this.interactions.push({ object: lampTarget, kind: 'lamp', act: 'archive', id: 'lamp', label: '举起侧光灯', enabled: true })

    // 架尽黑暗里悬空自翻的丙午册（唯一悬浮物，谜题关键）
    const floatingBook = new THREE.Group()
    floatingBook.position.set(5.15, 2.35, 17.7)
    group.add(floatingBook)
    for (const side of [-1, 1]) {
      const page = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.028), PAPER)
      page.position.set(side * 0.16, 0, 0.03)
      page.rotation.y = side * 0.55
      page.rotation.x = side * 0.12
      floatingBook.add(page)
    }
    floatingBook.userData.origin = floatingBook.position.clone()
    floatingObjects.push(floatingBook)
    const bookTarget = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
    floatingBook.add(bookTarget)
    this.interactions.push({ object: bookTarget, kind: 'register', act: 'archive', id: 'bingwu', label: '翻查 · 悬空自翻的那一册', enabled: true })

    // 墙角纸扎人（半边肩膀藏在架后，无脸）
    const figure = new THREE.Group()
    figure.position.set(-5.5, 0, 30.2)
    figure.rotation.y = 2.4
    group.add(figure)
    const paperSkin = new THREE.MeshStandardMaterial({ map: paperTexture, color: 0xd8d2bc, roughness: 0.96 })
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.95, 10), paperSkin)
    torso.position.y = 0.72
    figure.add(torso)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), paperSkin)
    head.position.y = 1.32
    figure.add(head)
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 8), paperSkin)
      arm.position.set(side * 0.26, 0.95, 0)
      arm.rotation.z = side * -0.25
      figure.add(arm)
    }

    // 长案通向架深处的纸灰脚印
    for (let index = 0; index < 7; index += 1) {
      const t = index / 6
      const x = -1.4 + t * 6.1
      const z = 23.4 - t * 5.2
      addFootprint(group, [x, 0.02, z], -0.72 + Math.sin(index) * 0.18)
    }

    this.addSeal(desk, 'archive', 'seal3', '半印③ · 刮改勘合', [0, 1.42, 0.15])

    addLantern(group, [5.4, 2.7, 28.5], 0.7)
    light(group, [0, 3.8, 24], 0xd8c9a0, 13, 0.07)
    light(group, [-4.2, 3.1, 19.8], 0xcbb98f, 6.5, 0.055)
    light(group, [4.2, 3.1, 27.8], 0xcbb98f, 6.5, 0.055)
    light(group, [-4.8, 2.7, 19.5], 0xbfae87, 3.5, 0.05)
    light(group, [4.6, 2.2, 18.6], 0x86c9a8, 2.6, 0.045)
  }

  private buildCorridor(center: number): void {
    const group = new THREE.Group()
    group.userData.corridor = center
    this.root.add(group)
    box(group, [3.2, 0.2, 8], [0, -0.1, center], STONE)
    box(group, [0.25, 3.3, 8], [-1.7, 1.65, center], DARK_STONE)
    box(group, [0.25, 3.3, 8], [1.7, 1.65, center], DARK_STONE)
    box(group, [3.65, 0.25, 8], [0, 3.35, center], WOOD)
    light(group, [0, 2.8, center], 0x89bcaa, 4)
  }

  private buildPalace(): void {
    const group = this.room('palace', -28, '第五殿 · 九宫阵')
    // 墙/顶微 emissive + 冷青 rim：勾出大殿四至，不拉全局曝光
    const palaceStone = DARK_STONE.clone()
    palaceStone.emissive = new THREE.Color(0x0a1210)
    palaceStone.emissiveIntensity = 0.4
    group.traverse((node) => {
      const mesh = node as THREE.Mesh
      if (mesh.isMesh && mesh.material === DARK_STONE) mesh.material = palaceStone
    })
    for (const z of [-33.2, -22.8]) box(group, [14, 0.22, 0.36], [0, 4.78, z], WOOD)
    for (const x of [-5.4, 5.4]) box(group, [0.36, 0.22, 10], [x, 4.78, -28], WOOD)
    for (let index = -2; index <= 2; index += 2) box(group, [0.08, 0.09, 10.3], [index * 1.55, 4.72, -28], WOOD)
    const caisson = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0x3a443d, emissive: 0x14231e, emissiveIntensity: 0.9, roughness: 0.85 }))
    caisson.position.set(0, 4.95, -28)
    group.add(caisson)
    const caissonRing = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 8, 8), BRONZE)
    caissonRing.rotation.x = Math.PI / 2
    caissonRing.position.set(0, 4.86, -28)
    group.add(caissonRing)
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
    // 局部坐标：altar 已在 z=-34.25，此处再写 -34.25 会双重偏移到六殿桥面
    evidence.position.set(1.2, 1.18, 0)
    altar.add(evidence)
    addPaper(evidence, [0, 0, 0], [0.45, 0.6], [0, 0.2, 0], false)
    this.addInteraction(evidence, 'evidence', 'palace', 'D', '取得证据 D · 有人一直在替你担责', [0, 0.13, 0], [0.42, 0.4, 0.1], true)
    label(group, '戴九履一 · 左三右七', [0, 2.7, -35.72], 4.0)
    light(group, [0, 1.75, -34.25], 0x8de1bc, 2.4, 0.04)

    const lampSpots: [number, number, number][] = [
      [-4.6, 0.34, -23.6], [0, 0.34, -23.6], [4.6, 0.34, -23.6],
      [-4.6, 0.34, -28], [4.6, 0.34, -28],
      [-4.6, 0.34, -32.5], [0, 0.34, -32.5], [4.6, 0.34, -32.5]
    ]
    // 八盏亮 +  front 中盏刚熄冒青烟
    for (const [x, y, z] of lampSpots) {
      const lamp = new THREE.Group()
      lamp.position.set(x, y, z)
      group.add(lamp)
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.12, 18), BRONZE)
      lamp.add(cup)
      if (x === 0 && z === -23.6) {
        const char = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.05, 8), new THREE.MeshStandardMaterial({ color: 0x1a1d1a, roughness: 1 }))
        char.position.y = 0.08
        lamp.add(char)
        addSteam(lamp, [0, 0.12, 0], 0.45)
      } else {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 8), GHOST_FLAME)
        flame.position.y = 0.12
        lamp.add(flame)
        light(lamp, [0, 0.28, 0], 0x8de1bc, 4.2, 0.05)
      }
    }
    for (const x of [-5.6, 5.6]) {
      for (const z of [-23.5, -27.5, -31.5]) {
        const banner = addBanner(group, [x, 4.35, z], [0.92, 3.25], x < 0 ? Math.PI / 2 : -Math.PI / 2)
        for (let row = 0; row < 3; row += 1) {
          const broken = row === 1
          const mark = new THREE.Mesh(new THREE.BoxGeometry(broken ? 0.28 : 0.46, 0.055, 0.025), BANNER_MARK)
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
    addPaperString(group, [-6.7, 3.2, -25.5], 5, Math.PI / 2)
    addPaperString(group, [6.7, 3.4, -30.5], 6, -Math.PI / 2)
    for (const [x, z, r] of [[-4.9, -22.6, 0.3], [4.4, -23.4, 1.1], [-3.6, -33.4, 2.0], [2.8, -33.8, 0.6], [0.4, -22.2, 1.6]] as const) {
      addPaper(group, [x, 0.17, z], [0.22, 0.3], [-Math.PI / 2, 0, r], false)
    }
    light(group, [-5.1, 2.1, -27], 0x95e1bf, 5, 0.055)
    light(group, [5.1, 2.1, -30], 0x95e1bf, 5, 0.055)
    light(group, [-6.3, 3.4, -24.5], 0x9fd8c0, 7, 0.05)
    light(group, [6.3, 3.4, -24.5], 0x9fd8c0, 7, 0.05)
    light(group, [-6.3, 3.4, -31.5], 0x9fd8c0, 7, 0.05)
    light(group, [6.3, 3.4, -31.5], 0x9fd8c0, 7, 0.05)
    light(group, [0, 4.5, -28], 0x8fc9b2, 6, 0.06)
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
    group.userData.act = 'reincarnation'
    this.root.add(group)
    box(group, [18, 0.36, 10], [0, -0.18, -47], STONE)
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const x = -7.1 + column * 2.03 + (row % 2) * 0.28
        const z = -43.2 - row * 2.1
        roundedBox(group, [1.92, 0.17, 1.96], [x, 0.08, z], WET_STONE, 0.045)
      }
    }

    const waterMaterial = new THREE.MeshPhysicalMaterial({ color: 0x0a1d1e, roughness: 0.62, metalness: 0.1, clearcoat: 0.35, clearcoatRoughness: 0.6, reflectivity: 0.08 })
    const water = new THREE.Mesh(new THREE.PlaneGeometry(46, 34, 64, 48), waterMaterial)
    water.rotation.x = -Math.PI / 2
    water.position.set(0, -0.55, -63)
    water.userData.water = true
    group.add(water)
    for (const x of [-12, 12]) {
      for (let index = 0; index < 18; index += 1) {
        const z = -48 - index * 1.75
        const bankStone = roundedBox(group, [1.4 + (index % 3) * 0.45, 0.55, 1.85], [x + Math.sin(index) * 0.4, 0.0, z], STONE, 0.08)
        bankStone.rotation.y = Math.sin(index * 7) * 0.16
      }
    }

    const bridgeArchHeight = 1.8
    const bridgeVisual = new THREE.Group()
    bridgeVisual.name = 'stone-bridge-fallback'
    group.add(bridgeVisual)
    this.createBridge(bridgeVisual, -52.2, -72.6, 4.3, bridgeArchHeight)
    for (const side of [-1, 1]) {
      const spandrelShape = new THREE.Shape()
      spandrelShape.moveTo(-10.2, -0.62)
      spandrelShape.lineTo(10.2, -0.62)
      spandrelShape.lineTo(10.2, 0.22)
      for (let step = 48; step >= 0; step -= 1) {
        const t = step / 48
        spandrelShape.lineTo(-10.2 + t * 20.4, 0.22 + Math.sin(t * Math.PI) * bridgeArchHeight)
      }
      spandrelShape.lineTo(-10.2, 0.22)
      const hole = new THREE.Path()
      hole.moveTo(-7.6, -0.58)
      for (let step = 0; step <= 32; step += 1) {
        const t = step / 32
        hole.lineTo(-7.6 + t * 15.2, -0.55 + Math.sin(t * Math.PI) * 2.55)
      }
      hole.lineTo(7.6, -0.58)
      hole.closePath()
      spandrelShape.holes.push(hole)
      const spandrelGeometry = new THREE.ExtrudeGeometry(spandrelShape, { depth: 0.42, bevelEnabled: false })
      const spandrel = new THREE.Mesh(spandrelGeometry, STONE)
      spandrel.position.set(side * 2.15, 0, -62.4)
      spandrel.castShadow = true
      spandrel.receiveShadow = true
      bridgeVisual.add(spandrel)
      for (const z of [-53.0, -71.8]) {
        const abutment = roundedBox(bridgeVisual, [0.9, 0.72, 1.7], [side * 2.15, 0.24, z], STONE, 0.04)
        abutment.receiveShadow = true
      }
      for (let index = 0; index <= 10; index += 1) {
        const t = index / 10
        const z = -52.2 - t * 20.4
        const y = 0.22 + Math.sin(t * Math.PI) * bridgeArchHeight
        const course = roundedBox(bridgeVisual, [0.46, 0.14, 1.7], [side * 2.15, y - 0.1, z], WET_STONE, 0.02)
        course.rotation.x = Math.atan(Math.cos(t * Math.PI) * bridgeArchHeight * Math.PI / 20.4)
      }
    }
    roundedBox(group, [5.2, 0.32, 8.2], [0, 0.06, -76.1], WET_STONE, 0.055)
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const z = -72.9 - row * 0.92
        roundedBox(group, [4.3, 0.12, 0.88], [0, 0.22 + 0.06, z], STONE, 0.02)
      }
    }
    const deckPavers = new THREE.InstancedMesh(new RoundedBoxGeometry(1.34, 0.07, 0.62, 1, 0.02), WET_STONE, 3 * 30)
    const deckTransform = new THREE.Object3D()
    let deckIndex = 0
    for (let row = 0; row < 30; row += 1) {
      const t = row / 29
      const z = -52.2 - t * 20.4
      const y = 0.22 + Math.sin(t * Math.PI) * bridgeArchHeight
      const slope = Math.cos(t * Math.PI) * bridgeArchHeight * Math.PI / 20.4
      for (let column = 0; column < 3; column += 1) {
        deckTransform.position.set(-1.36 + column * 1.36, y + 0.04, z)
        deckTransform.rotation.set(Math.atan(slope), 0, 0)
        deckTransform.scale.set(1, 1, 1)
        deckTransform.updateMatrix()
        deckPavers.setMatrixAt(deckIndex, deckTransform.matrix)
        deckPavers.setColorAt(deckIndex, new THREE.Color().setHSL(0.46, 0.06, 0.72 + Math.random() * 0.18))
        deckIndex += 1
      }
    }
    deckPavers.instanceMatrix.needsUpdate = true
    if (deckPavers.instanceColor) deckPavers.instanceColor.needsUpdate = true
    deckPavers.receiveShadow = true
    bridgeVisual.add(deckPavers)
    for (let index = 0; index < 12; index += 1) {
      const t = index / 12
      const z = -52.4 - t * 20.4
      const y = 0.22 + Math.sin(t * Math.PI) * bridgeArchHeight
      addFootprint(group, [Math.sin(index * 1.7) * 0.22, y + 0.085, z], Math.sin(index) * 0.12)
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
        if (index % 3 === 0) addLanternBracket(group, side * 2.35, y + 1.05, z, -side, 0.6)
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

    addLilyField(group)
    for (const [x, y, z, width, height] of [
      [-7.5, 2.4, -71.8, 18, 7],
      [7.0, 3.8, -81, 22, 10],
      [0, 6.5, -88, 24, 8],
      [-2.4, 1.3, -60, 17, 4]
    ] as const) {
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: mistMap, color: 0xb9c4bd, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }))
      mist.position.set(x, y, z)
      mist.userData.mist = true
      group.add(mist)
    }

    for (const side of [-1, 1]) {
      for (let index = 0; index < 3; index += 1) {
        const z = -55 - index * 6
        const x = side * 5.1
        cylinder(group, 0.085, 3.2, [x, 0.95, z], WOOD)
        addRaggedBanner(group, [x, 2.55, z], [1.75, 2.3], side * -Math.PI / 2 + 0.15)
      }
    }

    const pavilion = new THREE.Group()
    pavilion.position.set(-6.6, 0, -51.0)
    pavilion.scale.setScalar(0.95)
    group.add(pavilion)
    for (const x of [-1.35, 1.35]) for (const z of [-1.35, 1.35]) {
      roundedBox(pavilion, [0.22, 3.0, 0.22], [x, 1.5, z], WOOD, 0.035)
      roundedBox(pavilion, [0.4, 0.28, 0.4], [x, 0.18, z], BRONZE, 0.045)
    }
    roundedBox(pavilion, [3.4, 0.22, 3.4], [0, 3.0, 0], WOOD, 0.045)
    addTiledRoof(pavilion, [0, 3.12, 0], 5.0, 1.55)
    roundedBox(pavilion, [2.3, 0.18, 0.88], [0, 0.95, 0], WOOD, 0.05)
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.42, 0.64, 24), BRONZE)
    pot.position.set(0, 1.4, 0)
    pavilion.add(pot)
    addSteam(pavilion, [0, 1.75, 0])
    light(pavilion, [0, 2.1, 0.4], 0xcfe8dc, 2.6, 0.05)
    addLanternBracket(pavilion, 1.35, 2.55, 1.35, 1, 0.8)
    for (let index = 0; index < 6; index += 1) {
      bowl(pavilion, [-1.0 + index * 0.4, 1.04, 0.12], 0.12, 0.1, CELADON)
      const broth = new THREE.Mesh(new THREE.CircleGeometry(0.095, 12), new THREE.MeshPhysicalMaterial({ color: 0x66776b, roughness: 0.2 }))
      broth.rotation.x = -Math.PI / 2
      broth.position.set(-1.0 + index * 0.4, 1.125, 0.12)
      pavilion.add(broth)
    }

    for (let index = 0; index < 12; index += 1) {
      const z = -53.4 - index * 1.6
      const t = THREE.MathUtils.clamp((-z - 52.2) / 20.4, 0, 1)
      const y = 0.22 + Math.sin(Math.PI * t) * bridgeArchHeight
      const soul = addSoulSilhouette(group, [-0.35, y + 0.02, z], 0.74)
      soul.rotation.y = Math.PI
    }

    addBareTree(group, [6.7, -0.48, -61.5])
    for (const [y, z] of [[3.15, -62.2], [4.25, -60.8], [3.75, -64.1], [5.15, -62.4]] as const) {
      addLantern(group, [6.7 + Math.sin(y * 2) * 1.35, y, z], 0.52)
    }

    const wheelCenter = new THREE.Group()
    wheelCenter.name = 'six-realm-wheel-fallback'
    wheelCenter.position.set(0, 2.8, -75.6)
    wheelCenter.scale.setScalar(1.95)
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
    const shadowRing = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.075, 8, 64), new THREE.MeshBasicMaterial({ color: 0x8fa19a, transparent: true, opacity: 0.3 }))
    distantWheel.add(shadowRing)
    for (let index = 0; index < 6; index += 1) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.07, 8.1, 0.08), new THREE.MeshBasicMaterial({ color: 0x87938d, transparent: true, opacity: 0.26 }))
      spoke.rotation.z = index * Math.PI / 3
      distantWheel.add(spoke)
    }
    light(group, [0, 3.4, -73.6], 0xb9d8c8, 10, 0.09)

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
    const material = WHEEL_SECTOR[index % 2]
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

  /** 砝码拾起/放回：拾起后从地面隐藏 */
  setWeightVisible(id: string, visible: boolean): void {
    const mesh = this.weightMeshes.get(id)
    if (mesh) mesh.visible = visible
  }

  /** 左盘重量变化 → 秤杆倾斜（-0.085 为右盘低垂的初始异象，0 为水平） */
  markScalePlaced(sum: number, over: boolean): void {
    if (over) {
      this.scaleTiltTarget = -0.085
      return
    }
    const progress = THREE.MathUtils.clamp((sum - 30) / 20, 0, 1)
    this.scaleTiltTarget = -0.085 * (1 - progress)
  }

  resetWeights(ids: string[]): void {
    for (const id of ids) this.setWeightVisible(id, true)
  }

  /** 秤平后：多出的一两现身，悬在未时槽上方 */
  spawnHourWeight(): void {
    if (!this.hourWeight) return
    this.hourWeight.visible = true
    const interaction = this.interactions.find((item) => item.id === 'yiliang-extra')
    if (interaction) interaction.enabled = true
  }

  /** 那一两压进未时：落到槽里，停止悬浮 */
  pressHourVisual(): void {
    if (!this.hourWeight) return
    const index = floatingObjects.indexOf(this.hourWeight)
    if (index >= 0) floatingObjects.splice(index, 1)
    this.hourWeight.position.set(2.3, 1.16, 44.42)
    this.scaleTiltTarget = 0.012
    const interaction = this.interactions.find((item) => item.id === 'yiliang-extra')
    if (interaction) interaction.enabled = false
  }

  /** 丙午册找到：书页间透出幽光 */
  markRegisterFound(): void {
    if (this.registerGlow) return
    const glow = new THREE.PointLight(0x86c9a8, 2.6, 3.2, 1.8)
    glow.position.set(5.15, 2.5, 17.7)
    this.root.add(glow)
    this.registerGlow = glow
  }

  /** 侧光显影：案上浮现「生于」刮改 */
  revealScrape(): void {
    if (this.scrapeMark) this.scrapeMark.visible = true
  }

  markPalaceStep(value: number, correct: boolean, solved: boolean): void {
    const tile = this.stones.get(value)
    if (!tile) return
    const material = tile.material as THREE.MeshPhysicalMaterial
    // 步态反馈降饱和：刻字/边缘微光为主，整面不再像着色玻璃
    material.emissive = new THREE.Color(correct ? (solved ? 0x233c31 : 0x1d332a) : 0x160d0b)
    material.emissiveIntensity = correct ? (solved ? 0.5 : 0.4) : 0.24
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
    // 性能：前向渲染下每盏灯都参与每像素计算，全场 17 盏点光常开会让填充率爆炸。
    // 灯的衰减距离只有 9m，隔壁殿的灯本来就照不到——按殿启停，视觉不变、计算量大降。
    // 注意：灯笼内的点光是嵌套子节点，必须按世界坐标分区，不能用局部 position。
    const worldPosition = new THREE.Vector3()
    this.scene.updateMatrixWorld(true)
    this.scene.traverse((node) => {
      if (node instanceof THREE.PointLight || node instanceof THREE.SpotLight) {
        const z = node.getWorldPosition(worldPosition).z
        if (z > 8) node.visible = act === 'scale' || act === 'archive'
        else if (z > -16) node.visible = act === 'medicine'
        else if (z > -44) node.visible = act === 'palace'
        else node.visible = act === 'reincarnation'
      }
    })
    if (act === 'scale') {
      this.backgroundTarget.setHex(0x0a1211)
      this.fogTarget.setHex(0x151e1c)
      this.fog.density = 0.02
    } else if (act === 'archive') {
      this.backgroundTarget.setHex(0x14100a)
      this.fogTarget.setHex(0x241d12)
      this.fog.density = 0.024
    } else if (act === 'reincarnation') {
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
    if (z > 40) return 'scale'
    if (z > 16) return 'archive'
    if (z > -16) return 'medicine'
    if (z > -40) return 'palace'
    return 'reincarnation'
  }

  constrain(position: THREE.Vector3, previous: THREE.Vector3, completed: Set<ActId>): void {
    const act = this.actAt(position.z)
    const zone = this.zones.find((item) => item.act === act)!
    position.z = THREE.MathUtils.clamp(position.z, -81, 55)
    let width = 1.25
    if (position.z > 40 || (position.z > 16 && position.z < 32) || (position.z > -8 && position.z < 8) || (position.z < -20 && position.z > -36) || position.z < -44) width = zone.width / 2
    if (position.z < -50 && position.z > -74) width = 1.45
    position.x = THREE.MathUtils.clamp(position.x, -width, width)
    if (position.z > 8 && position.z < 16 && !completed.has('archive')) position.z = Math.max(position.z, 15.8)
    if (position.z > 32 && position.z < 40 && !completed.has('scale')) position.z = Math.max(position.z, 39.8)
    if (position.z < -8 && position.z > -20 && !completed.has('medicine')) position.z = Math.max(position.z, -7.8)
    if (position.z < -36 && position.z > -44 && !completed.has('palace')) position.z = Math.max(position.z, -35.8)
    for (const obstacle of this.obstacles) {
      const dx = position.x - obstacle.x
      const dz = position.z - obstacle.z
      const distance = Math.hypot(dx, dz)
      const minimum = obstacle.r + 0.32
      if (distance < minimum && distance > 0.0001) {
        position.x = obstacle.x + (dx / distance) * minimum
        position.z = obstacle.z + (dz / distance) * minimum
      }
    }
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
    if (this.scaleBeam) {
      this.scaleBeam.rotation.z += (this.scaleTiltTarget - this.scaleBeam.rotation.z) * Math.min(1, delta * 2.2)
      if (this.scaleLeftPan && this.scaleRightPan) {
        const tilt = this.scaleBeam.rotation.z
        const arm = 2.35
        this.scaleLeftPan.position.y = 1.42 - Math.sin(tilt) * arm
        this.scaleRightPan.position.y = 1.42 + Math.sin(tilt) * arm
      }
    }
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
    // 六殿预览走程序几何：石桥 GLB 会遮住新做的拱腹侧影。
    const proceduralBridge = /river/i.test(new URLSearchParams(window.location.search).get('view') ?? '')
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
      if (proceduralBridge && asset.file === 'stone-bridge.glb') continue
      const place = (gltf: { scene: THREE.Group }) => {
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
      }
      const originalUrl = `/assets/generated/${asset.file}`
      loader.load(`/assets/generated/webp/${asset.file}`, place, undefined, () => loader.load(originalUrl, place, undefined, () => undefined))
    }
  }
}

export function actDefinition(act: ActId) {
  return ACTS.find((item) => item.id === act)!
}
