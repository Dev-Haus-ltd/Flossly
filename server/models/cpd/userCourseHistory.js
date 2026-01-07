import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const UserCourseHistory = sequelize.define(
  "UserCourseHistory",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Courses",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("In Progress", "Completed", "Failed"),
      allowNull: false,
      defaultValue: "In Progress",
    },
    completedDate: { type: DataTypes.DATE, allowNull: true },
    totalScore: { type: DataTypes.INTEGER, allowNull: true },
    obtainedScore: { type: DataTypes.INTEGER, allowNull: true },
    credits: { type: DataTypes.INTEGER, allowNull: true },
  },
  { modelName: "UserCourseHistory", timestamps: true }
);
