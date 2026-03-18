import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaAdSet = sequelize.define(
  'MetaAdSets',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    campaignId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    adSetId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    name: { type: DataTypes.STRING(200), allowNull: true },

    // Budgets (minor units)
    dailyBudget: { type: DataTypes.INTEGER, allowNull: true },
    lifetimeBudget: { type: DataTypes.INTEGER, allowNull: true },

    optimizationGoal: { type: DataTypes.STRING(100), allowNull: true },
  },
  {
    modelName: 'MetaAdSets',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['adSetId', 'organisationId'] },
      { fields: ['organisationId'] },
      { fields: ['campaignId'] },
    ],
  }
)
