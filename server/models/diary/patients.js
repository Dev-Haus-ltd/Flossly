import { DataTypes } from 'sequelize'
import sequelize from '../../utils/db'

export const DiaryPatient = sequelize.define(
  'DiaryPatients',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(20), allowNull: true },
    sex: { type: DataTypes.STRING(20), allowNull: true },
    firstName: { type: DataTypes.STRING(80), allowNull: false },
    lastName: { type: DataTypes.STRING(80), allowNull: false },
    address1: { type: DataTypes.STRING(200), allowNull: true },
    postcode: { type: DataTypes.STRING(20), allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    mobile: { type: DataTypes.STRING(40), allowNull: true },
    email: { type: DataTypes.STRING(120), allowNull: true },
    marketingConsent: { type: DataTypes.STRING(10), allowNull: true },
    receiveSms: { type: DataTypes.BOOLEAN, allowNull: true },
    receiveEmail: { type: DataTypes.BOOLEAN, allowNull: true },
    paymentPlan: { type: DataTypes.STRING(40), allowNull: true },
    defaultDentistId: { type: DataTypes.INTEGER, allowNull: true },
    recallMethod: { type: DataTypes.STRING(20), allowNull: true },
    recallInterval: { type: DataTypes.STRING(20), allowNull: true },
  },
  { tableName: 'DiaryPatients', timestamps: true }
)

