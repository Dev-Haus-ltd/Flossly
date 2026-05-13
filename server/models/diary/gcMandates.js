import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const GCMandate = sequelize.define(
  'GCMandates',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },

    mandateId: { type: DataTypes.STRING(50), allowNull: true },
    customerId: { type: DataTypes.STRING(50), allowNull: false },
    billingRequestId: { type: DataTypes.STRING(50), allowNull: true },

    // pending_submission | submitted | active | failed | cancelled | expired
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending_submission' },

    scheme: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'bacs' },
    reference: { type: DataTypes.STRING(100), allowNull: true },

    // Customer details at time of creation
    customerEmail: { type: DataTypes.STRING(255), allowNull: true },
    customerName: { type: DataTypes.STRING(255), allowNull: true },

    // Metadata for tracking
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    tableName: 'GCMandates',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['mandateId'] },
      { unique: true, fields: ['organisationId', 'patientId', 'mandateId'] },
      { fields: ['organisationId', 'patientId'] },
      { fields: ['organisationId', 'status'] },
      { fields: ['customerId'] },
      { fields: ['billingRequestId'] },
    ],
  }
)