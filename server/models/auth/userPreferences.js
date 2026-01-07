import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const UserPreference = sequelize.define(
  "UserPreferences",
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
    licenseType: {
      type: DataTypes.ENUM("System", "Trial", "Glide", "Soar"),
      allowNull: false,
    },
    licenseBillingCycle: {
      type: DataTypes.ENUM("Monthly", "Yearly"),
      allowNull: true,
    },
    licenseRenewalDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    taskTableColumns: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    modelName: "UserPreferences",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "organisationId"], // 🔐 one license per user per org
      },
      // {
      //   unique: true,
      //   fields: ["organisationId"],
      //   where: {
      //     licenseType: "Trial",
      //   },
      // },
    ],
  }
);
