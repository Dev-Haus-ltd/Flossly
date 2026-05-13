import { DiaryPatientCommunicationLogs, DiaryPatient } from '../models'
import { Op } from 'sequelize'

/**
 * Edge Case and Data Consistency Handler for Communication Hub
 * Prevents duplicate logs, handles orphaned records, and ensures data integrity
 */
export class CommunicationHubConsistency {
  /**
   * Check for potential duplicate log within timeframe
   * Helps prevent duplicate logs when operations are retried or resubmitted
   * @param {Object} params
   * @param {number} params.organisationId
   * @param {number} params.patientId
   * @param {string} params.type
   * @param {string} params.externalId - Optional provider message ID
   * @param {number} params.timeWindowSeconds - Time window to check (default: 60)
   * @returns {Promise<Object|null>} Existing log if found, null otherwise
   */
  static async checkDuplicate(params) {
    const {
      organisationId,
      patientId,
      type,
      externalId = null,
      timeWindowSeconds = 60,
    } = params

    try {
      if (!organisationId || !patientId || !type) return null

      // If we have external ID, use it for exact matching
      if (externalId) {
        const existing = await DiaryPatientCommunicationLogs.findOne({
          where: {
            organisationId: Number(organisationId),
            patientId: Number(patientId),
            type,
            externalId,
          },
          order: [['createdAt', 'DESC']],
        })
        if (existing) {
          console.warn(
            `Duplicate log detected via externalId: ${externalId}`
          )
          return existing
        }
      }

      // Check for recent logs of same type for same patient
      const windowMs = timeWindowSeconds * 1000
      const thresholdTime = new Date(Date.now() - windowMs)

      const recent = await DiaryPatientCommunicationLogs.findOne({
        where: {
          organisationId: Number(organisationId),
          patientId: Number(patientId),
          type,
          createdAt: { [Op.gte]: thresholdTime },
        },
        order: [['createdAt', 'DESC']],
      })

      if (recent) {
        console.warn(
          `Potential duplicate log detected: ${type} for patient ${patientId} within ${timeWindowSeconds}s`
        )
        return recent
      }

      return null
    } catch (error) {
      console.error('CommunicationHubConsistency.checkDuplicate error:', error)
      return null
    }
  }

  /**
   * Validate communication log data before creation
   * Ensures all required fields are present and valid
   * @param {Object} logData
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateLogData(logData) {
    const errors = []

    // Check required fields
    if (!logData.organisationId || Number(logData.organisationId) <= 0) {
      errors.push('Valid organisationId is required')
    }

    if (!logData.patientId || Number(logData.patientId) <= 0) {
      errors.push('Valid patientId is required')
    }

    if (!logData.type) {
      errors.push('Communication type is required')
    } else {
      const validTypes = [
        'Email',
        'WhatsApp',
        'SMS',
        'Phone',
        'In-Person',
        'Automation',
        'Consent Form',
      ]
      if (!validTypes.includes(logData.type)) {
        errors.push(
          `Invalid type. Must be one of: ${validTypes.join(', ')}`
        )
      }
    }

    if (logData.status) {
      const validStatuses = ['Sent', 'Delivered', 'Failed', 'Pending', 'Draft']
      if (!validStatuses.includes(logData.status)) {
        errors.push(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        )
      }
    }

    // Check subject length
    if (logData.subject && logData.subject.length > 255) {
      errors.push('Subject must be 255 characters or less')
    }

    // Check external ID length
    if (logData.externalId && logData.externalId.length > 255) {
      errors.push('External ID must be 255 characters or less')
    }

    // Validate timestamps are in correct order
    if (logData.sentAt && logData.deliveredAt) {
      if (new Date(logData.sentAt) > new Date(logData.deliveredAt)) {
        errors.push('sentAt cannot be after deliveredAt')
      }
    }

    if (logData.sentAt && logData.failedAt) {
      if (new Date(logData.sentAt) > new Date(logData.failedAt)) {
        errors.push('sentAt cannot be after failedAt')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Handle orphaned logs (patient deleted but log remains)
   * @param {number} organisationId
   * @returns {Promise<number>} Count of orphaned logs found
   */
  static async findOrphanedLogs(organisationId) {
    try {
      if (!organisationId) return 0

      // Find all logs for this org
      const allLogs = await DiaryPatientCommunicationLogs.findAll({
        where: { organisationId: Number(organisationId) },
        attributes: ['id', 'patientId'],
        raw: true,
      })

      if (allLogs.length === 0) return 0

      const patientIds = [...new Set(allLogs.map((log) => log.patientId))]
      const existingPatients = await DiaryPatient.findAll({
        where: {
          id: { [Op.in]: patientIds },
          organisationId: Number(organisationId),
        },
        attributes: ['id'],
        raw: true,
      })

      const existingPatientIds = new Set(existingPatients.map((p) => p.id))
      const orphanedLogs = allLogs.filter(
        (log) => !existingPatientIds.has(log.patientId)
      )

      console.warn(
        `Found ${orphanedLogs.length} orphaned communication logs for org ${organisationId}`
      )
      return orphanedLogs.length
    } catch (error) {
      console.error(
        'CommunicationHubConsistency.findOrphanedLogs error:',
        error
      )
      return 0
    }
  }

  /**
   * Cleanup orphaned logs (optional)
   * @param {number} organisationId
   * @param {number} daysOld - Only delete logs older than this many days (default: 90)
   * @returns {Promise<number>} Count of deleted logs
   */
  static async cleanupOrphanedLogs(
    organisationId,
    daysOld = 90
  ) {
    try {
      if (!organisationId) return 0

      const thresholdDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)

      const allOldLogs = await DiaryPatientCommunicationLogs.findAll({
        where: {
          organisationId: Number(organisationId),
          createdAt: { [Op.lt]: thresholdDate },
        },
        attributes: ['id', 'patientId'],
        raw: true,
      })

      if (allOldLogs.length === 0) return 0

      const patientIds = [...new Set(allOldLogs.map((log) => log.patientId))]
      const existingPatients = await DiaryPatient.findAll({
        where: {
          id: { [Op.in]: patientIds },
          organisationId: Number(organisationId),
        },
        attributes: ['id'],
        raw: true,
      })

      const existingPatientIds = new Set(existingPatients.map((p) => p.id))

      // Delete orphaned old logs
      const orphanedLogIds = allOldLogs
        .filter((log) => !existingPatientIds.has(log.patientId))
        .map((log) => log.id)

      if (orphanedLogIds.length > 0) {
        const result = await DiaryPatientCommunicationLogs.destroy({
          where: { id: { [Op.in]: orphanedLogIds } },
        })
        console.log(
          `Deleted ${result} orphaned communication logs for org ${organisationId}`
        )
        return result
      }

      return 0
    } catch (error) {
      console.error(
        'CommunicationHubConsistency.cleanupOrphanedLogs error:',
        error
      )
      return 0
    }
  }

  /**
   * Verify patient exists before creating log
   * @param {number} organisationId
   * @param {number} patientId
   * @returns {Promise<boolean>}
   */
  static async verifyPatientExists(organisationId, patientId) {
    try {
      const patient = await DiaryPatient.findOne({
        where: {
          id: Number(patientId),
          organisationId: Number(organisationId),
        },
        attributes: ['id'],
        raw: true,
      })
      return !!patient
    } catch (error) {
      console.error(
        'CommunicationHubConsistency.verifyPatientExists error:',
        error
      )
      return false
    }
  }

  /**
   * Get statistics for quality monitoring
   * @param {number} organisationId
   * @param {number} daysBack - Number of days to analyze (default: 30)
   * @returns {Promise<Object>} Statistics object
   */
  static async getQualityStatistics(organisationId, daysBack = 30) {
    try {
      if (!organisationId) return null

      const thresholdDate = new Date(
        Date.now() - daysBack * 24 * 60 * 60 * 1000
      )

      const logs = await DiaryPatientCommunicationLogs.findAll({
        where: {
          organisationId: Number(organisationId),
          createdAt: { [Op.gte]: thresholdDate },
        },
        attributes: ['type', 'status', 'createdAt'],
        raw: true,
      })

      const stats = {
        totalLogs: logs.length,
        byType: {},
        byStatus: {},
        successRate: 0,
        failureRate: 0,
        averageLogsPerDay: 0,
      }

      // Count by type
      logs.forEach((log) => {
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1
        stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
      })

      // Calculate rates
      const sent = stats.byStatus['Sent'] || 0
      const delivered = stats.byStatus['Delivered'] || 0
      const failed = stats.byStatus['Failed'] || 0
      const successCount = sent + delivered
      const failureCount = failed

      stats.successRate =
        stats.totalLogs > 0
          ? ((successCount / stats.totalLogs) * 100).toFixed(2)
          : 0
      stats.failureRate =
        stats.totalLogs > 0
          ? ((failureCount / stats.totalLogs) * 100).toFixed(2)
          : 0
      stats.averageLogsPerDay = (stats.totalLogs / daysBack).toFixed(2)

      return stats
    } catch (error) {
      console.error(
        'CommunicationHubConsistency.getQualityStatistics error:',
        error
      )
      return null
    }
  }

  /**
   * Get recent failures for a patient (for debugging)
   * @param {number} organisationId
   * @param {number} patientId
   * @param {number} limit - Max results (default: 10)
   * @returns {Promise<Array>}
   */
  static async getRecentFailures(organisationId, patientId, limit = 10) {
    try {
      return await DiaryPatientCommunicationLogs.findAll({
        where: {
          organisationId: Number(organisationId),
          patientId: Number(patientId),
          status: 'Failed',
        },
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 100),
      })
    } catch (error) {
      console.error(
        'CommunicationHubConsistency.getRecentFailures error:',
        error
      )
      return []
    }
  }

  /**
   * Check for stuck communications (still pending after X hours)
   * @param {number} organisationId
   * @param {number} hoursThreshold - Hours to consider stuck (default: 24)
   * @returns {Promise<Array>}
   */
  static async getStuckCommunications(organisationId, hoursThreshold = 24) {
    try {
      const thresholdTime = new Date(
        Date.now() - hoursThreshold * 60 * 60 * 1000
      )

      return await DiaryPatientCommunicationLogs.findAll({
        where: {
          organisationId: Number(organisationId),
          status: 'Pending',
          createdAt: { [Op.lt]: thresholdTime },
        },
        order: [['createdAt', 'ASC']],
        limit: 100,
      })
    } catch (error) {
      console.error(
        'CommunicationHubConsistency.getStuckCommunications error:',
        error
      )
      return []
    }
  }

  /**
   * Safe update status with validation
   * @param {Object} params
   * @param {number} params.logId
   * @param {number} params.organisationId
   * @param {string} params.newStatus
   * @returns {Promise<Object|null>}
   */
  static async safeUpdateStatus(params) {
    const { logId, organisationId, newStatus } = params

    try {
      // Validate status
      const validStatuses = ['Sent', 'Delivered', 'Failed', 'Pending', 'Draft']
      if (!validStatuses.includes(newStatus)) {
        console.error(`Invalid status: ${newStatus}`)
        return null
      }

      // Find and update
      const log = await DiaryPatientCommunicationLogs.findOne({
        where: {
          id: Number(logId),
          organisationId: Number(organisationId),
        },
      })

      if (!log) {
        console.error(`Log not found: ${logId}`)
        return null
      }

      // Set appropriate timestamp
      const updates = { status: newStatus }
      if (newStatus === 'Sent' && !log.sentAt) {
        updates.sentAt = new Date()
      } else if (newStatus === 'Delivered' && !log.deliveredAt) {
        updates.deliveredAt = new Date()
      } else if (newStatus === 'Failed' && !log.failedAt) {
        updates.failedAt = new Date()
      }

      await log.update(updates)
      return log
    } catch (error) {
      console.error(
        'CommunicationHubConsistency.safeUpdateStatus error:',
        error
      )
      return null
    }
  }
}
