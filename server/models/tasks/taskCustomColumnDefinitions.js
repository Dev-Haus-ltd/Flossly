import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const TaskCustomColumnDefinition = sequelize.define(
  "TaskCustomColumnDefinitions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    columnName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    dataType: {
      type: DataTypes.ENUM("text", "number", "date", "boolean", "dropdown"),
      allowNull: false,
      defaultValue: "text",
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    validationRules: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    defaultValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dropdownOptions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    modelName: "TaskCustomColumnDefinitions",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["createdBy", "columnName"], 
      },
    ],
  }
);

