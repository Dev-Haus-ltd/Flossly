import crypto from 'crypto'

const getKey = () => {
  const config = useRuntimeConfig()
  const secret = config.JWT_SECRET || 'fallback-secret'
  return crypto.createHash('sha256').update(secret).digest()
}

const ivLength = 16

export function encrypt(text) {
  if (!text) return text
  const key = getKey()
  const iv = crypto.randomBytes(ivLength)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return iv.toString('base64') + ':' + encrypted
}

export function decrypt(payload) {
  if (!payload) return payload
  const key = getKey()
  const [ivB64, data] = String(payload).split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(data, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

