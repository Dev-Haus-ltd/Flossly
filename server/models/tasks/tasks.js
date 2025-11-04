import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const Task = sequelize.define(
  "Tasks",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: "TaskCategories",
        key: "id",
      },
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Roles",
        key: "id",
      },
      allowNull: true,
    },
    defaultFrequency: {
      type: DataTypes.ENUM(
        "Daily",
        "Weekly",
        "Biweekly",
        "Monthly",
        "Quarterly",
        "Yearly",
        "Ad Hoc"
      ),
      allowNull: true,
    },
  },
  {
    modelName: "Tasks",
    timestamps: true,
  }
);

