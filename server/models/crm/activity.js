import { DataTypes } from "sequelize";
import sequelize from "../../utils/db.js";

export const Activity = sequelize.define(
  "Activities",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisationId: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        "Call",
        "Meeting",
        "Note",
        "Task",
        "WhatsApp",
        "Messenger"
      ),
      allowNull: false,
    },
    subject: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Leads",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  { modelName: "Activities", timestamps: true }
);
