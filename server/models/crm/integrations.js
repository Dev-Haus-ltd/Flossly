import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const MetaAppCredentials = sequelize.define(
  "MetaAppCredentials",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    appId: { type: DataTypes.STRING(200), allowNull: true },
    appSecret: { type: DataTypes.STRING(400), allowNull: true },
    pageId: { type: DataTypes.STRING(200), allowNull: true },
    pageAccessToken: { type: DataTypes.TEXT, allowNull: true },
    webhookVerifyToken: { type: DataTypes.STRING(200), allowNull: true },
    webhookSecret: { type: DataTypes.STRING(200), allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  },
  { modelName: "MetaAppCredentials", timestamps: true }
);

export const WhatsAppBusinessCredentials = sequelize.define(
  "WhatsAppBusinessCredentials",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    phoneNumberId: { type: DataTypes.STRING(200), allowNull: true },
    wabaId: { type: DataTypes.STRING(200), allowNull: true },
    businessAccountId: { type: DataTypes.STRING(200), allowNull: true },
    accessToken: { type: DataTypes.TEXT, allowNull: true },
    webhookVerifyToken: { type: DataTypes.STRING(200), allowNull: true },
    webhookSecret: { type: DataTypes.STRING(200), allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  },
  { modelName: "WhatsAppBusinessCredentials", timestamps: true }
);


