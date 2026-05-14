import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmLeadTreatment = sequelize.define(
  'CrmLeadTreatments',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    leadId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'CrmLeads', key: 'id' } },
    primaryTreatment: { type: DataTypes.INTEGER, allowNull: true },
    primaryTreatmentPrice: { type: DataTypes.DECIMAL(10,2), allowNull: true, defaultValue: 0 },
    secondaryTreatments: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    secondaryTreatmentPrices: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    concerns: { type: DataTypes.INTEGER, allowNull: true },
    treatmentAreas: { type: DataTypes.INTEGER, allowNull: true },
    previousExperience: { type: DataTypes.TEXT, allowNull: true },
    budget: { type: DataTypes.STRING(100), allowNull: true },
    specialOccasion: { type: DataTypes.STRING(200), allowNull: true },
  },
  { modelName: 'CrmLeadTreatments', timestamps: true }
)

