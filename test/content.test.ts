import { describe, expect, it } from 'vitest'
import { practiceGuideFor, prompts } from '../src/training/content'
import { dailyBiteIndex, speakingBites } from '../src/training/speaking-bites'

describe('expanded practice content', () => {
  it('keeps old tasks and gives each task a valid, different transfer exercise', () => {
    expect(new Set(prompts.map(p => p.id)).size).toBe(prompts.length)
    for (const id of ['s-place', 's-learning', 's-skill', 's-cities', 'w-study', 'w-transport', 'w-library', 'r-retrieval'])
      expect(prompts.some(p => p.id === id)).toBe(true)
    for (const p of prompts) {
      const guide = practiceGuideFor(p)
      expect(guide.review.length).toBeGreaterThanOrEqual(2)
      expect(guide.drill.length).toBeGreaterThan(10)
      const target = prompts.find(p => p.id === guide.transferId)
      expect(target?.skill).toBe(p.skill)
      expect(target?.id).not.toBe(p.id)
    }
  })
  it('grounds every reading answer in an existing passage and supplies an explanation', () => {
    const reading = prompts.filter(p => p.skill === 'reading')
    expect(reading).toHaveLength(4)
    for (const p of reading) {
      expect(p.questions).toHaveLength(6)
      expect(new Set(p.questions!.map(q => q.id)).size).toBe(p.questions!.length)
      for (const q of p.questions!) {
        const [label, quote] = q.evidence.split(': ')
        const paragraph = p.passage!.find(text => text.startsWith(`${label}.`))
        expect(paragraph, `${p.id} / ${q.id}`).toBeDefined()
        for (const part of quote.split(' … '))
          expect(paragraph).toContain(part)
        expect(q.explanation.length).toBeGreaterThan(10)
        if (q.options) {
          expect(q.options).toContain(q.answer)
        }
        else {
          expect(q.answer.split(/\s+/)).toHaveLength(1)
          expect(p.passage!.join(' ').toLowerCase()).toContain(q.answer.toLowerCase())
        }
      }
    }
  })
  it('keeps percentage-share datasets internally consistent and includes a complete process', () => {
    for (const id of ['w-energy', 'w-cycling']) {
      const table = prompts.find(p => p.id === id)!.table!
      for (let column = 1; column < table[0].length; column++)
        expect(table.slice(1).reduce((total, row) => total + Number.parseFloat(row[column]), 0)).toBe(100)
    }
    expect(prompts.find(p => p.id === 'w-recycling')!.process!.stages).toHaveLength(6)
  })
})
describe('speaking micro-lessons', () => {
  it('pairs each lesson with an actionable short exercise and a speaking task', () => {
    expect(speakingBites.length).toBeGreaterThanOrEqual(16)
    expect(new Set(speakingBites.map(b => b.id)).size).toBe(speakingBites.length)
    for (const b of speakingBites) {
      expect(b.before).not.toBe(b.after)
      expect(b.explanation.length).toBeGreaterThan(20)
      expect(b.drill.length).toBeGreaterThan(15)
      expect(b.check).toHaveLength(2)
      expect(prompts.find(p => p.id === b.promptId)?.skill).toBe('speaking')
    }
  })
  it('uses the same lesson across devices on a Brisbane date, then advances at local midnight', () => {
    const early = new Date('2026-10-27T14:01:00Z')
    const late = new Date('2026-10-28T13:59:00Z')
    const nextDay = new Date('2026-10-28T14:00:00Z')
    expect(dailyBiteIndex(early)).toBe(dailyBiteIndex(late))
    expect(dailyBiteIndex(nextDay)).toBe((dailyBiteIndex(late) + 1) % speakingBites.length)
  })
})
