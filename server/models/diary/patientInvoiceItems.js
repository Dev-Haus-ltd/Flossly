import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const PatientInvoiceItem = sequelize.define(
  'PatientInvoiceItems',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceId: { type: DataTypes.INTEGER, allowNull: false },
    treatmentPlanItemId: { type: DataTypes.INTEGER, allowNull: true },
    description: { type: DataTypes.STRING(300), allowNull: false, defaultValue: '' },
    quantity: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 1 },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    fdi: { type: DataTypes.INTEGER, allowNull: true },
    surface: { type: DataTypes.STRING(40), allowNull: true },
    treatmentCode: { type: DataTypes.STRING(80), allowNull: true },
    practitionerId: { type: DataTypes.INTEGER, allowNull: true },
    practitionerName: { type: DataTypes.STRING(120), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'PatientInvoiceItems',
    timestamps: true,
    indexes: [
      { fields: ['organisationId', 'patientId'] },
      { fields: ['invoiceId'] },
      { fields: ['treatmentPlanItemId'] },
    ],
  }
)
