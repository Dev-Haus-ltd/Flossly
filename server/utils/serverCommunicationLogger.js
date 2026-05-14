import { DiaryPatientCommunicationLogs } from '../models'

/**
 * Server-side Communication Logger
 * Centralized utility for logging all patient communications
 * Used by: WhatsApp, Email, Consent Forms, Automations, etc.
 */
export class ServerCommunicationLogger {
  /**
   * Log a communication event
   * @param {Object} params
   * @param {number} params.organisationId - Organisation ID
   * @param {number} params.patientId - Patient ID
   * @param {number} params.practitionerId - Practitioner/User ID (optional)
   * @param {string} params.type - Type: 'Email', 'WhatsApp', 'SMS', 'Phone', 'In-Person', 'Automation'
   * @param {string} params.subject - Subject line (optional)
   * @param {string} params.content - Content/message body (optional)
   * @param {string} params.status - Status: 'Sent', 'Delivered', 'Failed', 'Pending', 'Draft'
   * @param {Date|string} params.sentAt - When it was sent (optional)
   * @param {Date|string} params.deliveredAt - When it was delivered (optional)
   * @param {Date|string} params.failedAt - When it failed (optional)
   * @param {string} params.errorMessage - Error message if failed (optional)
   * @param {Object} params.metadata - Additional metadata (optional)
   * @param {string} params.externalId - External service ID (optional)
   * @returns {Promise<Object>} Created log record
   */
  static async log(params) {
    try {
      const {
        organisationId,
        patientId,
        practitionerId = null,
        type,
        subject = null,
        content = null,
        status = 'Pending',
        sentAt = null,
        deliveredAt = null,
        failedAt = null,
        errorMessage = null,
        metadata = null,
        externalId = null,
      } = params

      if (!organisationId || !patientId || !type) {
        console.error('ServerCommunicationLogger.log: Missing required fields', {
          organisationId,
          patientId,
          type,
        })
        return null
      }

      const validTypes = [
        'Email',
        'WhatsApp',
        'SMS',
        'Phone',
        'In-Person',
        'Automation',
        'Consent Form',
      ]
      const validStatuses = ['Sent', 'Delivered', 'Failed', 'Pending', 'Draft']

      if (!validTypes.includes(type)) {
        console.error(`ServerCommunicationLogger.log: Invalid type "${type}"`)
        return null
      }

      if (!validStatuses.includes(status)) {
        console.error(`ServerCommunicationLogger.log: Invalid status "${status}"`)
        return null
      }

      const log = await DiaryPatientCommunicationLogs.create({
        organisationId: Number(organisationId),
        patientId: Number(patientId),
        practitionerId: practitionerId ? Number(practitionerId) : null,
        type,
        subject: subject?.substring(0, 255) || null,
        content,
        status,
        sentAt: sentAt ? new Date(sentAt) : null,
        deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
        failedAt: failedAt ? new Date(failedAt) : null,
        errorMessage,
        metadata,
        externalId: externalId?.substring(0, 255) || null,
      })

      console.log(
        `Communication logged: ${type} to patient ${patientId} - ${status}`
      )
      return log
    } catch (error) {
      console.error('ServerCommunicationLogger.log error:', error)
      return null
    }
  }

  /**
   * Log an email communication
   */
  static async logEmail(
    organisationId,
    patientId,
    subject,
    content,
    status = 'Sent',
    practitionerId = null,
    metadata = {}
  ) {
    return this.log({
      organisationId,
      patientId,
      practitionerId,
      type: 'Email',
      subject,
      content,
      status,
      sentAt: status === 'Sent' ? new Date() : null,
      metadata: {
        ...metadata,
        channel: 'email',
      },
    })
  }

  /**
   * Log a WhatsApp communication
   */
  static async logWhatsApp(
    organisationId,
    patientId,
    content,
    status = 'Sent',
    practitionerId = null,
    externalId = null,
    metadata = {}
  ) {
    return this.log({
      organisationId,
      patientId,
      practitionerId,
      type: 'WhatsApp',
      content,
      status,
      sentAt: status === 'Sent' ? new Date() : null,
      externalId,
      metadata: {
        ...metadata,
        channel: 'whatsapp',
      },
    })
  }

  /**
   * Log an SMS communication
   */
  static async logSMS(
    organisationId,
    patientId,
    content,
    status = 'Sent',
    practitionerId = null,
    metadata = {}
  ) {
    return this.log({
      organisationId,
      patientId,
      practitionerId,
      type: 'SMS',
      content,
      status,
      sentAt: status === 'Sent' ? new Date() : null,
      metadata: {
        ...metadata,
        channel: 'sms',
      },
    })
  }

  /**
   * Log an automation execution
   */
  static async logAutomation(
    organisationId,
    patientId,
    automationName,
    content,
    status = 'Sent',
    practitionerId = null,
    metadata = {}
  ) {
    return this.log({
      organisationId,
      patientId,
      practitionerId,
      type: 'Automation',
      subject: `Automation: ${automationName}`,
      content,
      status,
      sentAt: status === 'Sent' ? new Date() : null,
      metadata: {
        ...metadata,
        automationName,
        channel: 'automation',
      },
    })
  }

  /**
   * Log a phone call communication
   */
  static async logPhone(
    organisationId,
    patientId,
    content,
    status = 'Sent',
    practitionerId = null,
    metadata = {}
  ) {
    return this.log({
      organisationId,
      patientId,
      practitionerId,
      type: 'Phone',
      content,
      status,
      sentAt: status === 'Sent' ? new Date() : null,
      metadata: {
        ...metadata,
        channel: 'phone',
      },
    })
  }

  /**
   * Log an in-person communication
   */
  static async logInPerson(
    organisationId,
    patientId,
    content,
    status = 'Sent',
    practitionerId = null,
    metadata = {}
  ) {
    return this.log({
      organisationId,
      patientId,
      practitionerId,
      type: 'In-Person',
      content,
      status,
      sentAt: status === 'Sent' ? new Date() : null,
      metadata: {
        ...metadata,
        channel: 'in-person',
      },
    })
  }

  /**
   * Update the status of an existing communication log
   */
  static async updateStatus(logId, organisationId, status, additionalData = {}) {
    try {
      if (!logId || !organisationId) {
        console.error(
          'ServerCommunicationLogger.updateStatus: Missing required fields'
        )
        return null
      }

      const validStatuses = ['Sent', 'Delivered', 'Failed', 'Pending', 'Draft']
      if (!validStatuses.includes(status)) {
        console.error(
          `ServerCommunicationLogger.updateStatus: Invalid status "${status}"`
        )
        return null
      }

      const log = await DiaryPatientCommunicationLogs.findOne({
        where: {
          id: Number(logId),
          organisationId: Number(organisationId),
        },
      })

      if (!log) {
        console.error(
          `ServerCommunicationLogger.updateStatus: Log not found (id: ${logId})`
        )
        return null
      }

      const updates = { status, ...additionalData }

      // Set timestamps based on status
      if (status === 'Sent' && !log.sentAt) {
        updates.sentAt = new Date()
      } else if (status === 'Delivered' && !log.deliveredAt) {
        updates.deliveredAt = new Date()
      } else if (status === 'Failed' && !log.failedAt) {
        updates.failedAt = new Date()
      }

      await log.update(updates)

      console.log(`Communication log ${logId} updated to status: ${status}`)
      return log
    } catch (error) {
      console.error('ServerCommunicationLogger.updateStatus error:', error)
      return null
    }
  }

  /**
   * Log a failed communication with error details
   */
  static async logFailed(
    organisationId,
    patientId,
    type,
    subject,
    content,
    errorMessage,
    practitionerId = null,
    metadata = {}
  ) {
    return this.log({
      organisationId,
      patientId,
      practitionerId,
      type,
      subject,
      content,
      status: 'Failed',
      failedAt: new Date(),
      errorMessage,
      metadata: {
        ...metadata,
        failureReason: errorMessage,
      },
    })
  }

  /**
   * Get recent communications for a patient (for debugging/monitoring)
   */
  static async getRecentForPatient(organisationId, patientId, limit = 10) {
    try {
      const logs = await DiaryPatientCommunicationLogs.findAll({
        where: {
          organisationId: Number(organisationId),
          patientId: Number(patientId),
        },
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 100),
      })
      return logs
    } catch (error) {
      console.error(
        'ServerCommunicationLogger.getRecentForPatient error:',
        error
      )
      return []
    }
  }
}
