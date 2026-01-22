import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmAutomationGroup = sequelize.define(
  'CrmAutomationGroups',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    key: { type: DataTypes.STRING(80), allowNull: false },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ordering: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  { modelName: 'CrmAutomationGroups', timestamps: true }
)
