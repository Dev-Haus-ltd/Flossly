import { ServerCommunicationLogger } from './serverCommunicationLogger.js'

/**
 * Automation-specific integration for Communication Hub logging
 * Logs all automation-triggered communications
 */
export class AutomationLogger {
  /**
   * Log automation execution
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.patientId - Patient ID (optional)
   * @param {number} params.leadId - Lead ID (optional, for CRM leads)
   * @param {string} params.automationName - Name of the automation
   * @param {string} params.content - What was sent/executed
   * @param {string} params.status - 'Sent', 'Failed', 'Pending'
   * @param {number} params.practitionerId - User who triggered it (optional)
   * @param {string} params.errorMessage - If failed (optional)
   * @param {Object} params.metadata - Additional data
   */
  static async logExecution(params) {
    const {
      organisationId,
      patientId = null,
      leadId = null,
      automationName,
      content,
      status = 'Sent',
      practitionerId = null,
      errorMessage = null,
      metadata = {},
    } = params

    try {
      // Only log if patient ID is provided (patient-related automations)
      if (patientId) {
        if (status === 'Failed') {
          return await ServerCommunicationLogger.logFailed(
            organisationId,
            patientId,
            'Automation',
            `Automation: ${automationName}`,
            content,
            errorMessage || 'Automation execution failed',
            practitionerId,
            {
              ...metadata,
              automationName,
              leadId,
              failedAt: new Date().toISOString(),
            }
          )
        } else {
          return await ServerCommunicationLogger.logAutomation(
            organisationId,
            patientId,
            automationName,
            content,
            status,
            practitionerId,
            {
              ...metadata,
              leadId,
              executedAt: new Date().toISOString(),
            }
          )
        }
      }
      return null
    } catch (error) {
      console.error('AutomationLogger.logExecution error:', error)
      return null
    }
  }

  /**
   * Log automation email send
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.patientId
   * @param {string} params.automationName
   * @param {string} params.subject - Email subject
   * @param {string} params.content - Email content (HTML)
   * @param {string} params.to - Recipient email
   * @param {string} params.status - 'Sent', 'Failed', 'Pending'
   * @param {number} params.practitionerId
   * @param {string} params.errorMessage - If failed
   */
  static async logEmail(params) {
    const {
      organisationId,
      patientId,
      automationName,
      subject,
      content,
      to,
      status = 'Sent',
      practitionerId = null,
      errorMessage = null,
    } = params

    try {
      if (status === 'Failed') {
        return await ServerCommunicationLogger.logFailed(
          organisationId,
          patientId,
          'Automation',
          `${automationName}: ${subject}`,
          content,
          errorMessage || 'Email delivery failed',
          practitionerId,
          {
            automationName,
            channel: 'email',
            recipientEmail: to,
          }
        )
      } else {
        return await ServerCommunicationLogger.logEmail(
          organisationId,
          patientId,
          subject,
          content,
          status,
          practitionerId,
          {
            automationName,
            recipientEmail: to,
            channel: 'automation',
          }
        )
      }
    } catch (error) {
      console.error('AutomationLogger.logEmail error:', error)
      return null
    }
  }

  /**
   * Log automation SMS send
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.patientId
   * @param {string} params.automationName
   * @param {string} params.content - SMS content
   * @param {string} params.to - Recipient phone
   * @param {string} params.status
   * @param {number} params.practitionerId
   * @param {string} params.errorMessage
   */
  static async logSMS(params) {
    const {
      organisationId,
      patientId,
      automationName,
      content,
      to,
      status = 'Sent',
      practitionerId = null,
      errorMessage = null,
    } = params

    try {
      if (status === 'Failed') {
        return await ServerCommunicationLogger.logFailed(
          organisationId,
          patientId,
          'Automation',
          `${automationName}: SMS`,
          content,
          errorMessage || 'SMS delivery failed',
          practitionerId,
          {
            automationName,
            channel: 'sms',
            recipientPhone: to,
          }
        )
      } else {
        return await ServerCommunicationLogger.logSMS(
          organisationId,
          patientId,
          content,
          status,
          practitionerId,
          {
            automationName,
            recipientPhone: to,
            channel: 'automation',
          }
        )
      }
    } catch (error) {
      console.error('AutomationLogger.logSMS error:', error)
      return null
    }
  }

  /**
   * Log automation WhatsApp send
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.patientId
   * @param {string} params.automationName
   * @param {string} params.content - WhatsApp message content
   * @param {string} params.to - Recipient phone
   * @param {string} params.status
   * @param {number} params.practitionerId
   * @param {string} params.externalId - Provider message ID
   * @param {string} params.errorMessage
   */
  static async logWhatsApp(params) {
    const {
      organisationId,
      patientId,
      automationName,
      content,
      to,
      status = 'Sent',
      practitionerId = null,
      externalId = null,
      errorMessage = null,
    } = params

    try {
      if (status === 'Failed') {
        return await ServerCommunicationLogger.logFailed(
          organisationId,
          patientId,
          'Automation',
          `${automationName}: WhatsApp`,
          content,
          errorMessage || 'WhatsApp delivery failed',
          practitionerId,
          {
            automationName,
            channel: 'whatsapp',
            recipientPhone: to,
          }
        )
      } else {
        return await ServerCommunicationLogger.logWhatsApp(
          organisationId,
          patientId,
          content,
          status,
          practitionerId,
          externalId,
          {
            automationName,
            recipientPhone: to,
            channel: 'automation',
          }
        )
      }
    } catch (error) {
      console.error('AutomationLogger.logWhatsApp error:', error)
      return null
    }
  }

  /**
   * Log bulk automation send
   * Useful for logging multiple recipients in a single automation run
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {string} params.automationName
   * @param {string} params.channel - 'Email', 'SMS', 'WhatsApp'
   * @param {number} params.successCount - Number successfully sent
   * @param {number} params.failureCount - Number failed
   * @param {number} params.practitionerId
   * @param {Object} params.metadata
   */
  static async logBulkExecution(params) {
    const {
      organisationId,
      automationName,
      channel,
      successCount,
      failureCount,
      practitionerId = null,
      metadata = {},
    } = params

    try {
      console.log(
        `Automation bulk execution: ${automationName} (${channel}) - Success: ${successCount}, Failed: ${failureCount}`
      )

      // Could store bulk statistics in a separate table if needed
      return {
        automationName,
        channel,
        successCount,
        failureCount,
        executedAt: new Date().toISOString(),
        metadata,
      }
    } catch (error) {
      console.error('AutomationLogger.logBulkExecution error:', error)
      return null
    }
  }

  /**
   * Update automation log status
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.logId - Communication log ID
   * @param {string} params.newStatus
   * @param {string} params.errorMessage - If failed
   */
  static async updateStatus(params) {
    const { organisationId, logId, newStatus, errorMessage = null } = params

    try {
      return await ServerCommunicationLogger.updateStatus(
        logId,
        organisationId,
        newStatus,
        {
          errorMessage,
          updatedAt: new Date().toISOString(),
        }
      )
    } catch (error) {
      console.error('AutomationLogger.updateStatus error:', error)
      return null
    }
  }
}
