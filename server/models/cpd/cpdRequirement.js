import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";
import CpdFramework from "./cpdFramework.js";
// import { Role } from "../Role.js" // You already have Role; associate in associations file.

const CpdRequirement = sequelize.define("cpd_requirements", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  framework_id: { type: DataTypes.INTEGER, allowNull: false },
  role_id: { type: DataTypes.INTEGER, allowNull: true }, // tie requirement to role, optional
  category: {
    type: DataTypes.ENUM("All","Dentist Courses", "Nurse Courses", "Reptionist Courses", "Practice Management Courses"),
    allowNull: false,
    defaultValue: "All",
  },
  min_hours: { type: DataTypes.DECIMAL(6,2), allowNull: false, defaultValue: 0 },
  max_hours: { type: DataTypes.DECIMAL(6,2), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  period_months: { type: DataTypes.INTEGER, allowNull: true }, // override framework period if needed
}, { tableName: "cpd_requirements", timestamps: true });

CpdRequirement.belongsTo(CpdFramework, { foreignKey: "framework_id" });
// Role association wired in associations file

export default CpdRequirement;
