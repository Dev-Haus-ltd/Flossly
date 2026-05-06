import crypto from 'crypto'
import { randomBytes } from 'crypto'

/**
 * Generate a secure random token for document access
 * @param {number} length - Token length (default 32 bytes = 64 hex chars)
 * @returns {string} Secure token
 */
export const generateSecureToken = (length = 32) => {
  return randomBytes(length).toString('hex')
}

/**
 * Hash a token for database storage
 * @param {string} token - Plain token
 * @returns {string} Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Verify a token against its hash
 * @param {string} token - Plain token to verify
 * @param {string} hash - Stored hash
 * @returns {boolean}
 */
export const verifyToken = (token, hash) => {
  const tokenHash = hashToken(token)
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(hash)
  )
}

/**
 * Check if a token has expired
 * @param {Date} expiresAt - Expiration date
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return false // No expiration
  return new Date() > new Date(expiresAt)
}

/**
 * Generate expiration date
 * @param {number} expiryDays - Days until expiry (default 30)
 * @returns {Date}
 */
export const generateExpiryDate = (expiryDays = 30) => {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + expiryDays)
  return expiryDate
}

/**
 * Generate a unique document ID for tracking
 * @returns {string}
 */
export const generateDocumentId = () => {
  return `doc_${Date.now()}_${randomBytes(8).toString('hex')}`
}

/**
 * Extract IP address from request
 * @param {Object} event - Nuxt/H3 event object
 * @returns {string} IP address
 */
export const getClientIpAddress = (event) => {
  const headerNames = [
    'x-forwarded-for',
    'cf-connecting-ip',
    'x-client-ip',
    'x-real-ip',
  ]

  for (const header of headerNames) {
    const value = event.node.req.headers[header]
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim()
    }
  }

  return event.node.req.socket?.remoteAddress || 'Unknown'
}

/**
 * Extract user agent from request
 * @param {Object} event - Nuxt/H3 event object
 * @returns {string} User agent
 */
export const getUserAgent = (event) => {
  return event.node.req.headers['user-agent'] || 'Unknown'
}

/**
 * Create audit log metadata
 * @param {Object} event - H3 event
 * @param {Object} additionalData - Additional metadata
 * @returns {Object}
 */
export const createAuditMetadata = (event, additionalData = {}) => {
  return {
    ipAddress: getClientIpAddress(event),
    userAgent: getUserAgent(event),
    timestamp: new Date().toISOString(),
    ...additionalData,
  }
}

/**
 * Validate consent form data
 * @param {Object} formData - Form submission data
 * @returns {{isValid: boolean, errors: string[]}}
 */
export const validateConsentFormData = (formData) => {
  const errors = []

  if (!formData.patientId || typeof formData.patientId !== 'number') {
    errors.push('Valid patientId is required')
  }

  if (!formData.templateId || typeof formData.templateId !== 'number') {
    errors.push('Valid templateId is required')
  }

  // name is optional - API uses template.name if not provided
  // Do not require it here

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate signature data (base64 or path)
 * @param {string} signatureData - Signature data
 * @returns {boolean}
 */
export const validateSignatureData = (signatureData) => {
  if (!signatureData || typeof signatureData !== 'string') {
    return false
  }

  // Check if it's a valid base64 data URI or file path
  if (signatureData.startsWith('data:image/png;base64,')) {
    return true
  }

  // Assume it's a valid file path if it starts with /tmp or similar
  return signatureData.includes('/')
}

/**
 * Sanitize HTML content (basic XSS prevention)
 * Remove script tags and event handlers
 * @param {string} htmlContent - HTML to sanitize
 * @returns {string}
 */
export const sanitizeHtmlContent = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return ''
  }

  // Remove script tags and content
  let sanitized = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers (on* attributes)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["']?[^"']*["']?/gi, '')

  // Remove potentially dangerous HTML elements
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

  return sanitized
}

/**
 * Generate a patient-friendly document reference code
 * @returns {string}
 */
export const generateDocumentReference = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `CONSENT-${Date.now().toString().slice(-6)}-${result}`
}

/**
 * Check role-based access to manage consent forms
 * @param {Object} user - User object from context
 * @returns {boolean}
 */
export const canManageConsentForms = (user) => {
  // Check if user has manager/admin role
  // Roles that can manage consent forms
  const allowedRoles = ['admin', 'manager', 'practice_manager', 'staff_manager']
  return user && user.role && allowedRoles.includes(user.role.toLowerCase())
}

/**
 * Check if user can view consent document
 * @param {Object} user - User object
 * @param {number} patientId - Patient ID
 * @param {string} userType - 'patient' or 'staff'
 * @returns {boolean}
 */
export const canViewConsentDocument = (user, patientId, userType = 'staff') => {
  if (userType === 'patient') {
    // Patient can only view their own documents
    return user && user.diaryPatientId === patientId
  } else {
    // Staff can view if they have access to the patient
    return user && typeof user.organisationId === 'number'
  }
}

/**
 * Encrypt sensitive data (for additional security layer)
 * @param {string} data - Data to encrypt
 * @param {string} encryptionKey - Encryption key
 * @returns {string} Encrypted data
 */
export const encryptData = (data, encryptionKey) => {
  const iv = randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv)

  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted data
 * @param {string} encryptionKey - Encryption key
 * @returns {string} Decrypted data
 */
export const decryptData = (encryptedData, encryptionKey) => {
  const [ivHex, encrypted] = encryptedData.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
