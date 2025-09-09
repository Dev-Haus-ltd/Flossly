import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";
// import User from "../User.js"

const CpdActivity = sequelize.define("cpd_activities", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  category: { type: DataTypes.STRING(100), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  hours: { type: DataTypes.DECIMAL(6,2), allowNull: false, defaultValue: 1 },
  source: { type: DataTypes.ENUM("External", "Reading", "Conference", "Webinar", "Other"), allowNull: false, defaultValue: "External" },
  status: { type: DataTypes.ENUM("Pending", "Approved", "Rejected"), allowNull: false, defaultValue: "Pending" },
  evidence_url: { type: DataTypes.STRING(300), allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
}, { tableName: "cpd_activities", timestamps: true });

// Associate to User in associations file
export default CpdActivity;
