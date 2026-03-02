import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const TaskChecklist = sequelize.define(
  "TaskChecklists",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Tasks",
        key: "id",
      },
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fieldOneTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fieldOneValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fieldTwoTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fieldTwoValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    showRadio: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    showTime: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    showDate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    radioValue: {
      type: DataTypes.ENUM("Yes", "No", "N/A"),
      defaultValue: "N/A",
      allowNull: false,
    },
    timeValue: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    dateValue: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    modelName: "TaskChecklists",
    timestamps: true,
  }
);
