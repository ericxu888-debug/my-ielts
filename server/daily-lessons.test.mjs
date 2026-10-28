import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDailyLessons, brisbaneDay, validateLesson } from './daily-lessons.mjs'

const lesson = (suffix = '') => ({ category: '自然表达', topicKey: `requesting-clarification${suffix || '-politely'}`, title: `没听清楚时如何确认问题${suffix}`, point: '说明没听清哪一部分，并礼貌请对方重复。', before: `Please say it again${suffix}.`, after: `Could you repeat the last part of the question${suffix}, please?`, explanation: '第一句没有语法错误，后者明确了希望重复的部分。', drill: '用自己的话请求对方重复一个问题，再换一种自然表达。', check: ['说明没听清楚哪部分', '礼貌表达并避免背诵整句'], promptId: 's-learning' })
const result = value => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }] }), { status: 200 })

test('Brisbane date changes at 14:00 UTC, independent of server timezone', () => {
  assert.deepEqual(brisbaneDay(new Date('2026-10-28T13:59:00Z')), { day: '2026-10-28', hour: 23 })
  assert.deepEqual(brisbaneDay(new Date('2026-10-28T14:00:00Z')), { day: '2026-10-29', hour: 0 })
})
test('one lesson is added after 08:00 and repeated/concurrent ticks do not trigger more requests', async () => {
  const db = new DatabaseSync(':memory:')
  let clock = new Date('2026-10-27T21:59:00Z')
  let calls = 0
  const daily = createDailyLessons({ db, aiKey: 'mock-only', automatic: true, now: () => clock, fetcher: async (url, options) => {
    calls++
    const body = JSON.parse(options.body)
    assert.equal(body.max_tokens, 1800)
    assert.equal(url, 'https://api.openai.com/v1/chat/completions')
    assert.equal(body.messages.length, 2)
    return result(lesson())
  } })
  try {
    await daily.tick()
    assert.equal(calls, 0)
    clock = new Date('2026-10-27T22:00:00Z')
    await Promise.all([daily.tick(), daily.tick()])
    await daily.tick()
    assert.equal(calls, 1)
    const state = daily.snapshot()
    assert.equal(state.state, 'ready')
    assert.equal(state.lessons.length, 1)
    assert.equal(state.lessons[0].day, '2026-10-28')
    assert.equal(state.lessons[0].source, 'ai')
    assert.equal(state.callsToday, 1)
  }
  finally { daily.stop(); db.close() }
})
test('archive and daily cost claims survive restart; next day adds a new item without deleting yesterday', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ielts-lessons-'))
  let db = new DatabaseSync(join(dir, 'test.sqlite'))
  let clock = new Date('2026-10-28T01:00:00Z')
  let calls = 0
  const options = () => ({ db, aiKey: 'mock-only', automatic: true, now: () => clock, fetcher: async () => {
    calls++
    return result(calls === 1 ? lesson() : { ...lesson(), topicKey: 'comparative-adverb-forms', title: '比较学习速度时用对副词', before: 'I learn fast than before.', after: 'I learn more quickly when I practise a little every day.' })
  } })
  let daily = createDailyLessons(options())
  try {
    await daily.tick()
    daily.stop(); db.close()
    db = new DatabaseSync(join(dir, 'test.sqlite'))
    daily = createDailyLessons(options())
    await daily.tick()
    assert.equal(calls, 1)
    clock = new Date('2026-10-29T01:00:00Z')
    await daily.tick()
    assert.equal(calls, 2)
    assert.deepEqual(daily.list().map(v => v.day), ['2026-10-29', '2026-10-28'])
  }
  finally { daily.stop(); db.close(); rmSync(dir, { recursive: true, force: true }) }
})
test('failures have a one-hour backoff and a persisted two-request daily cap', async () => {
  const db = new DatabaseSync(':memory:')
  let clock = new Date('2026-10-28T01:00:00Z')
  let calls = 0
  const daily = createDailyLessons({ db, aiKey: 'mock-only', automatic: true, now: () => clock, fetcher: async () => { calls++; throw new Error('mock outage') } })
  try {
    await daily.tick()
    await daily.tick()
    clock = new Date('2026-10-28T01:59:00Z')
    await daily.tick()
    assert.equal(calls, 1)
    clock = new Date('2026-10-28T02:00:00Z')
    await daily.tick()
    clock = new Date('2026-10-28T05:00:00Z')
    await daily.tick()
    assert.equal(calls, 2)
    assert.equal(daily.snapshot().state, 'failed')
    assert.equal(daily.list().length, 0)
    clock = new Date('2026-10-29T01:00:00Z')
    await daily.tick()
    assert.equal(calls, 3)
  }
  finally { daily.stop(); db.close() }
})
test('missing credentials and a persisted pause do not produce paid requests', async () => {
  const db = new DatabaseSync(':memory:')
  let calls = 0
  let daily = createDailyLessons({ db, automatic: true, now: () => new Date('2026-10-28T01:00:00Z'), fetcher: async () => { calls++; return result(lesson()) } })
  try {
    await daily.tick()
    assert.equal(daily.snapshot().state, 'unconfigured')
    daily.setEnabled(false)
    daily.stop()
    daily = createDailyLessons({ db, automatic: true, aiKey: 'mock-only', now: () => new Date('2026-10-28T01:00:00Z'), fetcher: async () => { calls++; return result(lesson()) } })
    await daily.tick()
    assert.equal(calls, 0)
    assert.equal(daily.snapshot().state, 'disabled')
  }
  finally { daily.stop(); db.close() }
})
test('duplicate examples, topic keys and malformed content are rejected', () => {
  assert.equal(validateLesson(lesson(), []), true)
  assert.equal(validateLesson(lesson(), [lesson()]), false)
  assert.equal(validateLesson({ ...lesson(), topicKey: 'new-topic', title: '不同标题的新课但是重复例句' }, [lesson()]), false)
  assert.equal(validateLesson({ ...lesson(), check: ['too short'] }, []), false)
  assert.equal(validateLesson({ ...lesson(), promptId: 'unknown-task' }, []), false)
  assert.equal(validateLesson(null, []), false)
  const seeds = JSON.parse(readFileSync(new URL('../content/speaking-seeds.json', import.meta.url)))
  assert.equal(validateLesson({ ...lesson(), after: seeds[0].after }, seeds), false)
})
test('duplicate generation consumes a bounded attempt but does not publish repeated content', async () => {
  const db = new DatabaseSync(':memory:')
  let clock = new Date('2026-10-28T01:00:00Z')
  const daily = createDailyLessons({ db, aiKey: 'mock-only', automatic: true, now: () => clock, fetcher: async () => result(lesson()) })
  try {
    await daily.tick()
    clock = new Date('2026-10-29T01:00:00Z')
    await daily.tick()
    assert.equal(daily.list().length, 1)
    assert.equal(daily.snapshot().callsToday, 1)
    assert.equal(daily.snapshot().state, 'retrying')
  }
  finally { daily.stop(); db.close() }
})
