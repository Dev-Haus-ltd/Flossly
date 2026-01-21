import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmAutomationGroupTemplate = sequelize.define(
  'CrmAutomationGroupTemplates',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    groupId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'CrmAutomationGroups', key: 'id' } },
    templateKey: { type: DataTypes.STRING(80), allowNull: false },
    ordering: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  { modelName: 'CrmAutomationGroupTemplates', timestamps: true }
)
