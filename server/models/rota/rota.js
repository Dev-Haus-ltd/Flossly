import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const Rota = sequelize.define(
  "Rota",
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
    name: { type: DataTypes.STRING, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    duration: { type: DataTypes.INTEGER },
    isPublished: { type: DataTypes.BOOLEAN, defaultValue: false },
    publishedDate: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "Rota", timestamps: true }
);
