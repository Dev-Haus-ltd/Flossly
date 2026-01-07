import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryPatientForm = sequelize.define(
  'DiaryPatientForms',
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
    formType: {
      type: DataTypes.ENUM('medical_history', 'consent'),
      allowNull: false,
    },
    // Store answers for all questions
    // Structure: { question1: 'yes' | 'no', question2: 'yes' | 'no', ... }
    answers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    // Patient's comments
    patientComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Staff comments
    ourComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Additional information
    additionalInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // User who created the form
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'DiaryPatientForms',
    timestamps: true,
    indexes: [
      {
        fields: ['patientId', 'organisationId'],
        name: 'idx_patient_forms_patient_org',
      },
      {
        fields: ['formType'],
        name: 'idx_patient_forms_type',
      },
    ],
  }
)

