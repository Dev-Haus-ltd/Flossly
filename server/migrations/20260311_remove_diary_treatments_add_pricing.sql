BEGIN;

-- 1) Organisation treatment dictionary normalize to a single price column
ALTER TABLE "OrganisationTreatments"
  ADD COLUMN IF NOT EXISTS "price" NUMERIC(10, 2);

UPDATE "OrganisationTreatments"
SET "price" = COALESCE("price", "pricing", "amount", 0)
WHERE "price" IS NULL;

ALTER TABLE "OrganisationTreatments"
  ALTER COLUMN "price" SET DEFAULT 0;

ALTER TABLE "OrganisationTreatments"
  DROP COLUMN IF EXISTS "pricing",
  DROP COLUMN IF EXISTS "amount";

-- 2) CRM lead treatment selected-pricing snapshots
ALTER TABLE "CrmLeadTreatments"
  ADD COLUMN IF NOT EXISTS "primaryTreatmentPrice" NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS "secondaryTreatmentPrices" JSONB;

UPDATE "CrmLeadTreatments"
SET "primaryTreatmentPrice" = COALESCE("primaryTreatmentPrice", 0)
WHERE "primaryTreatmentPrice" IS NULL;

UPDATE "CrmLeadTreatments"
SET "secondaryTreatmentPrices" = COALESCE("secondaryTreatmentPrices", '{}'::jsonb)
WHERE "secondaryTreatmentPrices" IS NULL;

ALTER TABLE "CrmLeadTreatments"
  ALTER COLUMN "primaryTreatmentPrice" SET DEFAULT 0,
  ALTER COLUMN "secondaryTreatmentPrices" SET DEFAULT '{}'::jsonb;

-- 3) Remove obsolete diary treatment dictionary table
DROP TABLE IF EXISTS "DiaryTreatments" CASCADE;

COMMIT;
