import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";
import CpdSession from "./cpdSession.js";
// import User from "../User.js" // TODO: import your actual User model

const CpdEnrollment = sequelize.define("cpd_enrollments", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  session_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM("Requested", "Approved", "Rejected", "Attended", "Cancelled"),
    allowNull: false,
    defaultValue: "Requested",
  },
  cost_paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: "cpd_enrollments", timestamps: true });

CpdEnrollment.belongsTo(CpdSession, { foreignKey: "session_id" });
CpdSession.hasMany(CpdEnrollment, { foreignKey: "session_id" });

// Hook up to your User model in associations file
export default CpdEnrollment;
