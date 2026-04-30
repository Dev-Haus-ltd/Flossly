BEGIN;

-- =====================================================
-- ENUM TYPES (SAFE CREATE)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE zone_repeat_pattern AS ENUM (
    'weekly',
    'bi-weekly',
    'monthly'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE zone_display_type AS ENUM (
    'border',
    'background',
    'both'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- COMMON TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DIARY ZONES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "DiaryZones" (
  "id" SERIAL PRIMARY KEY,

  "organisationId" INTEGER NOT NULL 
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,

  "dentistId" INTEGER NOT NULL 
    REFERENCES "Users" ("id") ON DELETE CASCADE,
  
  -- Basic info
  "title" VARCHAR(100) NOT NULL,
  "description" TEXT,
  
  -- Color styling
  "color" VARCHAR(7) NOT NULL DEFAULT '#0061FB',
  
  -- Time range
  "startTime" TIME NOT NULL,
  "endTime" TIME NOT NULL,
  
  -- Date range
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  
  -- Days selection (0 = Monday, 6 = Sunday)
  "selectedDays" INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  
  -- Recurrence pattern
  "repeatPattern" zone_repeat_pattern NOT NULL DEFAULT 'weekly',
  
  -- Display style
  "displayType" zone_display_type NOT NULL DEFAULT 'background',
  
  -- Enable/disable
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  "createdBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "updatedBy" INTEGER REFERENCES "Users" ("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- =====================================================
  -- CONSTRAINTS
  -- =====================================================
  
  CONSTRAINT "check_time_valid"
    CHECK ("startTime" < "endTime"),

  CONSTRAINT "check_date_valid"
    CHECK ("startDate" <= "endDate")
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS "diary_zones_organisation_idx"
  ON "DiaryZones" ("organisationId");

CREATE INDEX IF NOT EXISTS "diary_zones_dentist_idx"
  ON "DiaryZones" ("dentistId");

CREATE INDEX IF NOT EXISTS "diary_zones_organisation_dentist_idx"
  ON "DiaryZones" ("organisationId", "dentistId");

CREATE INDEX IF NOT EXISTS "diary_zones_active_idx"
  ON "DiaryZones" ("isActive");

CREATE INDEX IF NOT EXISTS "diary_zones_date_range_idx"
  ON "DiaryZones" ("startDate", "endDate");

CREATE INDEX IF NOT EXISTS "diary_zones_organisation_active_idx"
  ON "DiaryZones" ("organisationId", "isActive");

CREATE INDEX IF NOT EXISTS "diary_zones_selected_days_idx"
  ON "DiaryZones" USING GIN ("selectedDays");

-- =====================================================
-- TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS "update_diary_zones_updated_at" ON "DiaryZones";

CREATE TRIGGER "update_diary_zones_updated_at"
BEFORE UPDATE ON "DiaryZones"
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

COMMIT;