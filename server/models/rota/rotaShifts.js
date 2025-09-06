import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const RotaShift = sequelize.define(
  "RotaShifts",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rotaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Rota",
        key: "id",
      },
    },
    dentistId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    nurseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    surgeryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "OrganisationSurgeries",
        key: "id",
      },
    },
    label: { type: DataTypes.STRING, allowNull: false },
    color: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    breakTime: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "RotaShifts", timestamps: true }
);
