import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const CrmDmMessage = sequelize.define(
  "CrmDmMessages",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Organisations", key: "id" },
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "CrmDmConversations", key: "id" },
    },
    platform: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    platformMessageId: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    direction: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "inbound",
    },
    senderName: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    modelName: "CrmDmMessages",
    timestamps: true,
    indexes: [
      { fields: ["organisationId", "conversationId"] },
      { fields: ["organisationId", "platform"] },
    ],
  }
);
