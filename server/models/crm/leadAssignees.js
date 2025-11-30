import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmLeadAssignee = sequelize.define(
  'CrmLeadAssignees',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    leadId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'CrmLeads', key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
  },
  { modelName: 'CrmLeadAssignees', timestamps: true }
)

