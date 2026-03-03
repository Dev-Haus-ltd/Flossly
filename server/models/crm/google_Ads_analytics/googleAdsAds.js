import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

export const GoogleAdsAd = sequelize.define(
    'GoogleAdsAds',
    {
        adId: { type: DataTypes.STRING(50), primaryKey: true },

        organisationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Organisations', key: 'id' },
        },

        adGroupId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            references: { model: 'GoogleAdsAdGroups', key: 'adGroupId' },
        },

        name: { type: DataTypes.STRING(200), allowNull: true },
        status: { type: DataTypes.STRING(50), allowNull: true },
    },
    {
        modelName: 'GoogleAdsAds',
        timestamps: true,
        indexes: [
            { fields: ['organisationId'] },
            { fields: ['adGroupId'] }
        ]
    }
)
