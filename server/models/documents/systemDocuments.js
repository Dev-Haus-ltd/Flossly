import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";
export const SystemDocument = sequelize.define(
  "SystemDocuments",
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
    link: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tags: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "TaskCategories",
        key: "id",
      },
    },
    folderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "SystemDocumentFolders",
        key: "id",
      },
    },
    lastViewedOn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    modelName: "SystemDocuments",
    timestamps: true,
  }
);
