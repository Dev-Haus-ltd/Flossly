import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaInsight = sequelize.define(
  'MetaInsights',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    entityType: {
      type: DataTypes.ENUM('campaign', 'adset', 'ad'),
      allowNull: false,
    },

    entityId: { type: DataTypes.STRING(50), allowNull: false },

    date: { type: DataTypes.DATEONLY, allowNull: false },

    impressions: { type: DataTypes.INTEGER, allowNull: true },
    clicks: { type: DataTypes.INTEGER, allowNull: true },
    spend: { type: DataTypes.INTEGER, allowNull: true }, // minor units (pence/cents)
    leads: { type: DataTypes.INTEGER, allowNull: true },
    reach: { type: DataTypes.INTEGER, allowNull: true },
    frequency: { type: DataTypes.FLOAT, allowNull: true },
    purchase_roas: { type: DataTypes.FLOAT, allowNull: true },

    cpc: { type: DataTypes.FLOAT, allowNull: true },
    ctr: { type: DataTypes.FLOAT, allowNull: true },
    cpm: { type: DataTypes.FLOAT, allowNull: true },
  },
  {
    modelName: 'MetaInsights',
    timestamps: true,
    indexes: [
      // Unique: one row per entity per day — prevents duplicate inserts on every sync run
      { unique: true, fields: ['organisationId', 'entityType', 'entityId', 'date'] },
      { fields: ['organisationId', 'date'] },
    ],
  }
)
