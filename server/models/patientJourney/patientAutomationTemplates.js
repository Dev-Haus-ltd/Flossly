import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const PatientAutomationTemplate = sequelize.define(
  'PatientAutomationTemplates',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: true },
    groupKey: { type: DataTypes.STRING(80), allowNull: false },
    key: { type: DataTypes.STRING(80), allowNull: false },
    type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Email' },
    name: { type: DataTypes.STRING(150), allowNull: false },
    sending: { type: DataTypes.STRING(120), allowNull: false },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    template: { type: DataTypes.TEXT, allowNull: true },
    roleName: { type: DataTypes.STRING(120), allowNull: true },
  },
  { tableName: 'PatientAutomationTemplates', timestamps: true }
)
