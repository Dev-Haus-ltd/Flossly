import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const GCWebhookLog = sequelize.define(
  'GCWebhookLogs',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    webhookId: { type: DataTypes.STRING(100), allowNull: true },
    signature: { type: DataTypes.STRING(255), allowNull: true },

    // Raw webhook payload
    payload: { type: DataTypes.JSONB, allowNull: false },

    // Processing status
    processed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    processedAt: { type: DataTypes.DATE, allowNull: true },
    processingError: { type: DataTypes.TEXT, allowNull: true },

    // Event details
    eventCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    eventsProcessed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // Idempotency
    idempotencyKey: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: 'GCWebhookLogs',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['webhookId'] },
      { unique: true, fields: ['idempotencyKey'] },
      { fields: ['processed'] },
      { fields: ['createdAt'] },
    ],
  }
)