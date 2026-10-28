import type { Skill } from './content'

export interface Feedback {
  summary: string
  strengths: string[]
  priorities: {
    issue: string
    evidence: string
    action: string
  }[]
  exercise: string
  limitation: string
}
export interface Attempt {
  id: string
  promptId: string
  skill: Skill
  createdAt: string
  updatedAt: string
  status: 'draft' | 'review' | 'complete'
  text: string
  answers: Record<string, string>
  elapsed: number
  reflection: string
  focus: string
  reviewAt: string | null
  interval: number
  reviews: number
  parentId?: string
  feedback?: Feedback
  hasAudio?: boolean
  audioMime?: string
  audioKey?: string
  revision?: number
}
export function createAttempt(promptId: string, skill: Skill, parentId?: string): Attempt {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), promptId, skill, createdAt: now, updatedAt: now, status: 'draft', text: '', answers: {}, elapsed: 0, reflection: '', focus: '', reviewAt: null, interval: 0, reviews: 0, parentId }
}
// Transparent, adjustable heuristic inspired by spaced practice, not a validated scoring model.
export function scheduleReview(attempt: Attempt, result: 'again' | 'hard' | 'good', now = new Date()): Attempt {
  const days = result === 'again' ? 1 : result === 'hard' ? Math.min(60, Math.max(2, Math.ceil(attempt.interval * 1.3))) : attempt.interval === 0 ? 3 : Math.min(60, attempt.interval * 2)
  const next = new Date(now)
  next.setDate(next.getDate() + days)
  return { ...attempt, status: 'complete', interval: days, reviews: attempt.reviews + 1, reviewAt: next.toISOString(), updatedAt: now.toISOString() }
}
export function dueAttempts(attempts: Attempt[], now = new Date()): Attempt[] {
  const superseded = new Set(attempts.filter(a => a.status !== 'draft' && a.parentId).map(a => a.parentId))
  return attempts.filter(a => !superseded.has(a.id) && (a.status === 'review' || (a.status === 'complete' && a.reviewAt && new Date(a.reviewAt) <= now))).sort((a, b) => (a.reviewAt || a.createdAt).localeCompare(b.reviewAt || b.createdAt))
}
export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}
export function normaliseAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ')
}
export function isAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object')
    return false
  const a = value as Attempt
  if (a.feedback && (typeof a.feedback.summary !== 'string' || !Array.isArray(a.feedback.strengths) || !a.feedback.strengths.every(s => typeof s === 'string') || !Array.isArray(a.feedback.priorities) || !a.feedback.priorities.every(p => p && typeof p.issue === 'string' && typeof p.evidence === 'string' && typeof p.action === 'string') || typeof a.feedback.exercise !== 'string' || typeof a.feedback.limitation !== 'string'))
    return false
  return typeof a.id === 'string' && /^[\w-]{1,100}$/.test(a.id) && typeof a.promptId === 'string' && ['speaking', 'writing', 'reading'].includes(a.skill) && ['draft', 'review', 'complete'].includes(a.status)
        && typeof a.text === 'string' && a.text.length <= 100000 && typeof a.reflection === 'string' && typeof a.focus === 'string'
        && !!a.answers && typeof a.answers === 'object' && !Array.isArray(a.answers) && Object.values(a.answers).every(v => typeof v === 'string')
        && Number.isFinite(a.elapsed) && a.elapsed >= 0 && Number.isFinite(a.interval) && a.interval >= 0 && Number.isInteger(a.reviews) && a.reviews >= 0
        && typeof a.createdAt === 'string' && Number.isFinite(Date.parse(a.createdAt)) && typeof a.updatedAt === 'string' && Number.isFinite(Date.parse(a.updatedAt)) && (a.reviewAt === null || (typeof a.reviewAt === 'string' && Number.isFinite(Date.parse(a.reviewAt))))
        && (a.hasAudio === undefined || typeof a.hasAudio === 'boolean') && (a.audioKey === undefined || (typeof a.audioKey === 'string' && /^[\w-]+\.[a-f0-9]{64}$/.test(a.audioKey)))
        && (a.revision === undefined || (Number.isInteger(a.revision) && a.revision >= 0)) && (a.parentId === undefined || typeof a.parentId === 'string')
}
