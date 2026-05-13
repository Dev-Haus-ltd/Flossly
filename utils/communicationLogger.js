import diaryService from '@/services/diaryService';

/**
 * Utility class for logging patient communications
 */
export class CommunicationLogger {
  /**
   * Log a communication event
   * @param {Object} params
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
   */
  static async log(params) {
    try {
      const response = await diaryService.createCommunicationLog(params);
      if (response.code === 0) {
        console.log('Communication logged successfully:', response.data);
        return response.data;
      } else {
        console.error('Failed to log communication:', response.message);
        return null;
      }
    } catch (error) {
      console.error('Error logging communication:', error);
      return null;
    }
  }

  /**
   * Log an email communication
   */
  static async logEmail(patientId, subject, content, status = 'Sent', practitionerId = null, metadata = {}) {
    return this.log({
      patientId,
      practitionerId,
      type: 'Email',
      subject,
      content,
      status,
      metadata: {
        ...metadata,
        channel: 'email'
      }
    });
  }

  /**
   * Log a WhatsApp communication
   */
  static async logWhatsApp(patientId, content, status = 'Sent', practitionerId = null, externalId = null, metadata = {}) {
    return this.log({
      patientId,
      practitionerId,
      type: 'WhatsApp',
      content,
      status,
      externalId,
      metadata: {
        ...metadata,
        channel: 'whatsapp'
      }
    });
  }

  /**
   * Log an SMS communication
   */
  static async logSMS(patientId, content, status = 'Sent', practitionerId = null, metadata = {}) {
    return this.log({
      patientId,
      practitionerId,
      type: 'SMS',
      content,
      status,
      metadata: {
        ...metadata,
        channel: 'sms'
      }
    });
  }

  /**
   * Log an automation execution
   */
  static async logAutomation(patientId, automationName, content, status = 'Sent', practitionerId = null, metadata = {}) {
    return this.log({
      patientId,
      practitionerId,
      type: 'Automation',
      subject: `Automation: ${automationName}`,
      content,
      status,
      metadata: {
        ...metadata,
        automationName,
        channel: 'automation'
      }
    });
  }

  /**
   * Update the status of an existing communication log
   */
  static async updateStatus(logId, status, additionalData = {}) {
    try {
      const updates = { id: logId, status, ...additionalData };
      const response = await diaryService.updateCommunicationLog(updates);
      if (response.code === 0) {
        console.log('Communication status updated:', response.data);
        return response.data;
      } else {
        console.error('Failed to update communication status:', response.message);
        return null;
      }
    } catch (error) {
      console.error('Error updating communication status:', error);
      return null;
    }
  }
}