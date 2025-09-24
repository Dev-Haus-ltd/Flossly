import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const CrmLead = sequelize.define(
  "CrmLeads",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    contactId: { type: DataTypes.INTEGER, allowNull: false },
    ownerUserId: { type: DataTypes.INTEGER, allowNull: true },
    pipelineId: { type: DataTypes.INTEGER, allowNull: false },
    stageId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("Open", "Won", "Lost", "Disqualified"),
      allowNull: false,
      defaultValue: "Open",
    },
    value: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    currency: { type: DataTypes.STRING(10), allowNull: true, defaultValue: "GBP" },
    meta: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  },
  { modelName: "CrmLeads", timestamps: true }
);


