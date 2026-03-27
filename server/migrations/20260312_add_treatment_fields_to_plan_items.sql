BEGIN;

ALTER TABLE "DiaryTreatmentPlanItems"
  ADD COLUMN IF NOT EXISTS "treatmentId" INTEGER,
  ADD COLUMN IF NOT EXISTS "treatmentCode" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "treatmentName" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "treatmentCategory" VARCHAR(120);

CREATE INDEX IF NOT EXISTS "diary_treatment_plan_items_treatment_id_idx"
  ON "DiaryTreatmentPlanItems" ("treatmentId");

COMMIT;
