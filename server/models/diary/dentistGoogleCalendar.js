import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

/**
 * DiaryDentistGoogleCalendar
 * Maps each dentist in an org to a Google Calendar ID (a secondary calendar
 * created under the org's connected Google account, e.g. "Dr. Alice — Flossly").
 */
export const DiaryDentistGoogleCalendar = sequelize.define(
  'DiaryDentistGoogleCalendars',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Organisations', key: 'id' }
    },
    dentistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    googleCalendarId: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    calendarName: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    modelName: 'DiaryDentistGoogleCalendars',
    timestamps: true,
    indexes: [
      { fields: ['organisationId', 'dentistId'], unique: true },
      { fields: ['organisationId'] }
    ]
  }
)
