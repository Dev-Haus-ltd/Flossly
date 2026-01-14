BEGIN;

CREATE TABLE IF NOT EXISTS "OnboardingEvents" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "Users" ("id") ON DELETE CASCADE,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "key" VARCHAR(120) NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "onboarding_events_user_org_key_unique"
  ON "OnboardingEvents" ("userId", "organisationId", "key");

COMMIT;
