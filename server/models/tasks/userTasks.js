import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const UserTask = sequelize.define(
  "UserTasks",
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
        key: "id",
      },
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Tasks",
        key: "id",
      },
    },
    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Organisations",
        key: "id",
      },
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "OrganisationStatuses",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    documentLink: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    priorityId: {
      type: DataTypes.INTEGER,
      references: {
        model: "OrganisationPriorities",
        key: "id",
      },
      allowNull: false,
    },
    frequency: {
      type: DataTypes.ENUM(
        "Daily",
        "Weekly",
        "Biweekly",
        "Monthly",
        "Quarterly",
        "Yearly",
        "Ad Hoc"
      ),
      allowNull: true,
    },
    isArchieved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    template: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    comments: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    modelName: "UserTasks",
    timestamps: true,
  }
);
