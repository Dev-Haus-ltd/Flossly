import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

const CpdFramework = sequelize.define("cpd_frameworks", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  regulator: { type: DataTypes.STRING(120), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  period_months: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
}, { tableName: "cpd_frameworks", timestamps: true });

export default CpdFramework;
