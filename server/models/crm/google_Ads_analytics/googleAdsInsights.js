import { DataTypes } from 'sequelize'
import sequelize from '../../../utils/db'

export const GoogleAdsInsight = sequelize.define(
    'GoogleAdsInsights',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        organisationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Organisations', key: 'id' },
        },

        entityType: {
            type: DataTypes.ENUM('account', 'campaign', 'adgroup', 'ad'),
            allowNull: false,
        },

        entityId: { type: DataTypes.STRING(50), allowNull: false },

        date: { type: DataTypes.DATEONLY, allowNull: false },

        impressions: { type: DataTypes.INTEGER, allowNull: true },
        clicks: { type: DataTypes.INTEGER, allowNull: true },
        costMicros: { type: DataTypes.BIGINT, allowNull: true },
        conversions: { type: DataTypes.FLOAT, allowNull: true },
        interactions: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
        modelName: 'GoogleAdsInsights',
        timestamps: true,
        indexes: [
            { fields: ['organisationId', 'entityType', 'entityId', 'date'] },
            { fields: ['organisationId', 'date'] },
        ],
    }
)
