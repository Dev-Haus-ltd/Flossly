import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

export const GoogleAdsAdGroup = sequelize.define(
    'GoogleAdsAdGroups',
    {
        adGroupId: { type: DataTypes.STRING(50), primaryKey: true },

        organisationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Organisations', key: 'id' },
        },

        campaignId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            references: { model: 'GoogleAdsCampaigns', key: 'campaignId' },
        },

        name: { type: DataTypes.STRING(200), allowNull: true },
        status: { type: DataTypes.STRING(50), allowNull: true },
    },
    {
        modelName: 'GoogleAdsAdGroups',
        timestamps: true,
        indexes: [
            { fields: ['organisationId'] },
            { fields: ['campaignId'] }
        ]
    }
)
