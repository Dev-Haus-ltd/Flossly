import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const CrmDmConversation = sequelize.define(
  "CrmDmConversations",
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
    platform: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    accountId: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    threadId: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    participantName: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    participantAvatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    autoReplyEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    autoReplyDisabledUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    modelName: "CrmDmConversations",
    timestamps: true,
    indexes: [
      { fields: ["organisationId", "platform"] },
      { unique: true, fields: ["organisationId", "platform", "threadId"] },
    ],
  }
);
