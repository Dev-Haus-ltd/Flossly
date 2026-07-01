import { DataTypes } from "sequelize";
import sequelize  from "../../utils/db";
export const SystemDocumentFolder = sequelize.define(
  "SystemDocumentFolders",
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
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    modelName: "SystemDocumentFolders",
    timestamps: true,
  }
);
