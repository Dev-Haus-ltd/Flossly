-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block in PostgreSQL.
-- Run these three statements first, outside any transaction:
ALTER TYPE "enum_UserPreferences_licenseType" ADD VALUE IF NOT EXISTS 'Lite';
ALTER TYPE "enum_UserPreferences_licenseType" ADD VALUE IF NOT EXISTS 'CRM';
ALTER TYPE "enum_UserPreferences_licenseType" ADD VALUE IF NOT EXISTS 'Pro';

-- The column addition is safe inside a transaction:
BEGIN;
ALTER TABLE "UserDocuments"
  ADD COLUMN IF NOT EXISTS "fileSizeBytes" BIGINT NOT NULL DEFAULT 0;
COMMIT;
