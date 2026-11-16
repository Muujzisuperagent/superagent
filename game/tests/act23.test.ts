import { describe, expect, it } from 'vitest'
import {
  ArchivePuzzle,
  CORRECT_HOUR,
  PRELOADED_TAELS,
  ScalePuzzle,
  TARGET_TAELS
} from '../src/puzzles_act23'

describe('ScalePuzzle（第二殿 · 业秤）', () => {
  it('starts at the preloaded weight and needs the missing amount', () => {
    const puzzle = new ScalePuzzle()
    expect(puzzle.sum).toBe(PRELOADED_TAELS)
    const result = puzzle.place('shiliang')
    expect(result.ok).toBe(true)
    expect(puzzle.sum).toBe(PRELOADED_TAELS + 10)
    expect(result.message).toContain(String(TARGET_TAELS - PRELOADED_TAELS - 10))
  })

  it('rejects unknown and duplicate weights', () => {
    const puzzle = new ScalePuzzle()
    expect(puzzle.place('hemu').ok).toBe(false)
    puzzle.place('wuliang')
    expect(puzzle.place('wuliang').ok).toBe(false)
    expect(puzzle.placedWeights).toEqual(['wuliang'])
  })

  it('resets the tray when the sum overshoots fifty', () => {
    const puzzle = new ScalePuzzle()
    puzzle.place('shiliang')
    puzzle.place('qiliang')
    const over = puzzle.place('wuliang')
    expect(over.ok).toBe(false)
    expect(puzzle.placedWeights).toEqual([])
    expect(puzzle.sum).toBe(PRELOADED_TAELS)
    expect(puzzle.isBalanced).toBe(false)
  })

  it('balances at exactly fifty but is not solved yet', () => {
    const puzzle = new ScalePuzzle()
    const result = puzzle.place('shiliang')
    puzzle.place('qiliang')
    puzzle.place('sanliang')
    expect(puzzle.sum).toBe(TARGET_TAELS)
    expect(puzzle.isBalanced).toBe(true)
    expect(result.solved).toBe(false)
    expect(puzzle.isSolved).toBe(false)
  })

  it('refuses the hour plate before the scale is balanced', () => {
    const puzzle = new ScalePuzzle()
    const result = puzzle.pressHour(CORRECT_HOUR)
    expect(result.ok).toBe(false)
    expect(result.solved).toBe(false)
  })

  it('refuses the wrong hour after balancing', () => {
    const puzzle = new ScalePuzzle()
    puzzle.place('shiliang')
    puzzle.place('qiliang')
    puzzle.place('sanliang')
    expect(puzzle.pressHour('子时').ok).toBe(false)
    expect(puzzle.isSolved).toBe(false)
  })

  it('solves when the spare tael is pressed into 未时', () => {
    const puzzle = new ScalePuzzle()
    puzzle.place('shiliang')
    puzzle.place('qiliang')
    puzzle.place('sanliang')
    const result = puzzle.pressHour(CORRECT_HOUR)
    expect(result.solved).toBe(true)
    expect(result.message).toContain('半印②')
    expect(puzzle.isSolved).toBe(true)
  })

  it('stays idempotent after being solved', () => {
    const puzzle = new ScalePuzzle()
    puzzle.place('shiliang')
    puzzle.place('qiliang')
    puzzle.place('sanliang')
    puzzle.pressHour(CORRECT_HOUR)
    expect(puzzle.place('erliang').solved).toBe(true)
    expect(puzzle.pressHour(CORRECT_HOUR).solved).toBe(true)
    expect(puzzle.placedWeights).toEqual(['shiliang', 'qiliang', 'sanliang'])
  })
})

describe('ArchivePuzzle（第三殿 · 簿库）', () => {
  it('refuses the lamp before the register is found', () => {
    const puzzle = new ArchivePuzzle()
    const result = puzzle.shineLamp()
    expect(result.ok).toBe(false)
    expect(puzzle.isRevealed).toBe(false)
  })

  it('rejects the wrong registers and counts the misses', () => {
    const puzzle = new ArchivePuzzle()
    expect(puzzle.openRegister('jiawu').ok).toBe(false)
    expect(puzzle.openRegister('gengshen').ok).toBe(false)
    expect(puzzle.openRegister('moji').ok).toBe(false)
    expect(puzzle.isFound).toBe(false)
    expect(puzzle.wrongCount).toBe(2)
  })

  it('opens the 丙午 register on the first correct pick', () => {
    const puzzle = new ArchivePuzzle()
    const result = puzzle.openRegister('bingwu')
    expect(result.ok).toBe(true)
    expect(result.message).toContain('第四十三位')
    expect(puzzle.isFound).toBe(true)
  })

  it('refuses the brush before the scrape is revealed', () => {
    const puzzle = new ArchivePuzzle()
    puzzle.openRegister('bingwu')
    expect(puzzle.compare().ok).toBe(false)
    expect(puzzle.isSolved).toBe(false)
  })

  it('reveals the scraped correction under the side lamp', () => {
    const puzzle = new ArchivePuzzle()
    puzzle.openRegister('bingwu')
    const result = puzzle.shineLamp()
    expect(result.ok).toBe(true)
    expect(result.message).toContain('生于')
    expect(puzzle.isRevealed).toBe(true)
  })

  it('solves through the full sequence and stays idempotent', () => {
    const puzzle = new ArchivePuzzle()
    expect(puzzle.compare().ok).toBe(false)
    puzzle.openRegister('bingwu')
    puzzle.shineLamp()
    const result = puzzle.compare()
    expect(result.solved).toBe(true)
    expect(result.message).toContain('半印③')
    expect(puzzle.isSolved).toBe(true)
    expect(puzzle.openRegister('bingwu').solved).toBe(true)
    expect(puzzle.shineLamp().solved).toBe(true)
    expect(puzzle.compare().solved).toBe(true)
  })
})
