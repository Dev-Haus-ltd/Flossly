import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const PatientInvoice = sequelize.define(
  'PatientInvoices',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceNumber: { type: DataTypes.STRING(20), allowNull: false },
    invoiceDate: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    // unpaid | part_paid | paid | written_off | credited | draft
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'unpaid' },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    amountPaid: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    practitionerId: { type: DataTypes.INTEGER, allowNull: true },
    practitionerName: { type: DataTypes.STRING(120), allowNull: true },
    appointmentId: { type: DataTypes.INTEGER, allowNull: true },
    appointmentGroupId: { type: DataTypes.STRING(80), allowNull: true },
    planId: { type: DataTypes.STRING(80), allowNull: true },
    planName: { type: DataTypes.STRING(160), allowNull: true },
    createdByUserId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'PatientInvoices',
    timestamps: true,
    indexes: [
      { fields: ['organisationId', 'patientId'] },
      { unique: true, fields: ['organisationId', 'invoiceNumber'] },
    ],
  }
)
