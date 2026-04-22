BEGIN;

CREATE TABLE IF NOT EXISTS "ClinicalNoteTemplates" (
  "id" SERIAL PRIMARY KEY,
  "scope" VARCHAR(20) NOT NULL DEFAULT 'organisation',
  "organisationId" INTEGER REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "type" VARCHAR(40) NOT NULL,
  "category" VARCHAR(40) NOT NULL DEFAULT 'user',
  "key" VARCHAR(120) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "sourceTemplateId" INTEGER REFERENCES "ClinicalNoteTemplates" ("id") ON DELETE SET NULL,
  "currentVersionId" INTEGER,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "updatedBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ClinicalNoteTemplateVersions" (
  "id" SERIAL PRIMARY KEY,
  "templateId" INTEGER NOT NULL REFERENCES "ClinicalNoteTemplates" ("id") ON DELETE CASCADE,
  "versionNumber" INTEGER NOT NULL DEFAULT 1,
  "content" TEXT NOT NULL,
  "changeNote" VARCHAR(255),
  "createdBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "ClinicalNoteTemplates"
  ADD COLUMN IF NOT EXISTS "scope" VARCHAR(20) NOT NULL DEFAULT 'organisation',
  ADD COLUMN IF NOT EXISTS "organisationId" INTEGER,
  ADD COLUMN IF NOT EXISTS "type" VARCHAR(40),
  ADD COLUMN IF NOT EXISTS "category" VARCHAR(40) NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "key" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "title" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "sourceTemplateId" INTEGER,
  ADD COLUMN IF NOT EXISTS "currentVersionId" INTEGER,
  ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "createdBy" INTEGER,
  ADD COLUMN IF NOT EXISTS "updatedBy" INTEGER,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE "ClinicalNoteTemplateVersions"
  ADD COLUMN IF NOT EXISTS "templateId" INTEGER,
  ADD COLUMN IF NOT EXISTS "versionNumber" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "content" TEXT,
  ADD COLUMN IF NOT EXISTS "changeNote" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "createdBy" INTEGER,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE "DiaryTreatmentPlanItems"
  ADD COLUMN IF NOT EXISTS "templateId" INTEGER REFERENCES "ClinicalNoteTemplates" ("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "clinical_note_templates_scope_type_status_idx"
  ON "ClinicalNoteTemplates" ("scope", "type", "status");

CREATE INDEX IF NOT EXISTS "clinical_note_templates_org_type_status_idx"
  ON "ClinicalNoteTemplates" ("organisationId", "type", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "clinical_note_templates_system_key_uq"
  ON "ClinicalNoteTemplates" ("key")
  WHERE "scope" = 'system';

CREATE UNIQUE INDEX IF NOT EXISTS "clinical_note_templates_org_key_uq"
  ON "ClinicalNoteTemplates" ("organisationId", "key")
  WHERE "organisationId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "clinical_note_template_versions_template_version_uq"
  ON "ClinicalNoteTemplateVersions" ("templateId", "versionNumber");

CREATE INDEX IF NOT EXISTS "clinical_note_template_versions_template_created_idx"
  ON "ClinicalNoteTemplateVersions" ("templateId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "clinical_note_templates_system_default_uq"
  ON "ClinicalNoteTemplates" ("type")
  WHERE "scope" = 'system' AND "isDefault" = TRUE AND "status" = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS "clinical_note_templates_org_default_uq"
  ON "ClinicalNoteTemplates" ("organisationId", "type")
  WHERE "scope" = 'organisation' AND "isDefault" = TRUE AND "status" = 'active';

COMMIT;
