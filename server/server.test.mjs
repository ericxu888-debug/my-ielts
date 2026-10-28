import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import { createStudioServer } from './index.mjs'

let server, base, cookie
const dir = mkdtempSync(join(tmpdir(), 'ielts-server-test-'))
const headers = { 'X-IELTS-Client': '1', 'Content-Type': 'application/json' }
const password = 'test-only-long-password'
const request = (path, options = {}) => fetch(`${base}/api${path}`, { ...options, headers: { Cookie: cookie || '', ...headers, ...options.headers } })
const record = () => ({ id: 'sample-1', promptId: 'w-study', skill: 'writing', status: 'draft', text: 'My first answer', answers: {}, elapsed: 60, reflection: '', focus: '', createdAt: '2026-10-28T00:00:00.000Z', updatedAt: '2026-10-28T00:00:00.000Z', reviewAt: null, reviews: 0, interval: 0 })
before(async () => {
  server = createStudioServer({ password, dataDir: dir, secureCookie: false })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  base = `http://127.0.0.1:${server.address().port}`
})
after(async () => { await new Promise(resolve => server.close(resolve)); rmSync(dir, { recursive: true, force: true }) })

test('private records require a valid session; no credentials returned', async () => {
  assert.equal((await request('/attempts')).status, 401)
  const status = await (await request('/session')).json()
  assert.deepEqual(status, { authenticated: false, ai: false })
  assert.equal((await request('/login', { method: 'POST', body: JSON.stringify({ password: 'incorrect' }) })).status, 401)
  const login = await request('/login', { method: 'POST', body: JSON.stringify({ password }) })
  assert.equal(login.status, 200)
  assert.match(login.headers.get('set-cookie'), /HttpOnly/)
  assert.match(login.headers.get('set-cookie'), /SameSite=Strict/)
  cookie = login.headers.get('set-cookie').split(';')[0]
})
test('cross-origin and form submissions cannot mutate data', async () => {
  assert.equal((await request('/attempts/sample-1', { method: 'PUT', headers: { Origin: 'https://another-site.example' }, body: JSON.stringify(record()) })).status, 403)
  const response = await fetch(`${base}/api/logout`, { method: 'POST', headers: { Cookie: cookie } })
  assert.equal(response.status, 403)
})
test('two devices see the same record; stale edits cannot silently overwrite it', async () => {
  const saved = await (await request('/attempts/sample-1', { method: 'PUT', body: JSON.stringify(record()) })).json()
  assert.equal(saved.revision, 1)
  const list = await (await request('/attempts')).json()
  assert.equal(list[0].text, 'My first answer')
  const updated = await (await request('/attempts/sample-1', { method: 'PUT', body: JSON.stringify({ ...saved, text: 'Revised on the phone' }) })).json()
  assert.equal(updated.revision, 2)
  const stale = await request('/attempts/sample-1', { method: 'PUT', body: JSON.stringify({ ...saved, text: 'Old laptop edit' }) })
  assert.equal(stale.status, 409)
  assert.equal((await stale.json()).current.text, 'Revised on the phone')
})
test('malformed records and claiming an unuploaded recording are rejected', async () => {
  assert.equal((await request('/attempts/sample-2', { method: 'PUT', body: JSON.stringify({ ...record(), id: 'sample-2', elapsed: -1 }) })).status, 400)
  assert.equal((await request('/attempts/sample-2', { method: 'PUT', body: JSON.stringify({ ...record(), id: 'sample-2', hasAudio: true }) })).status, 400)
})
test('audio blobs are immutable and authenticated; metadata references the uploaded blob', async () => {
  const first = await (await request('/audio/audio-record', { method: 'PUT', headers: { 'Content-Type': 'audio/webm' }, body: 'first-audio-bytes' })).json()
  const second = await (await request('/audio/audio-record', { method: 'PUT', headers: { 'Content-Type': 'audio/webm' }, body: 'second-audio-bytes' })).json()
  assert.notEqual(first.key, second.key)
  const res = await request(`/audio/${first.key}`)
  assert.equal(await res.text(), 'first-audio-bytes')
  assert.equal((await fetch(`${base}/api/audio/${first.key}`)).status, 401)
  const saved = await request('/attempts/audio-record', { method: 'PUT', body: JSON.stringify({ ...record(), id: 'audio-record', skill: 'speaking', hasAudio: true, audioKey: first.key }) })
  assert.equal(saved.status, 200)
})
test('missing AI configuration fails honestly and does not make a provider request', async () => {
  const response = await request('/feedback', { method: 'POST', body: JSON.stringify({ text: 'A practice answer.' }) })
  assert.equal(response.status, 503)
  assert.match((await response.json()).error, /尚未配置/)
})
test('logout clears the browser session cookie', async () => {
  const response = await request('/logout', { method: 'POST' })
  assert.equal(response.status, 200)
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/)
})
test('saved practice survives a server restart; old sessions expire', async () => {
  await new Promise(resolve => server.close(resolve))
  server = createStudioServer({ password, dataDir: dir, secureCookie: false })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  base = `http://127.0.0.1:${server.address().port}`
  assert.equal((await request('/attempts')).status, 401)
  const login = await request('/login', { method: 'POST', body: JSON.stringify({ password }) })
  cookie = login.headers.get('set-cookie').split(';')[0]
  const list = await (await request('/attempts')).json()
  assert.equal(list.find(row => row.id === 'sample-1').text, 'Revised on the phone')
  assert.equal(list.find(row => row.id === 'audio-record').hasAudio, true)
})
test('AI feedback requires quotations grounded in the answer (provider mocked; no paid request)', async () => {
  const originalFetch = globalThis.fetch
  let quote = 'I prefer studying in a library'
  const input = { skill: 'speaking', prompt: 'Describe a place to study.', text: 'I prefer studying in a library because it is quiet.' }
  globalThis.fetch = (url, options) => {
    if (url === 'https://api.openai.com/v1/chat/completions') {
      const sent = JSON.parse(options.body)
      assert.match(sent.messages[0].content, /do not assess pronunciation/)
      const feedback = { summary: '需要展开具体例子', strengths: ['观点明确'], priorities: [{ issue: '展开不足', evidence: quote, action: '补充一次具体经历' }], exercise: '重答并补充例子', limitation: '仅根据文本，不评价发音或流利度' }
      return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(feedback) } }] }), { status: 200 }))
    }
    return originalFetch(url, options)
  }
  const aiServer = createStudioServer({ password, dataDir: dir, secureCookie: false, aiKey: 'mock-provider-test-only' })
  aiServer.listen(0, '127.0.0.1')
  await once(aiServer, 'listening')
  const aiBase = `http://127.0.0.1:${aiServer.address().port}/api`
  try {
    const login = await originalFetch(`${aiBase}/login`, { method: 'POST', headers, body: JSON.stringify({ password }) })
    const authHeaders = { ...headers, Cookie: login.headers.get('set-cookie').split(';')[0] }
    const valid = await originalFetch(`${aiBase}/feedback`, { method: 'POST', headers: authHeaders, body: JSON.stringify(input) })
    assert.equal(valid.status, 200)
    quote = 'A sentence the learner never said.'
    const invented = await originalFetch(`${aiBase}/feedback`, { method: 'POST', headers: authHeaders, body: JSON.stringify(input) })
    assert.equal(invented.status, 502)
    assert.match((await invented.json()).error, /引用未能/)
  }
  finally {
    globalThis.fetch = originalFetch
    await new Promise(resolve => aiServer.close(resolve))
  }
})
