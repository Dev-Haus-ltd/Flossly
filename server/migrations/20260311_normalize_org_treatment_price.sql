BEGIN;

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

COMMIT;
