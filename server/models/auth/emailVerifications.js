import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const EmailVerification = sequelize.define(
  "EmailVerifications",
  {
    email: { type: DataTypes.STRING, allowNull: false },
    link: { type: DataTypes.STRING, allowNull: false },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    modelName: "EmailVerifications",
    timestamps: true,
    updatedAt: true,
  }
);
