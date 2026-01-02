import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const UserTaskAttachment = sequelize.define(
  "UserTaskAttachments",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userTaskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "UserTasks",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key:"id"
      }
    },
  },
  {
    modelName: "UserTaskAttachments",
    timestamps: true,
  }
);
