import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";
export const UserHrDocument = sequelize.define(
  "UserHrDocuments",
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
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("Recruitment", "Training", "Flossly"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Completed", "Pending"),
      allowNull: false,
      defaultValue: "Pending",
    },
    link: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    uploadedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    modelName: "UserHrDocuments",
    timestamps: true,
  }
);
