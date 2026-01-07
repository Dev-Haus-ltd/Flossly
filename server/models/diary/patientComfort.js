import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryPatientComfort = sequelize.define(
  'DiaryPatientComforts',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DiaryPatients',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Organisations',
        key: 'id',
      },
    },
    // Standard preferences
    beveragePreference: { type: DataTypes.STRING(100), allowNull: true },
    blanketPreference: { type: DataTypes.STRING(100), allowNull: true },
    entertainmentOptions: {
      type: DataTypes.JSONB,
      allowNull: true,
      // Stores: { television: boolean, movies: boolean, musicGenres: string[] }
    },
    lightingPreference: { type: DataTypes.STRING(100), allowNull: true },
    roomTemperaturePreference: { type: DataTypes.STRING(100), allowNull: true },
    aromatherapyPreference: { type: DataTypes.STRING(100), allowNull: true },
    communicationStyle: {
      type: DataTypes.ENUM('Detailed', 'Minimal', 'Visual'),
      allowNull: true,
    },
    anxietyLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    // Custom questions and answers (up to 10)
    // Structure: [{ question: string, answer: string }]
    customQuestions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: 'DiaryPatientComforts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['patientId', 'organisationId'],
        name: 'unique_patient_comfort_per_org',
      },
    ],
  }
)

