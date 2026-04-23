ALTER TABLE "Organisations"
  ADD COLUMN IF NOT EXISTS "workingTimings" JSONB NOT NULL DEFAULT '{
    "monday": { "startTime": "09:00", "endTime": "17:00" },
    "tuesday": { "startTime": "09:00", "endTime": "17:00" },
    "wednesday": { "startTime": "09:00", "endTime": "17:00" },
    "thursday": { "startTime": "09:00", "endTime": "17:00" },
    "friday": { "startTime": "09:00", "endTime": "17:00" },
    "saturday": { "startTime": "09:00", "endTime": "17:00" },
    "sunday": { "startTime": "09:00", "endTime": "17:00" }
  }'::jsonb;
