ALTER TABLE "CrmWhatsAppMessageLogs"
  ADD COLUMN IF NOT EXISTS "attachments" JSONB;
