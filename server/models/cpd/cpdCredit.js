import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";
// import User from "../User.js"

const CpdCredit = sequelize.define("cpd_credits", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  period_start: { type: DataTypes.DATEONLY, allowNull: false },
  period_end: { type: DataTypes.DATEONLY, allowNull: false },
  category: { type: DataTypes.STRING(100), allowNull: false },
  hours_awarded: { type: DataTypes.DECIMAL(6,2), allowNull: false, defaultValue: 0 },
  source_type: { type: DataTypes.ENUM("Enrollment", "Activity", "Manual"), allowNull: false, defaultValue: "Enrollment" },
  source_id: { type: DataTypes.INTEGER, allowNull: true }, // points to enrollment/activity
}, { tableName: "cpd_credits", timestamps: true });

// Associate to User; optionals to Enrollment/Activity in associations file
export default CpdCredit;
