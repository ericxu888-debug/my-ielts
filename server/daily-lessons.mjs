import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const seeds = JSON.parse(readFileSync(new URL('../content/speaking-seeds.json', import.meta.url), 'utf8'))
const categories = ['展开回答', '自然表达', '语法修正', '发音意识']
const promptIds = new Set(seeds.map(v => v.promptId))
const normalise = value => value.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '')
function nearDuplicate(a, b) {
  const left = normalise(a)
  const right = normalise(b)
  if (left === right) return true
  if (Math.min(left.length, right.length) < 12) return false
  const grams = value => new Set(Array.from({ length: value.length - 2 }, (_, i) => value.slice(i, i + 3)))
  const x = grams(left), y = grams(right)
  const overlap = [...x].filter(v => y.has(v)).length
  return 2 * overlap / (x.size + y.size) > 0.9
}
export function brisbaneDay(now) {
  const parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const get = type => parts.find(p => p.type === type).value
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) }
}
export function validateLesson(value, existing) {
  if (!value || !categories.includes(value.category) || !promptIds.has(value.promptId)) return false
  for (const key of ['title', 'point', 'before', 'after', 'explanation', 'drill']) {
    if (typeof value[key] !== 'string' || value[key].trim().length < 5 || value[key].length > (key === 'title' ? 100 : 1000)) return false
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+){1,11}$/.test(value.topicKey || '')) return false
  if (!Array.isArray(value.check) || value.check.length !== 2 || !value.check.every(v => typeof v === 'string' && v.length >= 5 && v.length <= 200)) return false
  if (normalise(value.before) === normalise(value.after)) return false
  // These are mechanical quality/duplication checks, not a claim of human review.
  return !existing.some(row => (row.topicKey || row.id) === value.topicKey || normalise(row.title) === normalise(value.title) || nearDuplicate(row.after, value.after) || normalise(row.before) === normalise(value.before))
}

export function createDailyLessons({ db, aiKey = '', model = 'gpt-4.1-mini', automatic = false, now = () => new Date(), fetcher = (...args) => fetch(...args) }) {
  db.exec(`CREATE TABLE IF NOT EXISTS speaking_lessons (day TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS speaking_lesson_runs (day TEXT PRIMARY KEY, calls INTEGER NOT NULL, started_at INTEGER NOT NULL, state TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS studio_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`)
  let busy = false
  let stopped = false
  let timer
  let abort
  const enabled = () => {
    const row = db.prepare("SELECT value FROM studio_settings WHERE key='daily_lessons'").get()
    return row ? row.value === 'true' : automatic
  }
  const list = () => db.prepare('SELECT data FROM speaking_lessons ORDER BY day DESC').all().map(row => JSON.parse(row.data))
  function snapshot() {
    const { day, hour } = brisbaneDay(now())
    const lessons = list()
    const run = db.prepare('SELECT * FROM speaking_lesson_runs WHERE day=?').get(day)
    const state = !enabled() ? 'disabled' : lessons.some(v => v.day === day) ? 'ready' : !aiKey ? 'unconfigured' : busy ? 'generating' : run?.calls >= 2 ? 'failed' : run ? 'retrying' : hour < 8 ? 'scheduled' : 'pending'
    return { lessons, today: day, state, enabled: enabled(), callsToday: run?.calls || 0, maxCallsPerDay: 2 }
  }
  function setEnabled(value) {
    db.prepare("INSERT INTO studio_settings (key, value) VALUES ('daily_lessons', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(value))
    if (value) void tick().catch(() => {})
    else abort?.abort()
  }
  async function tick() {
    if (stopped || busy || !enabled() || !aiKey) return
    const clock = now()
    const { day, hour } = brisbaneDay(clock)
    if (hour < 8 || db.prepare('SELECT day FROM speaking_lessons WHERE day=?').get(day)) return
    // The DB claim survives restarts and serialises more than one worker.
    const claim = db.prepare(`INSERT INTO speaking_lesson_runs (day,calls,started_at,state) VALUES (?,1,?,'running')
      ON CONFLICT(day) DO UPDATE SET calls=calls+1,started_at=excluded.started_at,state='running'
      WHERE calls<2 AND started_at<=?`).run(day, clock.getTime(), clock.getTime() - 3600000)
    if (!claim.changes) return
    busy = true
    abort = new AbortController()
    const timeout = setTimeout(() => abort?.abort(), 60000)
    try {
      const existing = [...list(), ...seeds]
      const recent = existing.slice(0, 60).map(v => ({ title: v.title, topicKey: v.topicKey || v.id, after: v.after.slice(0, 300) }))
      const category = categories[Math.floor(clock.getTime() / 86400000) % categories.length]
      const system = `Write ONE original micro-lesson for a Chinese-speaking IELTS Academic learner at speaking band 6 aiming for 7. Return JSON with category, topicKey (specific English kebab-case learning point, not a date), title, point, before, after, explanation, drill, check (exactly two strings), promptId. Category must be one of ${JSON.stringify(categories)}. Text is Chinese except English before/after examples. Explain a specific usable point, give accurate natural examples, a 30-second retrieval exercise and two observable self-checks. Do not reuse an existing title, topicKey or example; deepen a new subskill. Prefer today's focus category. Avoid absolute grammar rules, guaranteed scores, invented research, official/current IELTS question claims, personal data, phonetic notation or pronunciation scoring. If before is grammatical but underdeveloped, explicitly say so. No links, advertisements, markdown or full memorised answers. AI content is not human-reviewed. Each explanation should be concise and precise.`
      const response = await fetcher('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${aiKey}`, 'Content-Type': 'application/json' }, signal: abort.signal,
        body: JSON.stringify({ model, max_tokens: 1800, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify({ date: day, preferredCategory: category, availablePromptIds: [...promptIds], previousLessons: recent }) }] }),
      })
      if (!response.ok) throw new Error('provider-failure')
      const output = await response.json()
      const value = JSON.parse(output.choices[0].message.content)
      if (!validateLesson(value, existing)) throw new Error('invalid-or-duplicate-lesson')
      if (stopped || !enabled() || abort.signal.aborted) return
      const lesson = { id: `daily-${day}`, day, source: 'ai', publishedAt: now().toISOString(), category: value.category, topicKey: value.topicKey, title: value.title.trim(), point: value.point.trim(), before: value.before.trim(), after: value.after.trim(), explanation: value.explanation.trim(), drill: value.drill.trim(), check: value.check, promptId: value.promptId, fingerprint: createHash('sha256').update(normalise(value.after)).digest('hex') }
      db.prepare('INSERT OR IGNORE INTO speaking_lessons (day,data) VALUES (?,?)').run(day, JSON.stringify(lesson))
      db.prepare("UPDATE speaking_lesson_runs SET state='ready' WHERE day=?").run(day)
    }
    catch {
      if (!stopped) db.prepare("UPDATE speaking_lesson_runs SET state='failed' WHERE day=?").run(day)
    }
    finally { clearTimeout(timeout); busy = false; abort = undefined }
  }
  function start() {
    stopped = false
    timer = setInterval(() => { void tick().catch(() => {}) }, 60000)
    timer.unref()
    void tick().catch(() => {})
  }
  function stop() { stopped = true; clearInterval(timer); abort?.abort() }
  return { list, snapshot, tick, start, stop, setEnabled }
}
