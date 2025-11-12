import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryAppointment = sequelize.define(
  'DiaryAppointments',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: true },
    dentistId: { type: DataTypes.INTEGER, allowNull: false },
    treatmentId: { type: DataTypes.INTEGER, allowNull: true },
    treatmentName: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Pending' },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: true, defaultValue: 0 },
  },
  { tableName: 'DiaryAppointments', timestamps: true }
)

