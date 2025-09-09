import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";
import CpdCourse from "./cpdCourse.js";

const CpdSession = sequelize.define("cpd_sessions", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  course_id: { type: DataTypes.INTEGER, allowNull: false },
  start_ts: { type: DataTypes.DATE, allowNull: false },
  end_ts: { type: DataTypes.DATE, allowNull: false },
  timezone: { type: DataTypes.STRING(64), allowNull: true }, // e.g., "Europe/London"
  location: { type: DataTypes.STRING(200), allowNull: true },
  capacity: { type: DataTypes.INTEGER, allowNull: true },
  cancelled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: "cpd_sessions", timestamps: true });

CpdSession.belongsTo(CpdCourse, { foreignKey: "course_id" });
CpdCourse.hasMany(CpdSession, { foreignKey: "course_id" });

export default CpdSession;
