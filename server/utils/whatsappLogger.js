import { ServerCommunicationLogger } from './serverCommunicationLogger.js'
import { DiaryPatient } from '../models'

/**
 * WhatsApp-specific integration for Communication Hub logging
 * Bridges WhatsApp service with Communication Hub
 */
export class WhatsAppLogger {
  /**
   * Find patient by phone number within organization
   * @param {number} organisationId
   * @param {string} phoneNumber - Phone number to search
   * @returns {Promise<Object|null>}
   */
  static async findPatientByPhone(organisationId, phoneNumber) {
    if (!organisationId || !phoneNumber) return null
    try {
      const normalizedPhone = String(phoneNumber).replace(/\D/g, '')
      if (!normalizedPhone) return null

      const patients = await DiaryPatient.findAll({
        where: { organisationId: Number(organisationId) },
        attributes: ['id', 'firstName', 'lastName', 'mobile', 'telephone'],
        limit: 50,
      })

      for (const patient of patients) {
        const patientPhone = String(patient.mobile || patient.telephone || '').replace(/\D/g, '')
        if (patientPhone === normalizedPhone || patientPhone.endsWith(normalizedPhone.slice(-6))) {
          return patient
        }
      }
    } catch (error) {
      console.error('WhatsAppLogger.findPatientByPhone error:', error)
    }
    return null
  }

  /**
   * Log outbound WhatsApp message
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.patientId - Patient ID (optional)
   * @param {string} params.to - Recipient phone number
   * @param {string} params.content - Message content
   * @param {string} params.status - 'Sent', 'Delivered', 'Failed', 'Pending'
   * @param {number} params.practitionerId - Practitioner ID (optional)
   * @param {string} params.externalId - Provider message ID (optional)
   * @param {Object} params.metadata - Additional data
   */
  static async logOutbound(params) {
    const {
      organisationId,
      patientId,
      to,
      content,
      status = 'Sent',
      practitionerId = null,
      externalId = null,
      metadata = {},
    } = params

    try {
      return await ServerCommunicationLogger.logWhatsApp(
        organisationId,
        patientId,
        content,
        status,
        practitionerId,
        externalId,
        {
          ...metadata,
          recipientPhone: to,
          direction: 'outbound',
        }
      )
    } catch (error) {
      console.error('WhatsAppLogger.logOutbound error:', error)
      return null
    }
  }

  /**
   * Log inbound WhatsApp message (from patient)
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.patientId
   * @param {string} params.from - Sender phone number
   * @param {string} params.content - Message content
   * @param {number} params.practitionerId - Practitioner who received it (optional)
   * @param {string} params.externalId - Provider message ID (optional)
   * @param {Object} params.metadata
   */
  static async logInbound(params) {
    const {
      organisationId,
      patientId,
      from,
      content,
      practitionerId = null,
      externalId = null,
      metadata = {},
    } = params

    try {
      const log = await ServerCommunicationLogger.log({
        organisationId,
        patientId,
        practitionerId,
        type: 'WhatsApp',
        content,
        status: 'Delivered',
        sentAt: new Date(),
        externalId,
        metadata: {
          ...metadata,
          senderPhone: from,
          direction: 'inbound',
        },
      })
      return log
    } catch (error) {
      console.error('WhatsAppLogger.logInbound error:', error)
      return null
    }
  }

  /**
   * Update WhatsApp message delivery status
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.logId - Communication log ID
   * @param {string} params.status - 'Sent', 'Delivered', 'Read', 'Failed'
   * @param {Object} params.metadata
   */
  static async updateStatus(params) {
    const { organisationId, logId, status, metadata = {} } = params

    try {
      return await ServerCommunicationLogger.updateStatus(
        logId,
        organisationId,
        status,
        {
          metadata,
          deliveredAt: status === 'Delivered' ? new Date() : undefined,
        }
      )
    } catch (error) {
      console.error('WhatsAppLogger.updateStatus error:', error)
      return null
    }
  }

  /**
   * Log failed WhatsApp delivery
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.patientId
   * @param {string} params.to - Recipient phone
   * @param {string} params.content - Message content
   * @param {string} params.errorMessage - Error details
   * @param {number} params.practitionerId - Practitioner ID (optional)
   */
  static async logFailed(params) {
    const {
      organisationId,
      patientId,
      to,
      content,
      errorMessage,
      practitionerId = null,
    } = params

    try {
      return await ServerCommunicationLogger.logFailed(
        organisationId,
        patientId,
        'WhatsApp',
        `WhatsApp Message - ${to}`,
        content,
        errorMessage,
        practitionerId,
        {
          recipientPhone: to,
          direction: 'outbound',
        }
      )
    } catch (error) {
      console.error('WhatsAppLogger.logFailed error:', error)
      return null
    }
  }

  /**
   * Log WhatsApp template sending
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.patientId
   * @param {string} params.to - Recipient phone
   * @param {string} params.templateName
   * @param {string} params.status - 'Sent', 'Failed', 'Pending'
   * @param {number} params.practitionerId
   * @param {string} params.errorMessage - If failed
   */
  static async logTemplate(params) {
    const {
      organisationId,
      patientId,
      to,
      templateName,
      status = 'Sent',
      practitionerId = null,
      errorMessage = null,
    } = params

    try {
      if (status === 'Failed') {
        return await ServerCommunicationLogger.logFailed(
          organisationId,
          patientId,
          'WhatsApp',
          `WhatsApp Template: ${templateName}`,
          `Template "${templateName}" sent to ${to}`,
          errorMessage || 'Template delivery failed',
          practitionerId,
          {
            templateName,
            recipientPhone: to,
            isTemplate: true,
          }
        )
      } else {
        return await ServerCommunicationLogger.log({
          organisationId,
          patientId,
          practitionerId,
          type: 'WhatsApp',
          subject: `WhatsApp Template: ${templateName}`,
          content: `Template "${templateName}" sent to ${to}`,
          status,
          sentAt: status === 'Sent' ? new Date() : null,
          metadata: {
            templateName,
            recipientPhone: to,
            isTemplate: true,
          },
        })
      }
    } catch (error) {
      console.error('WhatsAppLogger.logTemplate error:', error)
      return null
    }
  }
}
