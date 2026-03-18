import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaAd = sequelize.define(
  'MetaAds',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    adSetId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    adId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    name: { type: DataTypes.STRING(200), allowNull: true },
    status: { type: DataTypes.STRING(50), allowNull: true },
    creativeId: { type: DataTypes.STRING(50), allowNull: true },
    platform: { type: DataTypes.STRING(50), allowNull: true },
    imageUrl: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    modelName: 'MetaAds',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['adId', 'organisationId'] },
      { fields: ['organisationId'] },
      { fields: ['adSetId'] },
    ],
  }
)
