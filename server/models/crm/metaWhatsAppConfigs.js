import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaWhatsAppConfig = sequelize.define(
  'MetaWhatsAppConfigs',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
    phoneNumberId: { type: DataTypes.STRING(64), allowNull: false },
    wabaId: { type: DataTypes.STRING(64), allowNull: true },
    accessTokenEnc: { type: DataTypes.TEXT, allowNull: false },
    verifyTokenEnc: { type: DataTypes.TEXT, allowNull: true },
  },
  { modelName: 'MetaWhatsAppConfigs', timestamps: true }
)
