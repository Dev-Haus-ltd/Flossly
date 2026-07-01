import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmCustomColumnDefinition = sequelize.define(
  'CrmCustomColumnDefinitions',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Organisations', key: 'id' },
    },
    columnName: { type: DataTypes.STRING(100), allowNull: false },
    displayName: { type: DataTypes.STRING(150), allowNull: false },
    dataType: {
      type: DataTypes.ENUM('text', 'number', 'date', 'boolean', 'dropdown'),
      allowNull: false,
      defaultValue: 'text',
    },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    dropdownOptions: { type: DataTypes.JSON, allowNull: true },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
  },
  {
    modelName: 'CrmCustomColumnDefinitions',
    timestamps: true,
    indexes: [{ unique: true, fields: ['organisationId', 'columnName'] }],
  }
)
