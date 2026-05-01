BEGIN;

ALTER TABLE "CrmAutomationTemplates"
  ADD COLUMN IF NOT EXISTS "renderMode"      VARCHAR(20) NOT NULL DEFAULT 'wrapped',
  ADD COLUMN IF NOT EXISTS "emailTemplateId" INTEGER REFERENCES "CrmEmailTemplates" ("id") ON DELETE SET NULL;

COMMIT;
