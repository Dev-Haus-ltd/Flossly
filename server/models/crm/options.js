import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

// Generic CRM option table to store selectable values per organisation
// category examples: 'lead_source', 'treatment', 'lead_status'
export const CrmOption = sequelize.define(
  'CrmOptions',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    category: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    color: { type: DataTypes.STRING(20), allowNull: true }, // only used for lead_status pills etc
    ordering: { type: DataTypes.INTEGER, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { modelName: 'CrmOptions', timestamps: true }
)

