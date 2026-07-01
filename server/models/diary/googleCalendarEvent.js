import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryGoogleCalendarEvent = sequelize.define(
  'DiaryGoogleCalendarEvents',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Organisations', key: 'id' }
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'DiaryAppointments', key: 'id' }
    },
    // Which dentist sub-calendar this event lives in
    googleCalendarId: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    googleEventId: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  },
  {
    modelName: 'DiaryGoogleCalendarEvents',
    timestamps: true,
    indexes: [
      { fields: ['organisationId', 'appointmentId'], unique: true },
      { fields: ['organisationId'] }
    ]
  }
)
