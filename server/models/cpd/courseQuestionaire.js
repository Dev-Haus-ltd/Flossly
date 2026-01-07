import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const CourseQuestionaire = sequelize.define(
  "CourseQuestionaire",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Courses",
        key: "id",
      },
    },
    question: { type: DataTypes.TEXT, allowNull: false },
    correctAnswer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    optionA: { type: DataTypes.TEXT, allowNull: true },
    optionB: { type: DataTypes.TEXT, allowNull: true },
    optionC: { type: DataTypes.TEXT, allowNull: true },
    optionD: { type: DataTypes.TEXT, allowNull: true },
  },
  { modelName: "CourseQuestionaire", timestamps: true }
);
