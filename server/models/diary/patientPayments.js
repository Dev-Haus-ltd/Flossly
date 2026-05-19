import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const PatientPayment = sequelize.define(
  'PatientPayments',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    paymentNumber: { type: DataTypes.STRING(20), allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false },
    // cash | card | bank_transfer | cheque | finance | other
    method: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'cash' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    unallocated: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    reference: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    takenByUserId: { type: DataTypes.INTEGER, allowNull: true },
    takenByName: { type: DataTypes.STRING(120), allowNull: true },
    practitionerId: { type: DataTypes.INTEGER, allowNull: true },
    practitionerName: { type: DataTypes.STRING(120), allowNull: true },
  },
  {
    tableName: 'PatientPayments',
    timestamps: true,
    indexes: [
      { fields: ['organisationId', 'patientId'] },
      { unique: true, fields: ['organisationId', 'paymentNumber'] },
    ],
  }
)
