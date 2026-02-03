ALTER TABLE IF EXISTS "MetaWhatsAppConfigs"
  ADD COLUMN IF NOT EXISTS "displayPhoneNumber" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "verifiedName" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(32) DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS "connectedByUserId" INTEGER;

UPDATE "MetaWhatsAppConfigs"
SET "status" = 'Active'
WHERE "status" IS NULL;
