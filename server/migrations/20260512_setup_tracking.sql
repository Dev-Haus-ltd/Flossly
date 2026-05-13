BEGIN;
ALTER TABLE "UserPreferences"
  ADD COLUMN IF NOT EXISTS "setupStepsCompleted" SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "setupComplete" BOOLEAN NOT NULL DEFAULT false;

-- Mark all pre-existing accounts as setup complete so they don't see the
-- onboarding wizard. Only new signups created after this migration will
-- start at the defaults (0 / false) and go through setup.
UPDATE "UserPreferences"
SET "setupStepsCompleted" = 5, "setupComplete" = true
WHERE "createdAt" < NOW();
COMMIT;
