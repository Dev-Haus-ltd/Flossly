import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmAutomationDictionaryTemplate = sequelize.define(
  'CrmAutomationDictionaryTemplates',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupKey: { type: DataTypes.STRING(80), allowNull: false },
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Email' }, // 'Email' | 'WhatsApp'
    name: { type: DataTypes.STRING(150), allowNull: false },
    subject: { type: DataTypes.STRING(200), allowNull: true },
    template: { type: DataTypes.TEXT, allowNull: true },
    trigger: { type: DataTypes.JSONB, allowNull: true },
    whatsappTemplateName: { type: DataTypes.STRING(150), allowNull: true },
    whatsappTemplateLanguage: { type: DataTypes.STRING(10), allowNull: true },
    ordering: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' }, // 'active' | 'archived'
  },
  { modelName: 'CrmAutomationDictionaryTemplates', timestamps: true }
)
