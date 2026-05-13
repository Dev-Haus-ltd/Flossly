BEGIN;

ALTER TABLE "Organisations"
  ADD COLUMN IF NOT EXISTS "licenseType"         VARCHAR(20)  NOT NULL DEFAULT 'Lite',
  ADD COLUMN IF NOT EXISTS "licenseBillingCycle" VARCHAR(10)  NULL,
  ADD COLUMN IF NOT EXISTS "licenseRenewalDate"  TIMESTAMPTZ  NULL;

-- Backfill each org from its manager's UserPreferences row
UPDATE "Organisations" o
SET
  "licenseType"         = up."licenseType",
  "licenseBillingCycle" = up."licenseBillingCycle",
  "licenseRenewalDate"  = up."licenseRenewalDate"
FROM "UserPreferences" up
WHERE up."userId"         = o."managerId"
  AND up."organisationId" = o.id;

COMMIT;
