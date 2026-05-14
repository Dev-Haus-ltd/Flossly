BEGIN;

-- =====================================================
-- DENTIST SCHEDULES - Main Schedule Entity
-- =====================================================
CREATE TABLE IF NOT EXISTS "DentistSchedules" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "dentistId" INTEGER NOT NULL
    REFERENCES "Users" ("id") ON DELETE CASCADE,
  "scheduleName" VARCHAR(100) NOT NULL,
  "description" TEXT,
  
  -- Date range
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  
  -- Repeat pattern
  "repeatPattern" VARCHAR(20) NOT NULL DEFAULT 'weekly',
  
  -- Enable/disable toggle
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  "createdBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "updatedBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dentist_schedules_org_idx"
  ON "DentistSchedules" ("organisationId");

CREATE INDEX IF NOT EXISTS "dentist_schedules_dentist_idx"
  ON "DentistSchedules" ("dentistId");

CREATE INDEX IF NOT EXISTS "dentist_schedules_org_dentist_idx"
  ON "DentistSchedules" ("organisationId", "dentistId");

CREATE INDEX IF NOT EXISTS "dentist_schedules_active_idx"
  ON "DentistSchedules" ("isActive");

-- =====================================================
-- DENTIST SCHEDULE DAYS - Weekly Configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS "DentistScheduleDays" (
  "id" SERIAL PRIMARY KEY,
  "scheduleId" INTEGER NOT NULL
    REFERENCES "DentistSchedules" ("id") ON DELETE CASCADE,
  
  -- Day of week: 0 (Monday) to 6 (Sunday)
  "dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6),
  "dayName" VARCHAR(10) NOT NULL,
  
  -- Working hours
  "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
  "startTime" TIME,
  "endTime" TIME,
  
  -- Display order
  "order" INTEGER NOT NULL DEFAULT 0,
  
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dentist_schedule_days_schedule_idx"
  ON "DentistScheduleDays" ("scheduleId");

CREATE UNIQUE INDEX IF NOT EXISTS "dentist_schedule_days_schedule_day_uq"
  ON "DentistScheduleDays" ("scheduleId", "dayOfWeek");

-- =====================================================
-- DENTIST SCHEDULE BREAKS - Break Times per Day
-- =====================================================
CREATE TABLE IF NOT EXISTS "DentistScheduleBreaks" (
  "id" SERIAL PRIMARY KEY,
  "scheduleDayId" INTEGER NOT NULL
    REFERENCES "DentistScheduleDays" ("id") ON DELETE CASCADE,
  
  -- Break details
  "breakName" VARCHAR(50) NOT NULL DEFAULT 'Break',
  "startTime" TIME NOT NULL,
  "endTime" TIME NOT NULL,
  
  -- Display order
  "order" INTEGER NOT NULL DEFAULT 0,
  
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dentist_schedule_breaks_day_idx"
  ON "DentistScheduleBreaks" ("scheduleDayId");

COMMIT;
