import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmAutomationTemplate = sequelize.define(
  'CrmAutomationTemplates',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    key: { type: DataTypes.STRING(50), allowNull: false }, // welcome_email | birthday | followup | inactive_lead
    type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Email' },
    name: { type: DataTypes.STRING(150), allowNull: false },
    subject: { type: DataTypes.STRING(200), allowNull: true },
    sending: { type: DataTypes.STRING(100), allowNull: false },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    template: { type: DataTypes.TEXT, allowNull: true },
  },
  { modelName: 'CrmAutomationTemplates', timestamps: true }
)

