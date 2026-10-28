import seedLessons from '../../content/speaking-seeds.json'

export interface SpeakingBite {
  day?: string
  source?: 'ai'
  topicKey?: string
  id: string
  category: '展开回答' | '自然表达' | '语法修正' | '发音意识'
  title: string
  point: string
  before: string
  after: string
  explanation: string
  drill: string
  check: string[]
  promptId: string
}

export const speakingBites: SpeakingBite[] = seedLessons as SpeakingBite[]

export function dailyBiteIndex(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Brisbane', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now)
  const value = (type: string) => Number(parts.find(p => p.type === type)!.value)
  return Math.floor(Date.UTC(value('year'), value('month') - 1, value('day')) / 86400000) % speakingBites.length
}
