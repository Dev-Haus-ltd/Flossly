import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const PatientAutomationDictionary = sequelize.define(
  'PatientAutomationDictionary',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    itemCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    image: { type: DataTypes.STRING(255), allowNull: true },
    templates: { type: DataTypes.JSONB, allowNull: true }, // default rows for this automation
  },
  { tableName: 'PatientAutomationDictionary', timestamps: true }
)
