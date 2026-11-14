export type ActId = 'medicine' | 'palace' | 'reincarnation'
export type EndingId = 'return' | 'replace' | 'judge'

export type ActDefinition = {
  id: ActId
  number: string
  title: string
  subtitle: string
  objective: string
}

export const ACTS: readonly ActDefinition[] = [
  { id: 'medicine', number: '第四殿', title: '药局', subtitle: '五味 · 不忘汤', objective: '解藏头诗，按君臣佐使配出不忘汤。' },
  { id: 'palace', number: '第五殿', title: '九宫阵', subtitle: '步罡 · 核位', objective: '按洛书顺序踏完九块石板。' },
  { id: 'reincarnation', number: '第六殿', title: '轮回门', subtitle: '合符 · 终局', objective: '拼合六枚半印，走完自己的案子。' }
]

export const HERBS = [
  { id: 'danggui', name: '当归', role: '君' },
  { id: 'yuanzhi', name: '远志', role: '臣' },
  { id: 'hehuan', name: '合欢', role: '佐' },
  { id: 'wangyou', name: '忘忧', role: '使' }
] as const

export const HERB_ORDER = HERBS.map((herb) => herb.id)
export const LO_SHU_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export class MedicinePuzzle {
  private selected: string[] = []
  private solved = false

  select(id: string): { ok: boolean; solved: boolean; message: string } {
    if (this.solved) return { ok: true, solved: true, message: '汤色已清。不忘汤已配成。' }
    if (this.selected.includes(id)) return { ok: false, solved: false, message: '这味药已入药碾。' }
    const herb = HERBS.find((item) => item.id === id)
    if (!herb) return { ok: false, solved: false, message: '柜中没有这味药。' }
    this.selected.push(id)
    if (this.selected.length < HERB_ORDER.length) {
      return { ok: true, solved: false, message: `${herb.name} · ${herb.role}，已入药碾。` }
    }
    if (this.selected.every((item, index) => item === HERB_ORDER[index])) {
      this.solved = true
      return { ok: true, solved: true, message: '戥子平。药末落进碗里，汤色由白转清。' }
    }
    this.selected = []
    return { ok: false, solved: false, message: '五味乱了。重配。按君、臣、佐、使。' }
  }

  get progress(): string[] { return [...this.selected] }
  get isSolved(): boolean { return this.solved }
}

export class NinePalacePuzzle {
  private next = 0
  private solved = false

  step(value: number): { ok: boolean; solved: boolean; message: string } {
    if (this.solved) return { ok: true, solved: true, message: '九板同明，半印⑤已落。' }
    if (value !== LO_SHU_ORDER[this.next]) {
      this.next = 0
      return { ok: false, solved: false, message: '错了。一盏幽冥灯灭了。重来。' }
    }
    this.next += 1
    if (this.next === LO_SHU_ORDER.length) {
      this.solved = true
      return { ok: true, solved: true, message: '最后一步落在九。九块石板同时亮了。' }
    }
    return { ok: true, solved: false, message: `石板 ${value} 下沉。还剩 ${9 - this.next} 步。` }
  }

  get progress(): number { return this.next }
  get isSolved(): boolean { return this.solved }
}

export class JourneyState {
  readonly seals = new Set<number>()
  readonly evidence = new Set<string>(['A', 'B'])
  hasSoup = false
  hasFragment = false

  completeAct(act: ActId): void {
    const seal = { medicine: 4, palace: 5, reincarnation: 6 }[act]
    this.seals.add(seal)
    if (act === 'medicine') this.hasSoup = true
  }

  collectEvidence(id: string): void {
    this.evidence.add(id)
    if (id === 'C') this.hasFragment = true
  }

  get canCombine(): boolean { return this.seals.has(4) && this.seals.has(5) }
  get unlockedEndings(): EndingId[] {
    const endings: EndingId[] = ['return']
    if (this.hasSoup && ['A', 'B', 'D'].every((id) => this.evidence.has(id))) endings.push('replace')
    if (this.hasSoup && this.evidence.has('C') && this.hasFragment) endings.push('judge')
    return endings
  }
}

export const ENDINGS: Record<EndingId, { title: string; subtitle: string; text: string; condition: string }> = {
  return: { title: '还阳', subtitle: '结局一 · 庙前回首又寻常', text: '你饮下汤。再睁眼，是城隍庙前。石阶，门槛，一盏灯笼。你路过，看了一眼，没进去。', condition: '六印齐；饮汤忘前尘' },
  replace: { title: '顶名', subtitle: '结局二 · 再选一次', text: '你带着记忆，把名字留下。你不记得她，却又做了一次同样的决定。', condition: '不忘汤 + 证据 A / B / D' },
  judge: { title: '留司', subtitle: '结局三 · 甲字肆号', text: '你拿起朱笔，留在阴司接任判官。取号机轻响，一枚竹牌落下：甲字肆号。下一位亡魂进门。', condition: '不忘汤 + 证据 C + 簿页残片' }
}
