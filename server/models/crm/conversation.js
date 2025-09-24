import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const CrmConversation = sequelize.define(
  "CrmConversations",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    channel: { type: DataTypes.ENUM("WhatsApp", "Messenger"), allowNull: false },
    externalContactId: { type: DataTypes.STRING(200), allowNull: true },
    contactId: { type: DataTypes.INTEGER, allowNull: true },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM("Open", "Pending", "Resolved"), allowNull: false, defaultValue: "Open" },
    meta: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  },
  { modelName: "CrmConversations", timestamps: true }
);


