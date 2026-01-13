import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const OnboardingEvent = sequelize.define(
  "OnboardingEvents",
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
    key: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    modelName: "OnboardingEvents",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "organisationId", "key"],
      },
    ],
  }
);
