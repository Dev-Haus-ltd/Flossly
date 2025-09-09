import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

const UserCourseHistory = sequelize.define("user_course_history", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  course_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM("In Progress", "Completed", "Failed"), allowNull: false, defaultValue: "In Progress" },
  completed_date: { type: DataTypes.DATE, allowNull: true },
  total_score: { type: DataTypes.INTEGER, allowNull: true },
  obtained_score: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: "user_course_history", timestamps: true });



// CpdCourseHistory.belongsTo(CpdProvider, { foreignKey: "" });
// CpdProvider.hasMany(CpdCourse, { foreignKey: "provider_id" });

//add a link here for user courses has constraint only for completed courses

export default UserCourseHistory;
