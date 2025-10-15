import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaUserToken = sequelize.define(
  'MetaUserTokens',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
    userTokenEnc: { type: DataTypes.TEXT, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  { modelName: 'MetaUserTokens', timestamps: true }
)

