import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

/**
 * DiaryZone model - represents time-based zones on the calendar
 * Zones are visual highlights that can appear on specific days/times with customizable colors
 * and display options (border, background, or both)
 */
export const DiaryZone = sequelize.define(
  "DiaryZones",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dentistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Basic info
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Color styling
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: "#0061FB", // Primary brand color
    },

    // Time range
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    }, // HH:MM:SS format
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    }, // HH:MM:SS format

    // Date range
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    }, // YYYY-MM-DD
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    }, // YYYY-MM-DD

    // Days selection (0=Monday to 6=Sunday, stored as comma-separated string)
    // Example: "1,3,5" for Monday, Wednesday, Friday
    selectedDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [1, 2, 3, 4, 5],
    },
    // Recurrence pattern
    repeatPattern: {
      type: DataTypes.ENUM("weekly", "bi-weekly", "monthly"),
      allowNull: false,
      defaultValue: "weekly",
    },

    // Display style on calendar
    displayType: {
      type: DataTypes.ENUM("border", "background", "both"),
      allowNull: false,
      defaultValue: "background",
    },

    // Enable/disable
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    // Metadata
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "DiaryZones",
    timestamps: true,
    indexes: [
      { fields: ["organisationId", "dentistId"] },
      { fields: ["isActive"] },
    ],
  },
);
