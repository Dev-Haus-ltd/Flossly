import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaCampaign = sequelize.define(
  'MetaCampaigns',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    adAccountId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    campaignId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    name: { type: DataTypes.STRING(200), allowNull: true },
    status: { type: DataTypes.STRING(50), allowNull: true },

    // Budgets (minor units)
    dailyBudget: { type: DataTypes.INTEGER, allowNull: true },
    lifetimeBudget: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    modelName: 'MetaCampaigns',
    timestamps: true,
    indexes: [
      // Composite unique: one campaign per org (safe even if two orgs share an ad account)
      { unique: true, fields: ['campaignId', 'organisationId'] },
      { fields: ['organisationId'] },
    ],
  }
)
