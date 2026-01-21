ALTER TABLE dev."CrmAutomationTemplates"
ADD COLUMN IF NOT EXISTS trigger JSONB;
