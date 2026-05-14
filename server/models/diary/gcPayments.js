import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const GCPayment = sequelize.define(
  "GCPayments",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceId: { type: DataTypes.INTEGER, allowNull: true },

    paymentId: { type: DataTypes.STRING(50), allowNull: false },
    mandateId: { type: DataTypes.STRING(50), allowNull: false },
    gcMandateDbId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "GCMandates",
        key: "id",
      },
    },
    // created | submitted | confirmed | paid_out | failed | cancelled | charged_back
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "created",
    },

    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "GBP",
    },

    description: { type: DataTypes.STRING(255), allowNull: true },
    reference: { type: DataTypes.STRING(100), allowNull: true },

    chargeDate: { type: DataTypes.DATEONLY, allowNull: true },
    processedAt: { type: DataTypes.DATE, allowNull: true },

    // Retry tracking
    retryCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    maxRetries: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
    lastRetryAt: { type: DataTypes.DATE, allowNull: true },

    // Failure tracking
    failureReason: { type: DataTypes.TEXT, allowNull: true },
    failureCode: { type: DataTypes.STRING(50), allowNull: true },

    // Webhook tracking
    webhookEvents: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    lastWebhookAt: { type: DataTypes.DATE, allowNull: true },

    // Metadata
    metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },

    // Accounting sync tracking
    accountingSynced: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    patientPaymentId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "GCPayments",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["paymentId"] },
      { unique: true, fields: ["organisationId", "patientId", "paymentId"] },
      { fields: ["organisationId", "patientId"] },
      { fields: ["organisationId", "status"] },
      { fields: ["mandateId"] },
      { fields: ["invoiceId"] },
      { fields: ["accountingSynced"] },
      { fields: ["chargeDate"] },
    ],
  },
);
