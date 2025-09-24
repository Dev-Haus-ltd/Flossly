import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const CrmPipelineStage = sequelize.define(
  "CrmPipelineStages",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    pipelineId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    probability: { type: DataTypes.INTEGER, allowNull: true },
  },
  { modelName: "CrmPipelineStages", timestamps: true }
);


