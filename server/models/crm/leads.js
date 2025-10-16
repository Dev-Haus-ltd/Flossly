import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmLead = sequelize.define(
  'CrmLeads',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    pageId: { type: DataTypes.STRING(50), allowNull: true },
    formId: { type: DataTypes.STRING(50), allowNull: true },
    leadId: { type: DataTypes.STRING(100), allowNull: true },
    name: { type: DataTypes.STRING(200), allowNull: true },
    email: { type: DataTypes.STRING(200), allowNull: true },
    telephone: { type: DataTypes.STRING(100), allowNull: true },
    inquiryDate: { type: DataTypes.DATE, allowNull: true },
    rawData: { type: DataTypes.JSONB, allowNull: true },
    leadSource: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'Meta Leadgen' },
    leadStatus: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'New' },
  },
  { modelName: 'CrmLeads', timestamps: true }
)

