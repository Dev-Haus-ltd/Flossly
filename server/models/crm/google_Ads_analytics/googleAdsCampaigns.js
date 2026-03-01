import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

export const GoogleAdsCampaign = sequelize.define(
    'GoogleAdsCampaigns',
    {
        campaignId: { type: DataTypes.STRING(50), primaryKey: true },

        organisationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Organisations', key: 'id' },
        },

        googleCustomerId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            references: { model: 'GoogleAdsAccounts', key: 'googleCustomerId' },
        },

        name: { type: DataTypes.STRING(200), allowNull: true },
        status: { type: DataTypes.STRING(50), allowNull: true },
        advertisingChannelType: { type: DataTypes.STRING(50), allowNull: true },

        // Budget in micros
        amountMicros: { type: DataTypes.BIGINT, allowNull: true },
        budgetType: { type: DataTypes.STRING(50), allowNull: true },
    },
    {
        modelName: 'GoogleAdsCampaigns',
        timestamps: true,
        indexes: [
            { fields: ['organisationId'] },
            { fields: ['googleCustomerId'] }
        ]
    }
)
