import { checkConnection, sync } from './storage'

let started = false
export function startSync() {
  if (started)
    return
  started = true
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
