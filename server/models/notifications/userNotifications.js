import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const UserNotification = sequelize.define(
  "UserNotifications",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      defaultValue: "medium",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fcmMessageId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    modelName: "UserNotifications",
    timestamps: true,
  }
)
