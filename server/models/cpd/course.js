import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const Course = sequelize.define(
  "Courses",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    category: {
      type: DataTypes.ENUM(
        "Delegated",
        "All",
        "Dentist Courses",
        "Nurse Courses",
        "Receptionist Courses",
        "Practice Management Courses"
      ),
      allowNull: false,
    },
    creditHours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 1,
    },
    mode: {
      type: DataTypes.ENUM("In-Person", "eLearning", "Webinar", "Workshop"),
      allowNull: false,
      defaultValue: "eLearning",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    thumbnail: { type: DataTypes.STRING(200), allowNull: true },
    courseObjectives: { type: DataTypes.TEXT, allowNull: true },
    courseOutcome: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    metaData: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  },
  { modelName: "Courses", timestamps: true }
);
