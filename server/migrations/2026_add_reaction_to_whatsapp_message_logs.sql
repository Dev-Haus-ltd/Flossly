-- Migration: add reaction column to CrmWhatsAppMessageLogs
ALTER TABLE "CrmWhatsAppMessageLogs"
  ADD COLUMN IF NOT EXISTS "reaction" VARCHAR(50) DEFAULT NULL;
