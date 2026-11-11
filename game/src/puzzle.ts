export const PUZZLE_CODE = '0427'
export const MAX_ATTEMPTS = 5

export type LockResult = {
  ok: boolean
  solved: boolean
  message: string
}

/**
 * Pure puzzle state, kept out of the renderer so the rules can be unit tested
 * without WebGL or a browser.
 */
export class PasswordLock {
  private solved = false
  private attempts = 0
  private exhausted = false

  constructor(
    private readonly code: string = PUZZLE_CODE,
    private readonly maxAttempts: number = MAX_ATTEMPTS
  ) {}

  get isSolved(): boolean {
    return this.solved
  }

  get isExhausted(): boolean {
    return this.exhausted
  }

  get attemptCount(): number {
    return this.attempts
  }

  tryCode(input: string): LockResult {
    if (this.solved) {
      return { ok: true, solved: true, message: '门已经开了。' }
    }
    if (this.exhausted) {
      return { ok: false, solved: false, message: '锁死了。需要找别的办法重置。' }
    }

    const normalized = input.replace(/\D/g, '').slice(0, 4)
    this.attempts += 1

    if (normalized === this.code) {
      this.solved = true
      return { ok: true, solved: true, message: '咔哒一声，锁开了。' }
    }

    const left = this.maxAttempts - this.attempts
    if (left <= 0) {
      this.exhausted = true
      return { ok: false, solved: false, message: '五次错误，锁芯卡死。' }
    }

    return { ok: false, solved: false, message: `密码错误，还可尝试 ${left} 次。` }
  }

  reset(): void {
    this.solved = false
    this.attempts = 0
    this.exhausted = false
  }
}
