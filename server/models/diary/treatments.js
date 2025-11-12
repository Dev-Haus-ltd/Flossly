import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryTreatment = sequelize.define(
  'DiaryTreatments',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: true },
    defaultDuration: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 30 }, // minutes
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: true, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'DiaryTreatments', timestamps: true }
)

