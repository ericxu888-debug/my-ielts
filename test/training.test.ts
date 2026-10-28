import { describe, expect, it } from 'vitest'
import { createAttempt, dueAttempts, isAttempt, normaliseAnswer, scheduleReview, wordCount } from '../src/training/model'
import { prompts } from '../src/training/content'

function sample() {
  return { ...createAttempt('w-study', 'writing'), id: 'test-record', focus: '论证', reflection: '下次增加一个支持观点的具体例子' }
}
describe('learning schedule', () => {
  it('schedules a failed retrieval for tomorrow instead of increasing the previous interval', () => {
    const result = scheduleReview({ ...sample(), interval: 12 }, 'again', new Date('2026-10-28T08:00:00Z'))
    expect(result.interval).toBe(1)
    expect(result.reviewAt).toBe('2026-10-29T08:00:00.000Z')
    expect(result.status).toBe('complete')
  })
  it('expands successful retrieval intervals and caps them at 60 days', () => {
    expect(scheduleReview(sample(), 'good').interval).toBe(3)
    expect(scheduleReview({ ...sample(), interval: 3 }, 'good').interval).toBe(6)
    expect(scheduleReview({ ...sample(), interval: 40 }, 'good').interval).toBe(60)
    expect(scheduleReview({ ...sample(), interval: 3 }, 'hard').interval).toBe(4)
    expect(scheduleReview({ ...sample(), interval: 60 }, 'hard').interval).toBe(60)
  })
  it('includes unreviewed submissions and due reviews, but excludes drafts and future reviews', () => {
    const a = sample()
    const due = { ...a, id: 'due', status: 'complete' as const, reviewAt: '2026-10-27T08:00:00Z' }
    const future = { ...due, id: 'future', reviewAt: '2026-10-30T08:00:00Z' }
    const pending = { ...a, id: 'pending', status: 'review' as const }
    expect(dueAttempts([a, due, future, pending], new Date('2026-10-28T08:00:00Z')).map(a => a.id).sort()).toEqual(['due', 'pending'])
  })
  it('replaces a due parent only after its retry is submitted', () => {
    const parent = { ...sample(), id: 'parent', status: 'review' as const }
    const draft = { ...sample(), id: 'child', parentId: 'parent' }
    expect(dueAttempts([parent, draft]).map(a => a.id)).toEqual(['parent'])
    expect(dueAttempts([parent, { ...draft, status: 'review' }]).map(a => a.id)).toEqual(['child'])
  })
})
describe('practice data', () => {
  it('validates records before import and rejects malformed fields', () => {
    expect(isAttempt(sample())).toBe(true)
    expect(isAttempt({ ...sample(), elapsed: -1 })).toBe(false)
    expect(isAttempt({ ...sample(), createdAt: 'invalid' })).toBe(false)
    expect(isAttempt({ ...sample(), answers: { one: {} } })).toBe(false)
    expect(isAttempt({ ...sample(), createdAt: 2026 })).toBe(false)
    expect(isAttempt({ ...sample(), feedback: { summary: 'Incomplete feedback' } })).toBe(false)
  })
  it('normalises case and whitespace without weakening exact-answer marking', () => {
    expect(normaliseAnswer('  NOT   GIVEN ')).toBe('not given')
    expect(normaliseAnswer('evidences')).not.toBe(normaliseAnswer('evidence'))
    expect(wordCount('  A clear\nexample. ')).toBe(3)
    expect(wordCount('   ')).toBe(0)
  })
  it('keeps reading answers and explanations linked to passage evidence', () => {
    const p = prompts.find(p => p.id === 'r-retrieval')!
    expect(p.questions).toHaveLength(6)
    for (const q of p.questions!) {
      const [paragraph, quote] = q.evidence.split(': ')
      const passage = p.passage!.find(p => p.startsWith(`${paragraph}.`))!
      for (const part of quote.split(' … '))
        expect(passage).toContain(part)
      expect(q.explanation.length).toBeGreaterThan(10)
      if (q.options)
        expect(q.options).toContain(q.answer)
    }
  })
})
