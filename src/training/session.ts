import { checkConnection, sync } from './storage'
import { startLessonUpdates } from './lessons'

let started = false
export function startSync() {
  if (started)
    return
  started = true
  startLessonUpdates()
  checkConnection()
  window.addEventListener('online', () => {
    checkConnection()
  })
  window.addEventListener('focus', () => {
    checkConnection()
  })
  setInterval(() => {
    sync()
  }, 30000)
}
