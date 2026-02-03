import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaCampaign = sequelize.define(
  'MetaCampaigns',
  {
    campaignId: { type: DataTypes.STRING(50), primaryKey: true },

    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Organisations', key: 'id' },
    },

    adAccountId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: { model: 'MetaAdAccounts', key: 'adAccountId' },
    },

    name: { type: DataTypes.STRING(200), allowNull: true },
    status: { type: DataTypes.STRING(50), allowNull: true },

    // Budgets (minor units)
    dailyBudget: { type: DataTypes.INTEGER, allowNull: true },
    lifetimeBudget: { type: DataTypes.INTEGER, allowNull: true },
  },
  { modelName: 'MetaCampaigns', timestamps: true }
)
