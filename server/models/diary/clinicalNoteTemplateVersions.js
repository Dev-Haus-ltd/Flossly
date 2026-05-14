import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const ClinicalNoteTemplateVersion = sequelize.define(
  'ClinicalNoteTemplateVersions',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    templateId: { type: DataTypes.INTEGER, allowNull: false },
    versionNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    content: { type: DataTypes.TEXT, allowNull: false },
    changeNote: { type: DataTypes.STRING(255), allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'ClinicalNoteTemplateVersions',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['templateId', 'versionNumber'], unique: true },
      { fields: ['templateId', 'createdAt'] },
    ],
  }
)
