import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const UserContract = sequelize.define(
  "UserContracts",
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
      allowNull: false,
      references: {
        model: "Organisations",
        key: "id",
      },
    },
    contractType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    contractStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    weeklyHours: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    salaryPerHour: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    probEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    holidaysEntitled: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    holidaysCashBack: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    holidaysEntitledUnit: {
      type: DataTypes.ENUM("Hour", "Day"),
      allowNull: true,
      defaultValue: "Day",
    },
    holidayAllowedAfterDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pensionEligible: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    payrolNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    paymentFrequency: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    paymentStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reportsTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    modelName: "UserContracts",
    timestamps: true,
  }
);
