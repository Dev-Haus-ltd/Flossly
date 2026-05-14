BEGIN;

-- =====================================================
-- 1) PATIENT CHART SNAPSHOTS
-- =====================================================
CREATE TABLE IF NOT EXISTS "DiaryPatientCharts" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "patientId" INTEGER NOT NULL
    REFERENCES "DiaryPatients" ("id") ON DELETE CASCADE,
  "chartJson" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "metaJson" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "diary_patient_charts_org_patient_uq"
  ON "DiaryPatientCharts" ("organisationId", "patientId");

-- =====================================================
-- 2) TREATMENT PLAN / BASE CHART ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS "DiaryTreatmentPlanItems" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "patientId" INTEGER NOT NULL
    REFERENCES "DiaryPatients" ("id") ON DELETE CASCADE,
  "planId" VARCHAR(80),
  "planName" VARCHAR(160),
  "appointmentGroupId" VARCHAR(80),
  "appointmentId" INTEGER
    REFERENCES "DiaryAppointments" ("id") ON DELETE SET NULL,
  "fdi" INTEGER,
  "surface" VARCHAR(40),
  "condition" VARCHAR(80),
  "conditionLabel" VARCHAR(160),
  "status" VARCHAR(30) NOT NULL DEFAULT 'planned',
  "priority" INTEGER NOT NULL DEFAULT 1,
  "cost" NUMERIC(10, 2) DEFAULT 0,
  "duration" INTEGER DEFAULT 0,
  "notes" TEXT,
  "clinicianName" VARCHAR(120),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "diary_treatment_plan_items_org_patient_idx"
  ON "DiaryTreatmentPlanItems" ("organisationId", "patientId");

CREATE INDEX IF NOT EXISTS "diary_treatment_plan_items_org_patient_appt_idx"
  ON "DiaryTreatmentPlanItems" ("organisationId", "patientId", "appointmentId");

-- =====================================================
-- 3) TREATMENT PLAN CONTAINERS
-- =====================================================
CREATE TABLE IF NOT EXISTS "DiaryTreatmentPlans" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "patientId" INTEGER NOT NULL
    REFERENCES "DiaryPatients" ("id") ON DELETE CASCADE,
  "planKey" VARCHAR(80) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "color" VARCHAR(24),
  "priority" INTEGER NOT NULL DEFAULT 1,
  "appointmentsJson" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "diary_treatment_plans_org_patient_key_uq"
  ON "DiaryTreatmentPlans" ("organisationId", "patientId", "planKey");

CREATE INDEX IF NOT EXISTS "diary_treatment_plans_org_patient_priority_idx"
  ON "DiaryTreatmentPlans" ("organisationId", "patientId", "priority");

-- =====================================================
-- 4) SAFE BACKFILL FOR OLDER DBs (when table existed)
-- =====================================================
ALTER TABLE "DiaryTreatmentPlanItems"
  ADD COLUMN IF NOT EXISTS "planId" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "planName" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "appointmentGroupId" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "appointmentId" INTEGER,
  ADD COLUMN IF NOT EXISTS "fdi" INTEGER,
  ADD COLUMN IF NOT EXISTS "surface" VARCHAR(40),
  ADD COLUMN IF NOT EXISTS "condition" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "conditionLabel" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "priority" INTEGER,
  ADD COLUMN IF NOT EXISTS "cost" NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS "duration" INTEGER,
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "clinicianName" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

ALTER TABLE "DiaryPatientCharts"
  ADD COLUMN IF NOT EXISTS "chartJson" JSONB,
  ADD COLUMN IF NOT EXISTS "metaJson" JSONB;

ALTER TABLE "DiaryTreatmentPlans"
  ADD COLUMN IF NOT EXISTS "planKey" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "name" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "color" VARCHAR(24),
  ADD COLUMN IF NOT EXISTS "priority" INTEGER,
  ADD COLUMN IF NOT EXISTS "appointmentsJson" JSONB,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

UPDATE "DiaryTreatmentPlanItems"
SET "status" = COALESCE(NULLIF("status", ''), 'planned')
WHERE "status" IS NULL OR "status" = '';

UPDATE "DiaryTreatmentPlanItems"
SET "priority" = COALESCE("priority", 1)
WHERE "priority" IS NULL;

UPDATE "DiaryTreatmentPlanItems"
SET "cost" = COALESCE("cost", 0)
WHERE "cost" IS NULL;

UPDATE "DiaryTreatmentPlanItems"
SET "duration" = COALESCE("duration", 0)
WHERE "duration" IS NULL;

UPDATE "DiaryPatientCharts"
SET "chartJson" = '{}'::jsonb
WHERE "chartJson" IS NULL;

UPDATE "DiaryPatientCharts"
SET "metaJson" = '{}'::jsonb
WHERE "metaJson" IS NULL;

UPDATE "DiaryTreatmentPlans"
SET "planKey" = COALESCE(NULLIF("planKey", ''), CONCAT('plan-', "id"))
WHERE "planKey" IS NULL OR "planKey" = '';

UPDATE "DiaryTreatmentPlans"
SET "name" = COALESCE(NULLIF("name", ''), 'Treatment Plan')
WHERE "name" IS NULL OR "name" = '';

UPDATE "DiaryTreatmentPlans"
SET "priority" = COALESCE("priority", 1)
WHERE "priority" IS NULL;

UPDATE "DiaryTreatmentPlans"
SET "appointmentsJson" = COALESCE("appointmentsJson", '[]'::jsonb)
WHERE "appointmentsJson" IS NULL;

ALTER TABLE "DiaryTreatmentPlanItems"
  ALTER COLUMN "status" SET DEFAULT 'planned',
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "priority" SET DEFAULT 1,
  ALTER COLUMN "priority" SET NOT NULL,
  ALTER COLUMN "cost" SET DEFAULT 0,
  ALTER COLUMN "duration" SET DEFAULT 0;

ALTER TABLE "DiaryPatientCharts"
  ALTER COLUMN "chartJson" SET DEFAULT '{}'::jsonb,
  ALTER COLUMN "chartJson" SET NOT NULL,
  ALTER COLUMN "metaJson" SET DEFAULT '{}'::jsonb,
  ALTER COLUMN "metaJson" SET NOT NULL;

ALTER TABLE "DiaryTreatmentPlans"
  ALTER COLUMN "planKey" SET NOT NULL,
  ALTER COLUMN "name" SET NOT NULL,
  ALTER COLUMN "priority" SET DEFAULT 1,
  ALTER COLUMN "priority" SET NOT NULL,
  ALTER COLUMN "appointmentsJson" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "appointmentsJson" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'diary_treatment_plan_items_appointment_fk'
  ) THEN
    ALTER TABLE "DiaryTreatmentPlanItems"
      ADD CONSTRAINT "diary_treatment_plan_items_appointment_fk"
      FOREIGN KEY ("appointmentId") REFERENCES "DiaryAppointments" ("id") ON DELETE SET NULL;
  END IF;
END
$$;

COMMIT;
