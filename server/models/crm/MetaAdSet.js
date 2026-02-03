import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaAdSet = sequelize.define(
  'MetaAdSets',
  {
    adSetId: { type: DataTypes.STRING(50), primaryKey: true },

    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Organisations', key: 'id' },
    },

    campaignId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: { model: 'MetaCampaigns', key: 'campaignId' },
    },

    name: { type: DataTypes.STRING(200), allowNull: true },

    // Budgets (minor units)
    dailyBudget: { type: DataTypes.INTEGER, allowNull: true },
    lifetimeBudget: { type: DataTypes.INTEGER, allowNull: true },

    optimizationGoal: { type: DataTypes.STRING(100), allowNull: true },
  },
  { modelName: 'MetaAdSets', timestamps: true }
)
