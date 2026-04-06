import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const FormConfig = sequelize.define(
  'FormConfigs',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Organisations', key: 'id' },
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    token: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    fields: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    color: { type: DataTypes.STRING(20), allowNull: true, defaultValue: '#0061FB' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    softDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { modelName: 'FormConfigs', timestamps: true }
)
