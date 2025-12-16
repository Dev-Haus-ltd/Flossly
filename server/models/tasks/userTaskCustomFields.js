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
    },
    columnDefinitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "TaskCustomColumnDefinitions",
        key: "id",
      },
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    modelName: "UserTaskCustomFields",
    timestamps: true,
  }
);

