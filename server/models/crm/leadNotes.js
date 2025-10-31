import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmLeadNote = sequelize.define(
  'CrmLeadNotes',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    leadId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'CrmLeads', key: 'id' } },
    title: { type: DataTypes.STRING(200), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.STRING(20), allowNull: false },
    channel: { type: DataTypes.STRING(50), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
  },
  { modelName: 'CrmLeadNotes', timestamps: true }
)

