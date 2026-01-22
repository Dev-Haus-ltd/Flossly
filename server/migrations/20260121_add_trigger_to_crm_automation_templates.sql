ALTER TABLE "CrmAutomationTemplates"
ADD COLUMN IF NOT EXISTS trigger JSONB;
