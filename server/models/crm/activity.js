import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const CrmActivity = sequelize.define(
  "CrmActivities",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM("Call", "Meeting", "Note", "Task", "WhatsApp", "Messenger"),
      allowNull: false,
    },
    subject: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    relatedType: { type: DataTypes.ENUM("Lead", "Contact"), allowNull: false },
    relatedId: { type: DataTypes.INTEGER, allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { modelName: "CrmActivities", timestamps: true }
);


