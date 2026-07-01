import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const ReportingBotMessage = sequelize.define(
  "reporting_bot_messages",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    senderType: {
      type: DataTypes.ENUM('user', 'ai'),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "reporting_bot_messages",
  }
);
