-- Add completion tracking fields to DiaryTreatmentPlanItems
-- Allows recording when a treatment was completed and by whom
ALTER TABLE "DiaryTreatmentPlanItems"
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "completedByPractitionerId" INTEGER,
  ADD COLUMN IF NOT EXISTS "completedByPractitionerName" VARCHAR(120);
