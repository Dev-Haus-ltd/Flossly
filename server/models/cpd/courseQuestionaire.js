import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

const CpdCourseQuestionaire = sequelize.define("cpd_courses_questionaire", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  course_id: { type: DataTypes.INTEGER, allowNull: false },
  questionaire: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  correct_answers: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  options: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
}, { tableName: "cpd_courses_questionaire", timestamps: true });

export default CpdCourseQuestionaire;