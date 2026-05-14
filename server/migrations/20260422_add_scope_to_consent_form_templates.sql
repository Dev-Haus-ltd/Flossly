BEGIN;

ALTER TABLE "ConsentFormTemplates"
  ADD COLUMN IF NOT EXISTS "scope" VARCHAR(20) NOT NULL DEFAULT 'organisation',
  ADD COLUMN IF NOT EXISTS "key"   VARCHAR(100) NULL;

ALTER TABLE "ConsentFormTemplates"
  ALTER COLUMN "organisationId" DROP NOT NULL,
  ALTER COLUMN "createdBy"      DROP NOT NULL;

DROP INDEX IF EXISTS "consent_templates_org_name_uq";

CREATE UNIQUE INDEX IF NOT EXISTS "consent_templates_org_name_uq"
  ON "ConsentFormTemplates" ("organisationId", "name")
  WHERE scope = 'organisation';

CREATE UNIQUE INDEX IF NOT EXISTS "consent_templates_system_key_uq"
  ON "ConsentFormTemplates" ("key")
  WHERE scope = 'system';

CREATE INDEX IF NOT EXISTS "idx_consent_templates_scope"
  ON "ConsentFormTemplates" ("scope");

COMMIT;
