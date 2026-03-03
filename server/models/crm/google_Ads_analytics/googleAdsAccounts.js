import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

export const GoogleAdsAccount = sequelize.define(
    'GoogleAdsAccounts',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        organisationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Organisations', key: 'id' },
            unique: true // One Google Ads account per organization
        },

        googleCustomerId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },

        name: { type: DataTypes.STRING(200), allowNull: true },
        currency: { type: DataTypes.STRING(10), allowNull: true },
        timezone: { type: DataTypes.STRING(50), allowNull: true },

        googleOAuthTokenId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'GoogleOAuthTokens', key: 'id' }
        }
    },
    {
        modelName: 'GoogleAdsAccounts',
        timestamps: true,
        indexes: [
            { fields: ['organisationId'] },
            { fields: ['googleCustomerId'] }
        ]
    }
)
