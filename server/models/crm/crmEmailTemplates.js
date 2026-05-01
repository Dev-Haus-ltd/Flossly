import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const CrmEmailTemplate = sequelize.define(
  'CrmEmailTemplates',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    key: { type: DataTypes.STRING(80), allowNull: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    subject: { type: DataTypes.STRING(200), allowNull: true },
    template: { type: DataTypes.TEXT, allowNull: true },
    renderMode: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'wrapped' },
    category: { type: DataTypes.STRING(50), allowNull: true },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' } },
  },
  { modelName: 'CrmEmailTemplates', timestamps: true }
)
