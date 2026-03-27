import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const CrmWhatsAppMessageLog = sequelize.define(
  "CrmWhatsAppMessageLogs",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Organisations", key: "id" },
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "CrmLeads", key: "id" },
    },
    to: { type: DataTypes.STRING(32), allowNull: true },
    direction: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "outbound" },
    type: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "text" },
    templateName: { type: DataTypes.STRING(150), allowNull: true },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "sent" },
    providerMessageId: { type: DataTypes.STRING(128), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    attachments: { type: DataTypes.JSONB, allowNull: true },
    error: { type: DataTypes.TEXT, allowNull: true },
  },
  { modelName: "CrmWhatsAppMessageLogs", timestamps: true }
);
