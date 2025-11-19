import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryNote = sequelize.define(
  'DiaryNotes',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    dentistId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.STRING(10), allowNull: true }, // HH:mm
    channel: { type: DataTypes.STRING(50), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'DiaryNotes', timestamps: true }
)

