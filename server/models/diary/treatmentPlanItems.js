import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryTreatmentPlanItem = sequelize.define(
  'DiaryTreatmentPlanItems',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    planId: { type: DataTypes.STRING(80), allowNull: true },
    planName: { type: DataTypes.STRING(160), allowNull: true },
    appointmentGroupId: { type: DataTypes.STRING(80), allowNull: true },
    appointmentId: { type: DataTypes.INTEGER, allowNull: true },
    fdi: { type: DataTypes.INTEGER, allowNull: true },
    surface: { type: DataTypes.STRING(40), allowNull: true },
    condition: { type: DataTypes.STRING(80), allowNull: true },
    conditionLabel: { type: DataTypes.STRING(160), allowNull: true },
    treatmentId: { type: DataTypes.INTEGER, allowNull: true },
    treatmentCode: { type: DataTypes.STRING(80), allowNull: true },
    treatmentName: { type: DataTypes.STRING(200), allowNull: true },
    treatmentCategory: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'planned' },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    duration: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    clinicianName: { type: DataTypes.STRING(120), allowNull: true },
    practitionerId: { type: DataTypes.INTEGER, allowNull: true },
    practitionerName: { type: DataTypes.STRING(120), allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    completedByPractitionerId: { type: DataTypes.INTEGER, allowNull: true },
    completedByPractitionerName: { type: DataTypes.STRING(120), allowNull: true },
    paymentPlan: { type: DataTypes.STRING(30), allowNull: true, defaultValue: 'private' },
    referrerId: { type: DataTypes.INTEGER, allowNull: true },
    referrerName: { type: DataTypes.STRING(120), allowNull: true },
    invoiceDesc: { type: DataTypes.STRING(300), allowNull: true },
    showOnInvoice: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'DiaryTreatmentPlanItems',
    timestamps: true,
    indexes: [
      { fields: ['organisationId', 'patientId'] },
      { fields: ['organisationId', 'patientId', 'appointmentId'] },
    ],
  }
)
