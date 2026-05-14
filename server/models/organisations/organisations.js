import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";
import { DefaultPriority } from "../defaultPriorities";
import { OrganisationPriority } from "./organisationPriorities";
import { DefaultStatus } from "../defaultStatuses";
import { OrganisationStatus } from "./organisationStatuses";

export const Organisation = sequelize.define(
  "Organisations",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    surgeryCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    teamCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentApp: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    contact: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "Dental",
        "General Practice",
        "Dermatology",
        "Physiotherapy"
      ),
      allowNull: true,
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key:  'id'
      }
    },
    logo: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    cqcInspectionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    referedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM("Invited", "Active", "InActive"),
      allowNull: true,
      },
    licenseType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Lite',
    },
    licenseBillingCycle: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    licenseRenewalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hasUsedTrial: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    practiceAnniversaryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    automationPlaceholders: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    autoReplyEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    autoReplyConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    whatsappAutoReplyEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    workingTimings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        monday: { startTime: "09:00", endTime: "17:00" },
        tuesday: { startTime: "09:00", endTime: "17:00" },
        wednesday: { startTime: "09:00", endTime: "17:00" },
        thursday: { startTime: "09:00", endTime: "17:00" },
        friday: { startTime: "09:00", endTime: "17:00" },
        saturday: { startTime: "09:00", endTime: "17:00" },
        sunday: { startTime: "09:00", endTime: "17:00" },
      },
    },
    nonWorkingDays: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of day abbreviations (Mon, Tue, Wed, Thu, Fri, Sat, Sun) that are non-working days',
    },
    },
  {
    modelName: "Organisations",
    timestamps: true,
    hooks: {
      async afterCreate(organisation, options) {
        const transaction = options.transaction;
        try {
          // Seed default priorities
          const defaultPriorities = await DefaultPriority.findAll();
          const priorityData = defaultPriorities.map((p) => ({
            key: p.key,
            name: p.name,
            color: p.color,
            sortOrder: p.sortOrder,
            organisationId: organisation.id,
            status: "Active",
          }));
          await OrganisationPriority.bulkCreate(priorityData, { transaction });
          // Seed default statuses
          const defaultStatuses = await DefaultStatus.findAll();
          const statusData = defaultStatuses.map((s) => ({
            key: s.key,
            name: s.name,
            color: s.color,
            description: s.description,
            organisationId: organisation.id,
            status: "Active",
          }));
          await OrganisationStatus.bulkCreate(statusData, { transaction });
        } catch (err) {
          console.error("Error seeding priorities/statuses:", err);
          throw err;
        }
      },
    },
  }
);
