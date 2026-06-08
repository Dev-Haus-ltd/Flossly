ALTER TABLE "CrmAutomationTemplates"
  ADD COLUMN IF NOT EXISTS "attachments" JSONB;
