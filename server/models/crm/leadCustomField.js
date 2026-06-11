import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const LeadCustomField = sequelize.define(
  'LeadCustomFields',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'CrmLeads', key: 'id' },
      onDelete: 'CASCADE',
    },
    columnDefinitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'CrmCustomColumnDefinitions', key: 'id' },
      onDelete: 'CASCADE',
    },
    value: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    modelName: 'LeadCustomFields',
    timestamps: true,
    indexes: [{ unique: true, fields: ['leadId', 'columnDefinitionId'] }],
  }
)
