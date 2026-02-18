import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const ChatbotMessage = sequelize.define(
  "support_chatbot_messages",
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
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Null for bot/AI messages, user ID for human messages",
      },
      senderType: {
        type: DataTypes.ENUM('user', 'support', 'ai', 'bot'),
        allowNull: false,
        comment: "user = end user, support = developer/admin, ai = AI response, bot = automated bot response",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Store additional data like AI model used, confidence score, etc.",
      },
    },
    {
      timestamps: true,
      tableName: "support_chatbot_messages",
    }
  );
