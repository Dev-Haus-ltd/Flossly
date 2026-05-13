BEGIN;

-- =====================================================
-- PATIENT COMMUNICATION LOGS
-- =====================================================

CREATE TYPE "dev"."enum_DiaryPatientCommunicationLogs_type" AS ENUM('Email', 'WhatsApp', 'SMS', 'Phone', 'In-Person', 'Automation', 'Consent Form');
CREATE TYPE "dev"."enum_DiaryPatientCommunicationLogs_status" AS ENUM('Sent', 'Delivered', 'Failed', 'Pending', 'Draft');

CREATE TABLE IF NOT EXISTS "dev"."DiaryPatientCommunicationLogs" (
  "id"               SERIAL PRIMARY KEY,
  "organisationId"   INTEGER NOT NULL REFERENCES "dev"."Organisations" ("id") ON DELETE CASCADE,
  "patientId"        INTEGER NOT NULL REFERENCES "dev"."DiaryPatients"  ("id") ON DELETE CASCADE,
  "practitionerId"   INTEGER REFERENCES "dev"."Users" ("id") ON DELETE SET NULL,

  "type"             "dev"."enum_DiaryPatientCommunicationLogs_type" NOT NULL,
  "subject"          VARCHAR(255),
  "content"          TEXT,
  "status"           "dev"."enum_DiaryPatientCommunicationLogs_status" NOT NULL DEFAULT 'Pending',

  "sentAt"           TIMESTAMPTZ,
  "deliveredAt"      TIMESTAMPTZ,
  "failedAt"         TIMESTAMPTZ,
  "errorMessage"     TEXT,

  "metadata"         JSONB,
  "externalId"       VARCHAR(255),

  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "patient_comm_logs_org_patient_type_created_unique"
    UNIQUE ("organisationId", "patientId", "type", "createdAt")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "DiaryPatientCommunicationLogs_organisationId_patientId_idx" ON "dev"."DiaryPatientCommunicationLogs" ("organisationId", "patientId");
CREATE INDEX IF NOT EXISTS "DiaryPatientCommunicationLogs_organisationId_practitionerId_idx" ON "dev"."DiaryPatientCommunicationLogs" ("organisationId", "practitionerId");
CREATE INDEX IF NOT EXISTS "DiaryPatientCommunicationLogs_organisationId_type_idx" ON "dev"."DiaryPatientCommunicationLogs" ("organisationId", "type");
CREATE INDEX IF NOT EXISTS "DiaryPatientCommunicationLogs_organisationId_status_idx" ON "dev"."DiaryPatientCommunicationLogs" ("organisationId", "status");
CREATE INDEX IF NOT EXISTS "DiaryPatientCommunicationLogs_organisationId_createdAt_idx" ON "dev"."DiaryPatientCommunicationLogs" ("organisationId", "createdAt");

-- Updated at trigger
CREATE TRIGGER "DiaryPatientCommunicationLogs_updated_at"
  BEFORE UPDATE ON "dev"."DiaryPatientCommunicationLogs"
  FOR EACH ROW EXECUTE FUNCTION dev.update_updated_at_column();

COMMIT;