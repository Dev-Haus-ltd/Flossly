ALTER TABLE IF EXISTS "Organisations"
  ADD COLUMN IF NOT EXISTS "practiceAnniversaryDate" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "automationPlaceholders" JSONB;
