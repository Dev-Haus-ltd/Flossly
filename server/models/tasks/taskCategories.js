import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const TaskCategory = sequelize.define(
  "TaskCategories",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'TaskCategories',
        key: "id"
      }
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Organisations',
        key: 'id'
      }
    }
  },
  {
    modelName: "TaskCategories",
    timestamps: true,
  }
);
