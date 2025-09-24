import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const CrmContact = sequelize.define(
  "CrmContacts",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    fullName: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: true },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    tags: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true, defaultValue: [] },
    source: {
      type: DataTypes.ENUM("Manual", "Meta", "WhatsApp", "Import", "Other"),
      allowNull: false,
      defaultValue: "Manual",
    },
    meta: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { modelName: "CrmContacts", timestamps: true }
);


