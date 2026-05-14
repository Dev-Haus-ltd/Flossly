// In-memory ring buffer for recent server logs.
// Stores the last MAX_ENTRIES entries; oldest are dropped automatically.
// Usage: import { pushLog, getLogs } from './logBuffer'

const MAX_ENTRIES = 200

const buffer = []

export const pushLog = (level, tag, message, data = null) => {
  const entry = {
    t: new Date().toISOString(),
    level,
    tag,
    message,
    data,
  }
  buffer.push(entry)
  if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES)
  // Also emit to native console so PM2/systemd logs still work
  const line = `[${level.toUpperCase()}] [${tag}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const getLogs = ({ tag = null, level = null, last = 100 } = {}) => {
  let result = buffer.slice()
  if (tag) result = result.filter((e) => e.tag === tag || String(e.tag || '').includes(tag))
  if (level) result = result.filter((e) => e.level === level)
  return result.slice(-Math.min(last, MAX_ENTRIES))
}
