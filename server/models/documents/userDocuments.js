import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";
export const UserDocument = sequelize.define(
  "UserDocuments",
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
    name: {
      type: DataTypes.STRING(50),
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
        model: "UserDocumentFolders",
        key: "id",
      },
    },
    lastViewedOn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    modelName: "UserDocuments",
    timestamps: true,
  }
);
