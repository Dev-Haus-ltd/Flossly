-- Add organisationId to UserNotifications table
-- This allows filtering notifications by organization

ALTER TABLE "UserNotifications" 
ADD COLUMN IF NOT EXISTS "organisationId" INTEGER REFERENCES "Organisations"(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_notifications_organisation 
ON "UserNotifications"("organisationId");

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_org 
ON "UserNotifications"("userId", "organisationId");
