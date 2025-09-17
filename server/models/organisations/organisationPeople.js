import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const OrganisationPeople = sequelize.define(
  "OrganisationPeople",
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
        key: "id"
      }
    },
    safeguardingLead: {
        type: DataTypes.STRING,
        allowNull: true
    },
    crossInfectionLead: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fireMarshal: {
        type: DataTypes.STRING,
        allowNull: true
    },
    firstAider: {
        type: DataTypes.STRING,
        allowNull: true
    },
    complaintsHandler: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dpo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rpa: {
        type: DataTypes.STRING,
        allowNull: true
    }
  },
  {
    modelName: "OrganisationPeople",
    timestamps: true,
  }
);
