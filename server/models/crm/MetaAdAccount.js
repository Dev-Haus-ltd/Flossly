import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaAdAccount = sequelize.define(
  'MetaAdAccounts',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    adAccountId: {
      type: DataTypes.STRING(50), // act_xxxxx
      allowNull: false,
    },

    name: { type: DataTypes.STRING(200), allowNull: true },
    currency: { type: DataTypes.STRING(10), allowNull: false },
    timezone: { type: DataTypes.STRING(50), allowNull: false },
  },
  {
    modelName: 'MetaAdAccounts',
    timestamps: true,
    indexes: [
      // Composite unique: same ad account can exist for different orgs without collision
      { unique: true, fields: ['adAccountId', 'organisationId'] },
      { fields: ['organisationId'] },
    ],
  }
)
