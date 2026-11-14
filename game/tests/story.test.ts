import { describe, expect, it } from 'vitest'
import { HERB_ORDER, JourneyState, MedicinePuzzle, NinePalacePuzzle } from '../src/story'

describe('MedicinePuzzle', () => {
  it('brews the soup in 君臣佐使 order', () => {
    const puzzle = new MedicinePuzzle()
    HERB_ORDER.forEach((id) => puzzle.select(id))
    expect(puzzle.isSolved).toBe(true)
  })

  it('resets a wrong recipe', () => {
    const puzzle = new MedicinePuzzle()
    ;['yuanzhi', 'danggui', 'hehuan', 'wangyou'].forEach((id) => puzzle.select(id))
    expect(puzzle.isSolved).toBe(false)
    expect(puzzle.progress).toEqual([])
  })
})

describe('NinePalacePuzzle', () => {
  it('requires all nine steps in order', () => {
    const puzzle = new NinePalacePuzzle()
    for (let value = 1; value <= 9; value += 1) puzzle.step(value)
    expect(puzzle.isSolved).toBe(true)
  })

  it('resets after a wrong step', () => {
    const puzzle = new NinePalacePuzzle()
    puzzle.step(1)
    expect(puzzle.step(3).ok).toBe(false)
    expect(puzzle.progress).toBe(0)
  })
})

describe('JourneyState', () => {
  it('unlocks the three endings with the required evidence', () => {
    const journey = new JourneyState()
    ;['A', 'B', 'C', 'D'].forEach((id) => journey.collectEvidence(id))
    journey.completeAct('medicine')
    journey.completeAct('palace')
    expect(journey.canCombine).toBe(true)
    expect(journey.unlockedEndings).toEqual(['return', 'replace', 'judge'])
  })

  it('only offers 还阳 without the soup', () => {
    const journey = new JourneyState()
    expect(journey.unlockedEndings).toEqual(['return'])
  })
})
