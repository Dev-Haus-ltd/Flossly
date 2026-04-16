import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryTreatmentPlan = sequelize.define(
  'DiaryTreatmentPlans',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    planKey: { type: DataTypes.STRING(80), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    color: { type: DataTypes.STRING(24), allowNull: true },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    appointmentsJson: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    contentJson: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'DiaryTreatmentPlans',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['organisationId', 'patientId', 'planKey'] },
      { fields: ['organisationId', 'patientId', 'priority'] },
    ],
  }
)
