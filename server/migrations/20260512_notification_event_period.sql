BEGIN;
ALTER TABLE "OrgNotificationEvents"
  ADD COLUMN IF NOT EXISTS "period" VARCHAR(7) NULL;

UPDATE "OrgNotificationEvents"
SET "period" = TO_CHAR("createdAt", 'YYYY-MM')
WHERE "period" IS NULL;

ALTER TABLE "OrgNotificationEvents"
  ALTER COLUMN "period" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_org_notification_events_period"
  ON "OrgNotificationEvents" ("organisationId", "userId", "key", "period");

COMMIT;
