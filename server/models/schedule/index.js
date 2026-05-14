import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

// Main schedule entity
export const DentistSchedule = sequelize.define(
  'DentistSchedules',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false, indexed: true },
    dentistId: { type: DataTypes.INTEGER, allowNull: false, indexed: true },
    scheduleName: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    
    // Date range
    startDate: { type: DataTypes.DATEONLY, allowNull: false }, // YYYY-MM-DD
    endDate: { type: DataTypes.DATEONLY, allowNull: true }, // Optional end date
    
    // Repeat pattern
    repeatPattern: { 
      type: DataTypes.ENUM('weekly', 'bi-weekly', 'monthly'),
      allowNull: false, 
      defaultValue: 'weekly'
    },
    
    // Enable/disable toggle
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    
    // Metadata
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { 
    tableName: 'DentistSchedules', 
    timestamps: true,
    indexes: [
      { fields: ['organisationId', 'dentistId'] }
    ]
  }
)

// Daily schedule configuration
export const DentistScheduleDay = sequelize.define(
  'DentistScheduleDays',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    scheduleId: { type: DataTypes.INTEGER, allowNull: false, indexed: true },
    
    // Day of week: 0 (Monday) to 6 (Sunday)
    dayOfWeek: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      validate: { min: 0, max: 6 }
    },
    dayName: { type: DataTypes.STRING(10), allowNull: false }, // e.g., 'Monday'
    
    // Working hours
    isWorkingDay: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    startTime: { type: DataTypes.TIME, allowNull: true }, // HH:MM:SS (09:00:00)
    endTime: { type: DataTypes.TIME, allowNull: true }, // HH:MM:SS (17:00:00)
    
    // Order for display
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { 
    tableName: 'DentistScheduleDays', 
    timestamps: true,
    indexes: [
      { fields: ['scheduleId'] },
      { fields: ['scheduleId', 'dayOfWeek'], unique: true }
    ]
  }
)

// Break times within a day
export const DentistScheduleBreak = sequelize.define(
  'DentistScheduleBreaks',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    scheduleDayId: { type: DataTypes.INTEGER, allowNull: false, indexed: true },
    
    // Break details
    breakName: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Break' },
    startTime: { type: DataTypes.TIME, allowNull: false }, // HH:MM:SS (13:00:00)
    endTime: { type: DataTypes.TIME, allowNull: false }, // HH:MM:SS (14:00:00)
    
    // Display order
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { 
    tableName: 'DentistScheduleBreaks', 
    timestamps: true,
    indexes: [
      { fields: ['scheduleDayId'] }
    ]
  }
)

// Define associations
DentistSchedule.hasMany(DentistScheduleDay, {
  foreignKey: 'scheduleId',
  as: 'days',
  onDelete: 'CASCADE'
})

DentistScheduleDay.belongsTo(DentistSchedule, {
  foreignKey: 'scheduleId',
  as: 'schedule'
})

DentistScheduleDay.hasMany(DentistScheduleBreak, {
  foreignKey: 'scheduleDayId',
  as: 'breaks',
  onDelete: 'CASCADE'
})

DentistScheduleBreak.belongsTo(DentistScheduleDay, {
  foreignKey: 'scheduleDayId',
  as: 'scheduleDay'
})
