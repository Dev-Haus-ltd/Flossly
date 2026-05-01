BEGIN;

CREATE TABLE IF NOT EXISTS "CrmEmailTemplates" (
  "id"             SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "key"            VARCHAR(80),
  "name"           VARCHAR(150) NOT NULL,
  "description"    TEXT,
  "subject"        VARCHAR(200),
  "template"       TEXT,
  "renderMode"     VARCHAR(20) NOT NULL DEFAULT 'wrapped',
  "category"       VARCHAR(50),
  "isArchived"     BOOLEAN NOT NULL DEFAULT FALSE,
  "createdBy"      INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "crm_email_templates_org_idx"
  ON "CrmEmailTemplates" ("organisationId");

CREATE INDEX IF NOT EXISTS "crm_email_templates_org_cat_idx"
  ON "CrmEmailTemplates" ("organisationId", "category");

COMMIT;
