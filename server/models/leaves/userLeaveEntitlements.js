import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";
export const UserLeaveEntitlement = sequelize.define(
  "UserLeaveEntitlements",
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
        key: "id"
      }
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Organisations",
        key: "id"
      }
    },
    allowedAnnualLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 14
    },
    takenAnnualLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    allowedCasualLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10
    },
    takenCasualLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    allowedSickLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10
    },
    takenSickLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    allowedCompationateLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 5
    },
    takenCompationateLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    allowedOtherLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 5,
    },
    takenOtherLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    modelName: "UserLeaveEntitlements",
    timestamps: true,
  }
);
