import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryPatientSurvey = sequelize.define(
  'DiaryPatientSurveys',
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
    surveyType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'smile_concern',
    },
    // Structured answers organized by category and question
    // Structure matches the static survey structure
    answers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      // Structure:
      // {
      //   category1: {
      //     question1: ["option1", "option2"] // checkboxes
      //   },
      //   category2: {
      //     question2: {
      //       "Color and Brightness": ["option1"],
      //       "Alignment and Spacing": ["option2"],
      //       ...
      //     }
      //   },
      //   category3: {
      //     question3: 7, // range 1-10
      //     question4: 8,
      //     question5: "Yes" // single choice
      //   },
      //   ...
      // }
    },
    // Store uploaded photo file paths
    uploadedPhotos: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      // Array of file paths: ["/uploads/survey/photo1.jpg", ...]
    },
    // Track completion status
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'DiaryPatientSurveys',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['patientId', 'organisationId', 'surveyType'],
        name: 'unique_patient_survey_per_org',
      },
    ],
  }
)

