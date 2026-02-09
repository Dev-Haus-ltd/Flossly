ALTER TABLE IF EXISTS dev."CrmWhatsAppMessageLogs"
  ADD COLUMN IF NOT EXISTS "content" TEXT;
