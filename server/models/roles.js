import { DataTypes } from "sequelize";
import sequelize  from "../utils/db";

export const Role = sequelize.define(
  "Roles",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    roleType: {
      type: DataTypes.ENUM('Clinical', 'Clinical Support', 'Operational & Admin', 'Business & Marketing', 'Back Office / External','Consultant / Ambassador'),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  },
  {
    modelName: "Roles",
    timestamps: true,
  }
);