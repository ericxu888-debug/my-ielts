import { ref } from 'vue'
import { isAttempt } from './model'
import type { Attempt } from './model'

const PREFIX = 'ielts-studio:v1:'
export const storageError = ref('')
export const attempts = ref<Attempt[]>([])
export const syncMessage = ref('尚未连接云端 · 当前设备自动保存')
export const connected = ref(false)
const dirty = new Set<string>()
function load() {
  try {
    const rows = Object.keys(localStorage).filter(k => k.startsWith(`${PREFIX}attempt:`)).map(k => JSON.parse(localStorage.getItem(k)!))
    attempts.value = rows.filter(isAttempt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    dirty.clear()
    if (rows.length !== attempts.value.length)
      storageError.value = '部分本地记录格式异常，原数据已保留。请先导出备份。'
    for (const a of attempts.value) {
      if (localStorage.getItem(`${PREFIX}synced:${a.id}`) !== JSON.stringify(a))
        dirty.add(a.id)
    }
  }
  catch {
    storageError.value = '无法读取本地记录，请检查浏览器存储权限。'
  }
}
load()
window.addEventListener('storage', () => {
  load()
})
export function saveAttempt(a: Attempt, fromRemote = false): boolean {
  const saved = { ...a, updatedAt: fromRemote ? a.updatedAt : new Date().toISOString() }
  try {
    localStorage.setItem(`${PREFIX}attempt:${a.id}`, JSON.stringify(saved))
    a.updatedAt = saved.updatedAt
    const index = attempts.value.findIndex(v => v.id === a.id)
    if (index < 0)
      attempts.value.unshift(saved)
    else
      attempts.value[index] = saved
    if (fromRemote) {
      localStorage.setItem(`${PREFIX}synced:${a.id}`, JSON.stringify(saved))
      dirty.delete(a.id)
    }
    else {
      dirty.add(a.id)
    }
    storageError.value = ''
    return true
  }
  catch {
    storageError.value = '保存失败：设备存储可能已满。请立即复制答案或导出备份，暂勿关闭页面。'
    return false
  }
}
async function audioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ielts-studio-audio', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('recordings')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
  })
}
export async function putAudio(id: string, blob: Blob) {
  const db = await audioDB()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('recordings', 'readwrite')
      tx.objectStore('recordings').put(blob, id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }
  finally {
    db.close()
  }
}
export async function getAudio(id: string): Promise<Blob | undefined> {
  const db = await audioDB()
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction('recordings').objectStore('recordings').get(id)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  finally {
    db.close()
  }
}
export async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api${path}`, { ...init, credentials: 'same-origin', headers: { 'X-IELTS-Client': '1', ...init.headers } })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `请求失败 (${response.status})`)
  }
  return response
}
let syncing = false
export async function sync() {
  if (!connected.value || syncing)
    return
  syncing = true
  syncMessage.value = '正在同步…'
  let conflicts = 0
  try {
    // Push before pulling. A revision conflict preserves the local edit under a new ID.
    for (const id of Array.from(dirty)) {
      const a = attempts.value.find(v => v.id === id)
      if (!a)
        continue
      const snapshot = JSON.stringify(a)
      let audioKey = a.audioKey
      let audioUploaded = !a.hasAudio || !!audioKey
      if (a.hasAudio && !audioKey) {
        const blob = await getAudio(id)
        if (blob) {
          audioKey = (await (await api(`/audio/${id}`, { method: 'PUT', body: blob })).json()).key
          audioUploaded = true
        }
        else if (audioKey) {
          audioUploaded = true
        }
        else {
          throw new Error('录音在当前设备不可用，请先在原设备完成上传。文字保留在本机。')
        }
      }
      if (!audioUploaded)
        continue
      const response = await fetch(`/api/attempts/${id}`, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-IELTS-Client': '1' }, body: JSON.stringify({ ...a, audioKey }) })
      if (response.status === 409) {
        const remote = (await response.json()).current
        if (!isAttempt(remote))
          throw new Error('云端冲突记录格式异常，本地记录未覆盖。')
        const latest = attempts.value.find(row => row.id === id) || a
        const copy = { ...latest, id: crypto.randomUUID(), revision: 0, audioKey }
        const blob = a.hasAudio ? await getAudio(id) : undefined
        if (blob)
          await putAudio(copy.id, blob)
        if (!saveAttempt(copy))
          throw new Error('无法保存冲突副本，原始本机记录未覆盖。')
        saveAttempt(remote, true)
        window.dispatchEvent(new CustomEvent('ielts-record-conflict', { detail: { id, copy } }))
        conflicts++
        continue
      }
      if (!response.ok)
        throw new Error((await response.json()).error || '同步失败')
      const saved = await response.json()
      window.dispatchEvent(new CustomEvent('ielts-record-synced', { detail: { id, revision: saved.revision } }))
      const current = attempts.value.find(v => v.id === id)
      if (current && JSON.stringify(current) === snapshot) {
        saveAttempt(saved, true)
      }
      else if (current) {
        current.revision = saved.revision
        saveAttempt(current)
      }
    }
    const remote: unknown[] = await (await api('/attempts')).json()
    for (const row of remote) {
      if (isAttempt(row) && !dirty.has(row.id))
        saveAttempt(row, true)
    }
    syncMessage.value = conflicts ? '双端修改已分别保留；再次同步可上传本机副本' : dirty.size ? '还有本机修改待同步' : `已同步 · ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }
  catch (e) {
    syncMessage.value = `同步未完成，保留本机记录：${(e as Error).message}`
  }
  finally {
    syncing = false
  }
}
export async function checkConnection() {
  try {
    const status = await (await api('/session')).json()
    connected.value = status.authenticated
    if (connected.value)
      await sync()
    return status as {
      authenticated: boolean
      ai: boolean
    }
  }
  catch {
    connected.value = false
    return { authenticated: false, ai: false }
  }
}
export function exportBackup() {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), attempts: attempts.value }, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `ielts-backup-${new Date().toISOString().slice(0, 10)}.json`)
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function importBackup(value: unknown) {
  const data = value as {
    version: number
    attempts: unknown[]
  }
  if (data?.version !== 1 || !Array.isArray(data.attempts) || !data.attempts.every(isAttempt))
    throw new Error('备份格式不正确，未导入任何记录。')
  let added = 0
  for (const row of data.attempts as Attempt[]) {
    if (attempts.value.some(a => a.id === row.id))
      continue
    // Audio is exported separately. Do not claim imported metadata includes the audio.
    if (!saveAttempt({ ...row, revision: 0, hasAudio: false, audioMime: undefined, audioKey: undefined }))
      throw new Error('存储空间不足，导入未完成。')
    added++
  }
  return added
}
