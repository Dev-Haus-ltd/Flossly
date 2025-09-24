import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const CrmPipeline = sequelize.define(
  "CrmPipelines",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { modelName: "CrmPipelines", timestamps: true }
);


