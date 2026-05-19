import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const COMMUNICATION_TYPES = [
  'Email',
  'WhatsApp',
  'SMS',
  'Phone',
  'In-Person',
  'Automation',
  'Consent Form'
]

export const COMMUNICATION_STATUSES = [
  'Sent',
  'Delivered',
  'Failed',
  'Pending',
  'Draft'
]

export const DiaryPatientCommunicationLogs = sequelize.define(
  'DiaryPatientCommunicationLogs',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    patientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'DiaryPatients', key: 'id' } },
    practitionerId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' } },
    type: {
      type: DataTypes.ENUM(...COMMUNICATION_TYPES),
      allowNull: false
    },
    subject: { type: DataTypes.STRING(255), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...COMMUNICATION_STATUSES),
      allowNull: false,
      defaultValue: 'Pending'
    },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    failedAt: { type: DataTypes.DATE, allowNull: true },
    errorMessage: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true }, // For storing additional data like template ID, automation ID, etc.
    externalId: { type: DataTypes.STRING(255), allowNull: true }, // For external service IDs (WhatsApp message ID, email ID, etc.)
  },
  {
    modelName: 'DiaryPatientCommunicationLogs',
    timestamps: true,
    indexes: [
      { fields: ['organisationId', 'patientId'] },
      { fields: ['organisationId', 'practitionerId'] },
      { fields: ['organisationId', 'type'] },
      { fields: ['organisationId', 'status'] },
      { fields: ['organisationId', 'createdAt'] }
    ]
  }
)