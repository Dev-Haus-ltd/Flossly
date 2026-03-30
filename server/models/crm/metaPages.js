import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const MetaPage = sequelize.define(
  'MetaPages',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Organisations', key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
    pageId: { type: DataTypes.STRING(50), allowNull: false },
    pageName: { type: DataTypes.STRING(200), allowNull: true },
    accessTokenEnc: { type: DataTypes.TEXT, allowNull: false },
    businessId: { type: DataTypes.STRING(50), allowNull: true },
    connectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('Active','Revoked'), allowNull: false, defaultValue: 'Active' },
  },
  { modelName: 'MetaPages', timestamps: true }
)

