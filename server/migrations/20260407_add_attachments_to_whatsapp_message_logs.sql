-- Adds the attachments column to CrmWhatsAppMessageLogs.
-- NOTE: This column was manually added to production DB before this migration was written.
-- Running this on an existing DB is safe (IF NOT EXISTS on the column).
ALTER TABLE "CrmWhatsAppMessageLogs"
  ADD COLUMN IF NOT EXISTS "attachments" JSONB;
