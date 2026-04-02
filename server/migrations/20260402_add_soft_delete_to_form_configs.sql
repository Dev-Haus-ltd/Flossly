ALTER TABLE IF EXISTS "FormConfigs"
  ADD COLUMN IF NOT EXISTS "softDeleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE NULL;

CREATE INDEX IF NOT EXISTS "form_configs_org_softdeleted_created_idx"
  ON "FormConfigs" ("organisationId", "softDeleted", "createdAt");
