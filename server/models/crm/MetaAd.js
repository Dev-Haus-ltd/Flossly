import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaAd = sequelize.define(
  'MetaAds',
  {
    adId: { type: DataTypes.STRING(50), primaryKey: true },

    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Organisations', key: 'id' },
    },

    adSetId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: { model: 'MetaAdSets', key: 'adSetId' },
    },

    name: { type: DataTypes.STRING(200), allowNull: true },
    status: { type: DataTypes.STRING(50), allowNull: true },
    creativeId: { type: DataTypes.STRING(50), allowNull: true },
  },
  { modelName: 'MetaAds', timestamps: true }
)
