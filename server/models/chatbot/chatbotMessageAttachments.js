import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const ChatbotMessageAttachment = sequelize.define(
  "support_chatbot_message_attachments",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      messageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "For easier querying of all attachments in a conversation",
      },
      uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      originalFileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Original filename as uploaded by user",
      },
      filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "File size in bytes",
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "e.g., image/png, application/pdf, video/mp4, etc.",
      },
      fileExtension: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "e.g., .png, .pdf, .docx, .xlsx, .mp4",
      },
      fileCategory: {
        type: DataTypes.ENUM('image', 'document', 'video', 'audio', 'archive', 'other'),
        allowNull: false,
        comment: "Categorized for easier filtering and display",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Store additional metadata like image dimensions, video duration, document pages, etc.",
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "support_chatbot_message_attachments",
    }
  );
