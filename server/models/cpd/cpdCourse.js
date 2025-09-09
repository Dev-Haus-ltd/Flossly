import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

const CpdCourse = sequelize.define("cpd_courses", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  provider_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  category: { type: DataTypes.STRING(100), allowNull: false },
  credit_hours: { type: DataTypes.DECIMAL(6,2), allowNull: false, defaultValue: 1 },
  mode: { type: DataTypes.ENUM("In-Person", "eLearning", "Webinar", "Workshop"), allowNull: false, defaultValue: "eLearning" },
  is_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  thumbnail: { type: DataTypes.STRING(200), allowNull: true },
  course_objectives: { type: DataTypes.TEXT, allowNull: true },
  course_outcome: { type: DataTypes.TEXT, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
}, { tableName: "cpd_courses", timestamps: true });

export default CpdCourse;
