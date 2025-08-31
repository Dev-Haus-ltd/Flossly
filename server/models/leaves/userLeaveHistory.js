import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";
export const UserLeaveHistory = sequelize.define(
  "UserLeaveHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key:"id"
      }
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Organisations",
        key: "id"
      }
    },
    leaveType: {
      type: DataTypes.ENUM(
        "Annual",
        "Casual",
        "Sick",
        "Compationate",
        "Others"
      ),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Cancelled"),
      defaultValue: "Pending",
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    totalHours: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    document: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    modelName: "UserLeaveHistory",
    timestamps: true,
  }
);
