import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const CrmMessage = sequelize.define(
  "CrmMessages",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    conversationId: { type: DataTypes.INTEGER, allowNull: false },
    direction: { type: DataTypes.ENUM("Inbound", "Outbound"), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    mediaUrl: { type: DataTypes.TEXT, allowNull: true },
    templateName: { type: DataTypes.STRING(200), allowNull: true },
    status: { type: DataTypes.ENUM("Queued", "Sent", "Delivered", "Read", "Failed"), allowNull: false, defaultValue: "Queued" },
    externalMessageId: { type: DataTypes.STRING(200), allowNull: true },
    error: { type: DataTypes.TEXT, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  },
  { modelName: "CrmMessages", timestamps: true }
);


