BEGIN;

-- =====================================================
-- ENUM TYPES (SAFE CREATE)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE consent_document_status AS ENUM (
    'draft',
    'sent',
    'viewed',
    'signed',
    'voided'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_audit_action AS ENUM (
    'created',
    'email_sent',
    'whatsapp_sent',
    'delivery_failed',
    'sent',
    'viewed',
    'signed',
    'voided',
    'revoked',
    're_sent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- COMMON TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_update_if_finalized()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."isFinalized" = true THEN
    RAISE EXCEPTION 'Cannot update finalized document';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONSENT FORM TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS "ConsentFormTemplates" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(50),
  "htmlContent" TEXT NOT NULL,
  "signatureCoordinates" JSONB,
  "initialCoordinates" JSONB,
  "dateCoordinates" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "updatedBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "consent_templates_org_idx"
  ON "ConsentFormTemplates" ("organisationId");

CREATE INDEX IF NOT EXISTS "consent_templates_active_idx"
  ON "ConsentFormTemplates" ("isActive");

CREATE INDEX IF NOT EXISTS "consent_templates_category_idx"
  ON "ConsentFormTemplates" ("category");

CREATE UNIQUE INDEX IF NOT EXISTS "consent_templates_org_name_uq"
  ON "ConsentFormTemplates" ("organisationId", "name");

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON "ConsentFormTemplates"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONSENT FORM DOCUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS "ConsentFormDocuments" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "templateId" INTEGER NOT NULL REFERENCES "ConsentFormTemplates" ("id") ON DELETE CASCADE,
  "patientId" INTEGER NOT NULL REFERENCES "DiaryPatients" ("id") ON DELETE CASCADE,

  "documentReference" VARCHAR(50) UNIQUE NOT NULL,
  "accessTokenHash" VARCHAR(255) NOT NULL UNIQUE,
  "tokenExpiresAt" TIMESTAMPTZ,

  "status" consent_document_status NOT NULL DEFAULT 'draft',

  "pdfS3Key" VARCHAR(255),
  "signedPdfS3Key" VARCHAR(255),
  "signatureS3Key" VARCHAR(255),

  "patientSignatureName" VARCHAR(255),
  "patientSignatureDate" TIMESTAMPTZ,

  "customTitle" VARCHAR(255),
  "customNotes" TEXT,
  "metadata" JSONB,

  "patientEmail" VARCHAR(255),
  "patientPhone" VARCHAR(20),

  "sentBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "sentAt" TIMESTAMPTZ,
  "viewedAt" TIMESTAMPTZ,
  "signedAt" TIMESTAMPTZ,

  "voidedBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "voidedAt" TIMESTAMPTZ,
  "voidReason" TEXT,

  "isFinalized" BOOLEAN NOT NULL DEFAULT false,
  "finalPdfHash" VARCHAR(255),

  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT token_expiry_check
    CHECK ("tokenExpiresAt" IS NULL OR "tokenExpiresAt" > NOW())
);

CREATE INDEX IF NOT EXISTS "consent_documents_org_idx"
  ON "ConsentFormDocuments" ("organisationId");

CREATE INDEX IF NOT EXISTS "consent_documents_patient_idx"
  ON "ConsentFormDocuments" ("patientId");

CREATE INDEX IF NOT EXISTS "consent_documents_template_idx"
  ON "ConsentFormDocuments" ("templateId");

CREATE INDEX IF NOT EXISTS "consent_documents_status_idx"
  ON "ConsentFormDocuments" ("status");

CREATE INDEX IF NOT EXISTS "consent_documents_org_patient_idx"
  ON "ConsentFormDocuments" ("organisationId", "patientId");

CREATE INDEX IF NOT EXISTS "consent_documents_token_expiry_idx"
  ON "ConsentFormDocuments" ("tokenExpiresAt");

CREATE INDEX IF NOT EXISTS "consent_documents_active_idx"
  ON "ConsentFormDocuments" ("status")
  WHERE "status" IN ('sent','viewed');

CREATE UNIQUE INDEX IF NOT EXISTS "consent_unique_patient_template_doc"
  ON "ConsentFormDocuments" ("patientId", "templateId", "documentReference");

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON "ConsentFormDocuments"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER prevent_document_update
BEFORE UPDATE ON "ConsentFormDocuments"
FOR EACH ROW EXECUTE FUNCTION prevent_update_if_finalized();

-- =====================================================
-- CONSENT FORM SIGNATURE AUDIT
-- =====================================================

CREATE TABLE IF NOT EXISTS "ConsentFormSignatureAudits" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "documentId" INTEGER NOT NULL REFERENCES "ConsentFormDocuments" ("id") ON DELETE CASCADE,
  "patientId" INTEGER NOT NULL REFERENCES "DiaryPatients" ("id") ON DELETE CASCADE,

  "action" consent_audit_action NOT NULL,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "metadata" JSONB,
  "performedBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,

  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "consent_audit_org_idx"
  ON "ConsentFormSignatureAudits" ("organisationId");

CREATE INDEX IF NOT EXISTS "consent_audit_document_idx"
  ON "ConsentFormSignatureAudits" ("documentId");

CREATE INDEX IF NOT EXISTS "consent_audit_patient_idx"
  ON "ConsentFormSignatureAudits" ("patientId");

CREATE INDEX IF NOT EXISTS "consent_audit_action_idx"
  ON "ConsentFormSignatureAudits" ("action");

CREATE INDEX IF NOT EXISTS "consent_audit_created_idx"
  ON "ConsentFormSignatureAudits" ("createdAt");

CREATE INDEX IF NOT EXISTS "consent_audit_org_created_idx"
  ON "ConsentFormSignatureAudits" ("organisationId", "createdAt");

COMMIT;