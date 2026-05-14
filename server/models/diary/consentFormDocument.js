import { DataTypes } from "sequelize";
import sequelize from "../../utils/db";

export const ConsentFormDocument = sequelize.define(
  "ConsentFormDocuments",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    organisationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Organisations",
        key: "id",
      },
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ConsentFormTemplates",
        key: "id",
      },
    },

    templateVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "DiaryPatients",
        key: "id",
      },
    },

    // Human reference ID
    documentReference: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    // Secure access token (ONLY HASH STORED)
    accessTokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },

    // Status
    status: {
      type: DataTypes.ENUM("draft", "sent", "viewed", "signed", "voided"),
      defaultValue: "draft",
    },

    // PDF storage
    pdfS3Key: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "S3 key for unsigned PDF",
    },
    signedPdfS3Key: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "S3 key for signed PDF (immutable)",
    },
    signatureS3Key: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "S3 key for signature PNG image",
    },

    // Signature data
    patientSignatureName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    patientSignatureDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Metadata
    customTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },

    // Contact overrides
    patientEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Email used to send the document link",
    },
    patientPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    // Lifecycle timestamps
    sentBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    signedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Expiry date for access link
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When the secure link expires (if null, no expiry)",
    },

    // Voiding
    voidedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    voidedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    voidReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // IMMUTABILITY CONTROL
    isFinalized: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "ConsentFormDocuments",
    timestamps: true,
    indexes: [
      {
        fields: ["organisationId"],
        name: "consent_documents_org_idx",
      },
      {
        fields: ["patientId", "organisationId"],
        name: "consent_documents_org_patient_idx",
      },
      {
        fields: ["patientId"],
        name: "consent_documents_patient_idx",
      },
      {
        fields: ["templateId"],
        name: "consent_documents_template_idx",
      },
      {
        fields: ["status"],
        name: "consent_documents_status_idx",
      },
      {
        fields: ["accessTokenHash"],
        name: "consent_documents_token_hash_idx",
      },
      {
        fields: ["tokenExpiresAt"],
        name: "consent_documents_token_expiry_idx",
      },
      {
        fields: ["sentAt"],
        name: "idx_consent_docs_sent_at",
      },
    ],
  },
);
