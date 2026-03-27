BEGIN;

ALTER TABLE "DiaryTreatmentPlanItems"
  ADD COLUMN IF NOT EXISTS "practitionerId" INTEGER,
  ADD COLUMN IF NOT EXISTS "practitionerName" VARCHAR(120);

CREATE INDEX IF NOT EXISTS "diary_treatment_plan_items_practitioner_id_idx"
  ON "DiaryTreatmentPlanItems" ("practitionerId");

COMMIT;
