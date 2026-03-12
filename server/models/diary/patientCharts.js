import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryPatientChart = sequelize.define(
  'DiaryPatientCharts',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    chartJson: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    metaJson: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'DiaryPatientCharts',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['organisationId', 'patientId'] },
    ],
  }
)
