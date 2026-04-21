import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmAutomationDictionaryGroup = sequelize.define(
  'CrmAutomationDictionaryGroups',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    category: { type: DataTypes.STRING(80), allowNull: true }, // 'manual' | 'enquiry' | 'birthday' | 'seasonal'
    ordering: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' }, // 'active' | 'archived'
  },
  { modelName: 'CrmAutomationDictionaryGroups', timestamps: true }
)
