import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CONTACT_METHODS = ['Email', 'Phone', 'SMS', 'In-Person']
export const APPOINTMENT_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
export const BEST_TIMES = ['Morning','Afternoon','Evening']

export const CrmLeadCommunication = sequelize.define(
  'CrmLeadCommunications',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    leadId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'CrmLeads', key: 'id' } },
    preferredContactMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [CONTACT_METHODS],
      },
    },
    preferredAppointmentDay: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [APPOINTMENT_DAYS],
      },
    },
    bestTimesToContact: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidArray(value) {
          if (value == null) return
          if (!Array.isArray(value)) {
            throw new Error('bestTimesToContact must be an array or null')
          }
          const invalid = value.filter((v) => !BEST_TIMES.includes(v))
          if (invalid.length) {
            throw new Error(`Invalid bestTimesToContact values: ${invalid.join(', ')}`)
          }
        },
      },
    },
  },
  { modelName: 'CrmLeadCommunications', timestamps: true }
)


