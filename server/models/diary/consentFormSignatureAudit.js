import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const ConsentFormSignatureAudit = sequelize.define(
  "ConsentFormSignatureAudits",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ConsentFormDocuments",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "DiaryPatients",
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

    action: {
      type: DataTypes.ENUM(
        "sent",
        "viewed",
        "signed",
        "voided",
        "revoked",
        "re_sent",
      ),
      allowNull: false,
    },

    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "IP address of signing device",
    },

    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Browser/device user agent",
    },

    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: "Additional context (device, browser, timezone)",
    },

    performedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      comment: "User ID for staff actions, null for patient actions",
    },

    // ✅ explicitly define createdAt (important fix)
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "ConsentFormSignatureAudits",

    // 🔥 IMPORTANT FIX
    timestamps: true,
    createdAt: true,
    updatedAt: false,
    indexes: [
      {
        fields: ["documentId"],
        name: "idx_consent_audit_document",
      },
      {
        fields: ["patientId"],
        name: "idx_consent_audit_patient",
      },
      {
        fields: ["organisationId"],
        name: "idx_consent_audit_org",
      },
      {
        fields: ["action"],
        name: "idx_consent_audit_action",
      },
      {
        fields: ["createdAt"],
        name: "idx_consent_audit_created_at",
      },
    ],
  },
);
