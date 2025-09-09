import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";
import CpdCourse from "./cpdCourse.js";
// import User from "../User.js"

const CpdCertification = sequelize.define("cpd_certifications", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  //add course_id
  //document link ()
  course_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  issuer: { type: DataTypes.STRING(160), allowNull: true },
  issued_on: { type: DataTypes.DATEONLY, allowNull: true },
  expires_on: { type: DataTypes.DATEONLY, allowNull: true },
  credential_id: { type: DataTypes.STRING(160), allowNull: true },
  status: { type: DataTypes.ENUM("Active", "Expired", "Revoked"), allowNull: false, defaultValue: "Active" },
}, { tableName: "cpd_certifications", timestamps: true });

export default CpdCertification;
