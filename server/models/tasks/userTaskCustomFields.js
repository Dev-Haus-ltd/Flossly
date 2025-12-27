import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const UserTaskCustomField = sequelize.define(
  "UserTaskCustomFields",
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
    columnDefinitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "TaskCustomColumnDefinitions",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    modelName: "UserTaskCustomFields",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userTaskId", "columnDefinitionId"], 
      },
    ],
  }
);

