import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const Lead = sequelize.define(
  "Leads",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Organisations",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("Open", "Won", "Lost", "Disqualified"),
      allowNull: false,
      defaultValue: "Open",
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM("Meta", "Manual", "Import", "Other"),
      allowNull: false,
    },
    meta: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  { modelName: "Leads", timestamps: true }
);
