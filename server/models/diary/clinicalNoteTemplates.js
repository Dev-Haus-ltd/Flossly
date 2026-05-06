import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const ClinicalNoteTemplate = sequelize.define(
  'ClinicalNoteTemplates',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    scope: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'organisation' },
    organisationId: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.STRING(40), allowNull: false },
    category: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'user' },
    key: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
    sourceTemplateId: { type: DataTypes.INTEGER, allowNull: true },
    currentVersionId: { type: DataTypes.INTEGER, allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'ClinicalNoteTemplates',
    timestamps: true,
    indexes: [
      { fields: ['scope', 'type', 'status'] },
      { fields: ['organisationId', 'type', 'status'] },
      { fields: ['scope', 'key'] },
      { fields: ['organisationId', 'key'] },
    ],
  }
)
