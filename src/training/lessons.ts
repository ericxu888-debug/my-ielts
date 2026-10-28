import { computed, ref } from 'vue'
import { speakingBites } from './speaking-bites'
import type { SpeakingBite } from './speaking-bites'

export const generatedLessons = ref<SpeakingBite[]>([])
export const dailyLessonState = ref('loading')
export const dailyLessonsEnabled = ref(false)
export const dailyLessonCalls = ref(0)
export const lessonDay = ref('')
export const allSpeakingBites = computed(() => [...generatedLessons.value, ...speakingBites])
const cacheKey = 'ielts-public-lessons-v1'
function valid(value: unknown): value is SpeakingBite {
  if (!value || typeof value !== 'object')
    return false
  const v = value as SpeakingBite
  return typeof v.id === 'string' && /^daily-\d{4}-\d{2}-\d{2}$/.test(v.id) && typeof v.day === 'string' && v.id === `daily-${v.day}` && v.source === 'ai'
    && ['展开回答', '自然表达', '语法修正', '发音意识'].includes(v.category)
    && ['title', 'point', 'before', 'after', 'explanation', 'drill', 'promptId'].every(key => typeof (v as unknown as Record<string, unknown>)[key] === 'string')
    && speakingBites.some(b => b.promptId === v.promptId) && Array.isArray(v.check) && v.check.length === 2 && v.check.every(c => typeof c === 'string')
}
try {
  const cache: unknown = JSON.parse(localStorage.getItem(cacheKey) || '[]')
  if (Array.isArray(cache) && cache.every(valid))
    generatedLessons.value = cache
}
catch { /* Offline reading remains available from the bundled lessons. */ }

export const dailyLessonMessage = computed(() => {
  const state = dailyLessonState.value
  if (state === 'ready')
    return '今日新课已新增，历史内容持续保留'
  if (state === 'generating' || state === 'pending')
    return '今日新课正在准备，先学已有内容'
  if (state === 'scheduled')
    return '每日 08:00（布里斯班）开始准备新课'
  if (state === 'retrying')
    return '本次生成未完成，将在间隔满 1 小时后自动重试'
  if (state === 'failed')
    return '今日生成未完成，已停止重试；已有内容可继续学习'
  if (state === 'unconfigured')
    return '服务器尚未配置 AI，新课暂时无法生成'
  if (state === 'disabled')
    return '每日自动新增已暂停，已有内容继续保留'
  return state === 'loading' ? '正在检查每日更新…' : '暂时无法连接更新服务，保留已有内容'
})
let fetching = false
let etag = ''
let lastState = 'loading'
export async function refreshLessons() {
  if (fetching)
    return
  fetching = true
  try {
    const response = await fetch('/api/lessons', { credentials: 'same-origin', headers: etag ? { 'If-None-Match': etag } : {}, signal: AbortSignal.timeout(10000) })
    if (response.status === 304) {
      dailyLessonState.value = lastState
      return
    }
    if (!response.ok)
      throw new Error('unavailable')
    const data = await response.json()
    if (!Array.isArray(data.lessons) || !data.lessons.every(valid))
      throw new Error('invalid response')
    generatedLessons.value = data.lessons
    dailyLessonState.value = data.state
    lastState = data.state
    etag = response.headers.get('ETag') || ''
    dailyLessonsEnabled.value = data.enabled === true
    dailyLessonCalls.value = Number(data.callsToday) || 0
    lessonDay.value = data.today
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data.lessons))
    }
    catch { /* The server remains the source of truth if device storage is full. */ }
  }
  catch { dailyLessonState.value = 'offline' }
  finally { fetching = false }
}
let started = false
export function startLessonUpdates() {
  if (started)
    return
  started = true
  refreshLessons()
  setInterval(() => {
    refreshLessons()
  }, 60000)
  window.addEventListener('focus', () => {
    refreshLessons()
  })
  window.addEventListener('online', () => {
    refreshLessons()
  })
}
