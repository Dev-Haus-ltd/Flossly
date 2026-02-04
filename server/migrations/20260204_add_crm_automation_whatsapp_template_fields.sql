ALTER TABLE "CrmAutomationTemplates"
  ADD COLUMN IF NOT EXISTS "whatsappTemplateName" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "whatsappTemplateLanguage" VARCHAR(10);
