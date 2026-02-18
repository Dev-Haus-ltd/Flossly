import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const ChatbotConversation = sequelize.define(
  "support_chatbot_conversations",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      organisationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      conversationType: {
        type: DataTypes.ENUM('ask-question', 'report-issue', 'request-feature'),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active',
        allowNull: false,
        validate: {
          isIn: [['active', 'in-progress', 'resolved', 'closed']]
        }
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Store additional metadata like browser info, page URL, etc.",
      },
    },
    {
      timestamps: true,
      tableName: "support_chatbot_conversations",
    }
  );
