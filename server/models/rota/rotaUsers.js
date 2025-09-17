import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const RotaUser = sequelize.define(
  "RotaUsers",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rotaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Rota",
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
    isTempUser: { type: DataTypes.BOOLEAN, allowNull: true },
    tempUserName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tempUserRoleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Roles",
        key: "id",
      },
    },
  },
  { tableName: "RotaUsers", timestamps: true }
);
