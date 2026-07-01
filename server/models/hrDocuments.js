import { DataTypes } from "sequelize";
import sequelize  from "../utils/db";
export const HrDocument = sequelize.define(
  "HrDocuments",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Recruitment', 'Training', 'Flossly'),
      allowNull: false,
    },
  },
  {
    modelName: "HrDocuments",
    timestamps: true,
  }
);
