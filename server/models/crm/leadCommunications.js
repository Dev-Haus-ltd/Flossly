import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmLeadCommunication = sequelize.define(
  'CrmLeadCommunications',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    leadId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'CrmLeads', key: 'id' } },
    preferredContactMethod: { type: DataTypes.STRING(50), allowNull: true },
    preferredAppointmentDay: { type: DataTypes.STRING(20), allowNull: true },
    bestTimesToContact: { type: DataTypes.JSONB, allowNull: true }, // ["Morning","Afternoon",...]
  },
  { modelName: 'CrmLeadCommunications', timestamps: true }
)

