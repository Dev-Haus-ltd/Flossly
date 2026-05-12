import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const OrganisationSmtp = sequelize.define(
  "OrganisationSmtp",
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
        model: 'Organisations',
        key: 'id'
      }
    },
    host: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    secure: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fromEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fromName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: true,
      defaultValue: "Active",
    },
  },
  {
    modelName: "OrganisationSmtp",
    timestamps: true,
  }
);
