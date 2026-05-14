import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const ConsentFormTemplate = sequelize.define(
  'ConsentFormTemplates',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    scope: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'organisation',
      comment: "'system' templates are seeded globally; 'organisation' templates belong to one org",
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Unique identifier for system-scoped templates (e.g. crown_consent)',
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Organisations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    htmlContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'HTML template content for the consent form',
    },
    signatureCoordinates: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Retained for PDF signature placement workflows: { x: number, y: number, width: number, height: number, page: number }. HTML consent forms should render signature capture below the document instead of using these coordinates.',
    },
    initialCoordinates: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Optional initial placement coordinates for patient initials',
    },
    dateCoordinates: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Optional date stamp placement coordinates',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Category of consent form (e.g., "Orthodontics", "Implants", "Cosmetic")',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'ConsentFormTemplates',
    timestamps: true,
    indexes: [
      { fields: ['organisationId'], name: 'idx_consent_templates_org' },
      { fields: ['isActive'], name: 'idx_consent_templates_active' },
      { fields: ['category'], name: 'idx_consent_templates_category' },
      { fields: ['scope'], name: 'idx_consent_templates_scope' },
    ],
  }
)
