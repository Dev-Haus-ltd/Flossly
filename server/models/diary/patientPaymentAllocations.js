import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const PatientPaymentAllocation = sequelize.define(
  'PatientPaymentAllocations',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    paymentId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'PatientPaymentAllocations',
    timestamps: true,
    indexes: [
      { fields: ['organisationId', 'patientId'] },
      { fields: ['paymentId'] },
      { fields: ['invoiceId'] },
    ],
  }
)
