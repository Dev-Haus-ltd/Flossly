import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const UserOrganisation = sequelize.define(
  "UserOrganisations",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Organisations",
        key: "id",
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // Existing records will be active
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Active", "Disabled", "Invited", "Expired"),
      allowNull: false,
      defaultValue: "Active",
    },
  },
  {
    modelName: "UserOrganisations",
    timestamps: true,
  }
);