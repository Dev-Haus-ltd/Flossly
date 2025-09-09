import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

const CpdProvider = sequelize.define("cpd_providers", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  type: { type: DataTypes.ENUM("Internal", "External"), allowNull: false, defaultValue: "Internal" },
  url: { type: DataTypes.STRING(255), allowNull: true },
  contact_email: { type: DataTypes.STRING(160), allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
}, { tableName: "cpd_providers", timestamps: true });

export default CpdProvider;
