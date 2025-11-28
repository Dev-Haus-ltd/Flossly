import { useBus } from './useBus'

let eventSource = null
let isStarted = false
const bus = useBus()

export const startTaskEvents = () => {
  if (typeof window === 'undefined') return
  if (isStarted) return
  isStarted = true

  try {
    eventSource = new EventSource('/api/tasks/stream')

    eventSource.addEventListener('task-updated', (event) => {
      try {
        const payload = JSON.parse(event.data || '{}')
        bus.emit('task-updated', payload)
        try {
          localStorage.setItem('task-updated', JSON.stringify(payload))
        } catch {
          // ignore storage failures (SSR or private mode)
        }
      } catch (err) {
        console.error('Failed to parse task-updated event', err)
      }
    })

    eventSource.onerror = () => {
      // Let browser auto-reconnect; we just log
      console.warn('Task events stream error; will retry automatically')
    }
  } catch (err) {
    console.error('Failed to start task events stream', err)
  }
}

export const stopTaskEvents = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  isStarted = false
}
