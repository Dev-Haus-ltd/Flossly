import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const OrganisationScript = sequelize.define(
  "OrganisationScripts",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Organisations",
        key: "id",
      },
    },
    scriptKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    modelName: "OrganisationScripts",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["organisationId", "scriptKey"],
      },
    ],
  }
);

