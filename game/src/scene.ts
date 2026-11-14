import * as THREE from 'three'
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

const STONE = new THREE.MeshStandardMaterial({ color: 0x52615b, roughness: 0.94 })
const DARK_STONE = new THREE.MeshStandardMaterial({ color: 0x2d3b36, roughness: 0.9 })
const WOOD = new THREE.MeshStandardMaterial({ color: 0x49382a, roughness: 0.72 })
const BRONZE = new THREE.MeshStandardMaterial({ color: 0x596650, roughness: 0.52, metalness: 0.65 })
const CELADON = new THREE.MeshPhysicalMaterial({ color: 0x739c88, roughness: 0.25, clearcoat: 0.7 })
const RED = new THREE.MeshStandardMaterial({ color: 0x8d1522, roughness: 0.72, side: THREE.DoubleSide })

function box(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material)
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

function light(parent: THREE.Object3D, position: [number, number, number], color = 0x93d8bd, intensity = 5): void {
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.5 }))
  lamp.position.set(...position)
  parent.add(lamp)
  const source = new THREE.PointLight(color, intensity * 2.3, 13, 1.5)
  source.position.set(...position)
  parent.add(source)
}

export class EscapeWorld {
  readonly root = new THREE.Group()
  readonly interactions: WorldInteraction[] = []
  readonly zones: Zone[] = [
    { act: 'medicine', center: 0, halfDepth: 8, width: 13.6 },
    { act: 'palace', center: -28, halfDepth: 8, width: 13.6 },
    { act: 'reincarnation', center: -64, halfDepth: 19, width: 29 }
  ]
  private readonly seals: THREE.Mesh[] = []
  private readonly wheels: THREE.Object3D[] = []
  private portal: THREE.Mesh | null = null
  private elapsed = 0

  constructor(private readonly scene: THREE.Scene) {
    scene.add(this.root)
    scene.background = new THREE.Color(0x080d0d)
    scene.fog = new THREE.FogExp2(0x111b19, 0.024)
    scene.add(new THREE.HemisphereLight(0xb7c6b4, 0x18231d, 1.65))
    const fill = new THREE.DirectionalLight(0xc5d5c2, 1.2)
    fill.position.set(2, 5, 4)
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
    box(group, [14, 0.25, 16], [0, -0.125, center], STONE)
    box(group, [0.35, 5, 16], [-7, 2.5, center], DARK_STONE)
    box(group, [0.35, 5, 16], [7, 2.5, center], DARK_STONE)
    for (const end of [-1, 1]) {
      const z = center + end * 8
      box(group, [5.7, 5, 0.35], [-4.15, 2.5, z], DARK_STONE)
      box(group, [5.7, 5, 0.35], [4.15, 2.5, z], DARK_STONE)
      box(group, [2.6, 1.8, 0.35], [0, 4.1, z], DARK_STONE)
      box(group, [0.25, 3.2, 0.55], [-1.45, 1.6, z], WOOD)
      box(group, [0.25, 3.2, 0.55], [1.45, 1.6, z], WOOD)
      box(group, [3.15, 0.3, 0.55], [0, 3.15, z], WOOD)
    }
    for (const x of [-5.8, 5.8]) {
      for (const z of [center - 5.8, center, center + 5.8]) cylinder(group, 0.25, 5, [x, 2.5, z], WOOD)
    }
    box(group, [14, 0.25, 0.35], [0, 4.7, center - 4], WOOD)
    box(group, [14, 0.25, 0.35], [0, 4.7, center + 4], WOOD)
    label(group, title, [0, 3.7, center - 7.78])
    light(group, [-5.3, 2.7, center + 4.8])
    light(group, [5.3, 2.7, center - 4.8])
    this.addInteraction(group, 'exit', act, 'exit', '穿过门洞，前往下一殿', [0, 1.2, center - 7.6], [1.7, 2.4, 0.3], false)
    return group
  }

  private buildMedicine(): void {
    const group = this.room('medicine', 0, '第四殿 · 药局')
    const cabinet = new THREE.Group()
    cabinet.position.set(-5.65, 0, -0.5)
    group.add(cabinet)
    box(cabinet, [1.25, 4.1, 10], [0, 2.05, 0], WOOD)
    const drawerGeometry = new THREE.BoxGeometry(0.22, 0.42, 0.69)
    const drawers = new THREE.InstancedMesh(drawerGeometry, WOOD, 108)
    const transform = new THREE.Object3D()
    for (let index = 0; index < 108; index += 1) {
      const row = Math.floor(index / 12)
      const column = index % 12
      transform.position.set(0.71 + (index % 7 === 0 ? 0.13 : 0), 0.4 + row * 0.42, -4.25 + column * 0.75)
      transform.updateMatrix()
      drawers.setMatrixAt(index, transform.matrix)
    }
    cabinet.add(drawers)
    box(group, [3.4, 0.22, 1.5], [1.2, 1.05, -0.5], WOOD)
    for (const x of [-0.2, 2.6]) for (const z of [-1.05, 0.05]) box(group, [0.18, 1, 0.18], [x, 0.5, z], WOOD)
    const herbs = [
      { id: 'danggui', x: -0.05, z: -0.75, color: 0x816142 },
      { id: 'yuanzhi', x: 0.85, z: -0.75, color: 0x72744c },
      { id: 'hehuan', x: 1.75, z: -0.75, color: 0x806b72 },
      { id: 'wangyou', x: 2.55, z: -0.75, color: 0x8c814f }
    ]
    for (const herb of herbs) {
      const material = new THREE.MeshStandardMaterial({ color: herb.color, roughness: 0.95, emissive: 0x18251c, emissiveIntensity: 0.3 })
      const object = box(group, [0.55, 0.1, 0.42], [herb.x, 1.2, herb.z], material)
      this.interactions.push({ object, kind: 'herb', act: 'medicine', id: herb.id, label: `取药 · ${herb.id === 'danggui' ? '当归（君）' : herb.id === 'yuanzhi' ? '远志（臣）' : herb.id === 'hehuan' ? '合欢（佐）' : '忘忧（使）'}`, enabled: true })
    }
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), CELADON)
    bowl.scale.y = 0.55
    bowl.position.set(-4.8, 1.55, 0.1)
    group.add(bowl)
    this.interactions.push({ object: bowl, kind: 'bowl', act: 'medicine', id: 'aman', label: '查看青瓷药碗', enabled: true })
    this.addSeal(group, 'medicine', 'seal4', '半印④ · 不忘汤已成', [3.6, 1.45, -4.7])
    this.addInteraction(group, 'evidence', 'medicine', 'C', '取得证据 C · 朱笔改字与簿页残片', [3.6, 1.1, -3.9], [0.6, 0.05, 0.45], true)
    light(group, [-4.5, 2.1, 0], 0xa2c9a9, 4)
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
        const material = new THREE.MeshStandardMaterial({ color: 0x485753, roughness: 0.83, emissive: 0x152921, emissiveIntensity: 0.15 })
        box(group, [1.65, 0.2, 1.65], [(column - 1) * 2.05, 0.08, -25.7 - row * 2.05], material)
        label(group, String(value), [(column - 1) * 2.05, 0.195, -25.7 - row * 2.05], 0.55, true)
      }
    }
    box(group, [3.2, 0.2, 1.1], [0, 1.05, -33.3], WOOD)
    box(group, [0.2, 1, 0.8], [-1.25, 0.5, -33.3], WOOD)
    box(group, [0.2, 1, 0.8], [1.25, 0.5, -33.3], WOOD)
    label(group, '戴九履一 · 左三右七', [0, 2.5, -35.7], 4.5)
    this.addSeal(group, 'palace', 'seal5', '半印⑤ · 案由未问', [0, 1.45, -33.3])
    this.addInteraction(group, 'evidence', 'palace', 'D', '取得证据 D · 有人一直在替你担责', [2.3, 1.1, -33.3], [0.6, 0.05, 0.45], true)
    for (const x of [-4.5, 4.5]) for (const z of [-23, -28, -33]) light(group, [x, 1.4, z], 0x77a88e, 2.5)
  }

  private buildReincarnation(): void {
    const group = new THREE.Group()
    this.root.add(group)
    box(group, [30, 0.3, 8], [0, -0.15, -47], STONE)
    box(group, [3.2, 0.3, 27], [0, 0.35, -60], STONE)
    for (const x of [-1.65, 1.65]) {
      box(group, [0.18, 0.8, 27], [x, 0.9, -60], DARK_STONE)
      for (let z = -48; z >= -72; z -= 3) cylinder(group, 0.13, 1.3, [x, 0.8, z], STONE)
    }
    const water = new THREE.Mesh(new THREE.PlaneGeometry(45, 45), new THREE.MeshStandardMaterial({ color: 0x071514, roughness: 0.2, metalness: 0.35 }))
    water.rotation.x = -Math.PI / 2
    water.position.set(0, -0.4, -63)
    group.add(water)
    box(group, [26, 0.4, 12], [0, -0.2, -77], STONE)
    for (let index = 0; index < 160; index += 1) {
      const side = index % 2 === 0 ? -1 : 1
      const x = side * (2.6 + (index % 9) * 0.65)
      const z = -48 - (index % 40) * 0.72
      const stem = cylinder(group, 0.018, 0.5, [x, 0.05, z], BRONZE)
      stem.castShadow = false
      const flower = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.28, 5, 1, true), RED)
      flower.position.set(x, 0.36, z)
      flower.rotation.z = Math.PI
      group.add(flower)
    }
    const pavilion = new THREE.Group()
    pavilion.position.set(-5, 0, -48)
    group.add(pavilion)
    for (const x of [-1.2, 1.2]) for (const z of [-1.2, 1.2]) cylinder(pavilion, 0.12, 3, [x, 1.5, z], WOOD)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 0.8, 4), WOOD)
    roof.rotation.y = Math.PI / 4
    roof.position.y = 3.2
    pavilion.add(roof)
    cylinder(pavilion, 0.65, 0.55, [0, 0.45, 0], BRONZE)
    for (let z = -48; z >= -72; z -= 4) light(group, [0, 2.8, z], 0xc6d7b9, 3)
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 10, 48), BRONZE)
    wheel.position.set(0, 2.4, -75)
    group.add(wheel)
    this.wheels.push(wheel)
    for (let index = 0; index < 6; index += 1) {
      const spoke = box(group, [0.1, 2.9, 0.12], [0, 2.4, -75], WOOD)
      spoke.rotation.z = index * Math.PI / 3
      this.wheels.push(spoke)
    }
    const portalMaterial = new THREE.MeshStandardMaterial({ color: 0xb8d8c3, emissive: 0x9dc6b4, emissiveIntensity: 0.8, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    this.portal = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), portalMaterial)
    this.portal.position.set(0, 2, -80)
    group.add(this.portal)
    box(group, [0.45, 4.3, 0.6], [-1.75, 2.15, -80], DARK_STONE)
    box(group, [0.45, 4.3, 0.6], [1.75, 2.15, -80], DARK_STONE)
    box(group, [4, 0.45, 0.6], [0, 4.2, -80], DARK_STONE)
    box(group, [1.6, 1, 0.9], [0, 0.85, -72.8], DARK_STONE)
    this.addInteraction(group, 'combine', 'reincarnation', 'combine', '将六枚半印合于路引', [0, 1.4, -72.3], [1.5, 0.6, 0.9], true)
    const endings = [
      { id: 'return', x: -3, title: '还阳' },
      { id: 'replace', x: 0, title: '顶名' },
      { id: 'judge', x: 3, title: '留司' }
    ]
    for (const ending of endings) {
      const object = this.addInteraction(group, 'ending', 'reincarnation', ending.id, `选择结局 · ${ending.title}`, [ending.x, 1.1, -78.5], [1.5, 1.9, 0.25], false)
      label(group, ending.title, [ending.x, 2.45, -78.4], 1.4)
      object.userData.ending = ending.id
    }
  }

  private addInteraction(parent: THREE.Object3D, kind: InteractionKind, act: ActId, id: string, interactionLabel: string, position: [number, number, number], size: [number, number, number], enabled: boolean): THREE.Mesh {
    const material = new THREE.MeshStandardMaterial({ color: kind === 'exit' ? 0x243c34 : 0x665437, emissive: 0x324f40, emissiveIntensity: 0.35, transparent: kind === 'exit', opacity: kind === 'exit' ? 0.12 : 1 })
    const object = box(parent, size, position, material)
    this.interactions.push({ object, kind, act, id, label: interactionLabel, enabled })
    return object
  }

  private addSeal(parent: THREE.Object3D, act: ActId, id: string, interactionLabel: string, position: [number, number, number]): void {
    const seal = this.addInteraction(parent, 'seal', act, id, interactionLabel, position, [0.38, 0.38, 0.38], false)
    this.seals.push(seal)
  }

  setActSolved(act: ActId): void {
    const interaction = this.interactions.find((item) => item.act === act && item.kind === 'seal')
    if (interaction) interaction.enabled = true
  }

  openExit(act: ActId): void {
    const interaction = this.interactions.find((item) => item.act === act && item.kind === 'exit')
    if (interaction) interaction.enabled = true
  }

  showEndings(): void {
    for (const interaction of this.interactions) if (interaction.kind === 'ending') interaction.enabled = true
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
    if (position.z < -50 && position.z > -74) width = 1.25
    position.x = THREE.MathUtils.clamp(position.x, -width, width)
    if (position.z < -8 && position.z > -20 && !completed.has('medicine')) position.z = Math.max(position.z, -7.8)
    if (position.z < -36 && position.z > -44 && !completed.has('palace')) position.z = Math.max(position.z, -35.8)
    position.y = position.z < -49 && position.z > -74 ? 2 : 1.65
    if (!Number.isFinite(position.x)) position.copy(previous)
  }

  update(delta: number): void {
    this.elapsed += delta
    for (const seal of this.seals) seal.rotation.y += delta * 0.55
    for (const wheel of this.wheels) wheel.rotation.z += delta * 0.035
    if (this.portal) {
      const material = this.portal.material as THREE.MeshStandardMaterial
      material.opacity = 0.23 + Math.sin(this.elapsed * 1.3) * 0.07
    }
  }

  private loadAssets(): void {
    const loader = new GLTFLoader()
    const assets = [
      { file: 'herbal-cabinet.glb', position: [-5.45, 0.1, -0.5], size: [1.5, 4, 9], rotation: Math.PI / 2 },
      { file: 'dengzi-scale.glb', position: [1.3, 1.2, 0.1], size: [0.75, 0.45, 0.5], rotation: 0 },
      { file: 'celadon-bowl.glb', position: [-4.65, 1.3, 0.1], size: [0.42, 0.28, 0.42], rotation: 0 },
      { file: 'six-realm-wheel.glb', position: [0, 0.5, -75.1], size: [3, 3.6, 0.5], rotation: 0 },
      { file: 'nine-palace.glb', position: [0, 0.15, -28], size: [6, 0.3, 6], rotation: 0 },
      { file: 'stone-bridge.glb', position: [0, -0.1, -60], size: [3.4, 1.6, 26], rotation: 0 }
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
        wrapper.scale.set(asset.size[0] / Math.max(dimensions.x, 0.001), asset.size[1] / Math.max(dimensions.y, 0.001), asset.size[2] / Math.max(dimensions.z, 0.001))
        wrapper.position.set(asset.position[0], asset.position[1] + asset.size[1] / 2, asset.position[2])
        wrapper.rotation.y = asset.rotation
        wrapper.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        this.root.add(wrapper)
      }, undefined, () => undefined)
    }
  }
}

export function actDefinition(act: ActId) {
  return ACTS.find((item) => item.id === act)!
}
