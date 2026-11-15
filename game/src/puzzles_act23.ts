/**
 * 第二殿（业秤）与第三殿（簿库）谜题。
 * 与 story.ts 的 MedicinePuzzle/NinePalacePuzzle 同一套约定：
 * 纯逻辑、无渲染依赖，select/step/place 等入口一律返回 { ok, solved, message }，
 * 供 main.ts 直接 toast，也供 Vitest 在无 WebGL 环境下单测。
 */

export type PuzzleResult = {
  ok: boolean
  solved: boolean
  message: string
}

/** 左盘预置砝码（亡魂自带的三十两），玩家需从地上补足到五十两 */
export const PRELOADED_TAELS = 30
export const TARGET_TAELS = 50
/** 解谜后要压进时辰盘的时辰（剧本正典：未时） */
export const CORRECT_HOUR = '未时'

/** 地上可拾取的砝码（十六两制散砝，各一枚） */
export const SCALE_WEIGHTS = [
  { id: 'shiliang', name: '十两砝码', value: 10 },
  { id: 'qiliang', name: '七两砝码', value: 7 },
  { id: 'wuliang', name: '五两砝码', value: 5 },
  { id: 'sanliang', name: '三两砝码', value: 3 },
  { id: 'erliang', name: '二两砝码', value: 2 },
  { id: 'yiliang', name: '一两砝码', value: 1 }
] as const

export type WeightId = (typeof SCALE_WEIGHTS)[number]['id']

/**
 * 第二殿 · 业秤：
 * ① 读偈文，往左盘放砝码补足五十两（超过即覆秤重来）
 * ② 秤平后，右盘上"看不见的那位"离手，多出的一两落在未时槽——把它压下去
 */
export class ScalePuzzle {
  private placed: WeightId[] = []
  private balanced = false
  private solved = false

  private valueOf(id: string): number {
    return SCALE_WEIGHTS.find((item) => item.id === id)?.value ?? 0
  }

  get placedWeights(): WeightId[] {
    return [...this.placed]
  }

  get sum(): number {
    return this.placed.reduce((total, id) => total + this.valueOf(id), PRELOADED_TAELS)
  }

  get isBalanced(): boolean {
    return this.balanced
  }

  get isSolved(): boolean {
    return this.solved
  }

  place(id: string): PuzzleResult {
    if (this.solved) return { ok: true, solved: true, message: '秤已平，印已落。业秤的这一案，结了。' }
    if (this.balanced) return { ok: true, solved: false, message: '秤已平。去把多出的一两压进未时。' }
    const weight = SCALE_WEIGHTS.find((item) => item.id === id)
    if (!weight) return { ok: false, solved: false, message: '那不是业秤的砝码。' }
    if (this.placed.includes(weight.id)) return { ok: false, solved: false, message: '这枚砝码已经在盘上了。' }
    const nextSum = this.sum + weight.value
    if (nextSum > TARGET_TAELS) {
      this.placed = []
      return { ok: false, solved: false, message: '多了。秤杆一翘，砝码全滚回地上。司吏道：善恶自有斤两。多出这一两，不是你的。重配。' }
    }
    this.placed.push(weight.id)
    if (nextSum === TARGET_TAELS) {
      this.balanced = true
      return { ok: true, solved: false, message: '五十两，足秤。右盘缓缓浮起——上面那位，走了。一枚一两的小砝码，落进了未时槽。' }
    }
    return { ok: true, solved: false, message: `左盘 ${nextSum} 两。还差 ${TARGET_TAELS - nextSum} 两。` }
  }

  pressHour(hour: string): PuzzleResult {
    if (this.solved) return { ok: true, solved: true, message: '未时已压。半印②早已落下。' }
    if (!this.balanced) return { ok: false, solved: false, message: '秤未平。时辰盘纹丝不动。' }
    if (hour !== CORRECT_HOUR) return { ok: false, solved: false, message: '那一两不认这个时辰。它只认未时。' }
    this.solved = true
    return { ok: true, solved: true, message: '多出的一两沉入未时。秤杆上第十六颗秤星亮起，半印②自己盖了下来。' }
  }
}

/** 生死簿候选册（六十甲子；正典：亡魂年柱丙午，第六十甲子第四十三位） */
export const REGISTER_CANDIDATES = [
  { id: 'jiawu', label: '甲午册', position: '第三十一位' },
  { id: 'gengshen', label: '庚申册', position: '第五十七位' },
  { id: 'bingwu', label: '丙午册', position: '第四十三位' }
] as const

export type RegisterId = (typeof REGISTER_CANDIDATES)[number]['id']
export const CORRECT_REGISTER: RegisterId = 'bingwu'

/**
 * 第三殿 · 簿库：
 * ① 按竹牌八字推干支，从架上找对丙午册（册子自己翻开）
 * ② 铜侧光灯斜照纸面，显出刮改（卒于 → 生于）
 * ③ 朱笔勘合，落半印③
 */
export class ArchivePuzzle {
  private found = false
  private revealed = false
  private solved = false
  private wrongPicks = 0

  get isFound(): boolean {
    return this.found
  }

  get isRevealed(): boolean {
    return this.revealed
  }

  get isSolved(): boolean {
    return this.solved
  }

  get wrongCount(): number {
    return this.wrongPicks
  }

  openRegister(id: string): PuzzleResult {
    if (this.solved) return { ok: true, solved: true, message: '勘合已毕。丙午册摊在案上。' }
    if (this.found && id === CORRECT_REGISTER) return { ok: true, solved: false, message: '丙午册已摊开。去点侧光灯。' }
    const register = REGISTER_CANDIDATES.find((item) => item.id === id)
    if (!register) return { ok: false, solved: false, message: '架上没有这一册。' }
    if (register.id === CORRECT_REGISTER) {
      this.found = true
      return { ok: true, solved: false, message: '丙午，第六十甲子第四十三位。簿子在黑暗里自己翻开了，停在那一年。' }
    }
    this.wrongPicks += 1
    return { ok: false, solved: false, message: `翻到的是${register.label}——${register.position}。查无此页。司吏道：落户要三样，生辰、卒年、案由。你缺一样。` }
  }

  shineLamp(): PuzzleResult {
    if (this.solved) return { ok: true, solved: true, message: '刮痕已勘合，灯不必再照。' }
    if (!this.found) return { ok: false, solved: false, message: '灯照到的是空页。先把丙午册找出来。' }
    if (this.revealed) return { ok: true, solved: false, message: '刮痕已显。「卒于」底下压着「生于」。去取朱笔。' }
    this.revealed = true
    return { ok: true, solved: false, message: '窄光斜过纸面——「卒于丙午」四字底下，刮痕里透出「生于」二字。有人刮掉重写过。' }
  }

  compare(): PuzzleResult {
    if (this.solved) return { ok: true, solved: true, message: '朱笔已落。' }
    if (!this.found) return { ok: false, solved: false, message: '朱笔悬着落不下去。连册子都还没找到。' }
    if (!this.revealed) return { ok: false, solved: false, message: '看不出改在哪。字迹是干的。先照灯。' }
    this.solved = true
    return { ok: true, solved: true, message: '朱笔勘合：原页「卒于丙午」系刮改——他生于丙午，阳寿未尽。半印③落下。' }
  }
}
