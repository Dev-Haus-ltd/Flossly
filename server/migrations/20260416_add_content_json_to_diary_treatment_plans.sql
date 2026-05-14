ALTER TABLE "DiaryTreatmentPlans"
  ADD COLUMN IF NOT EXISTS "contentJson" JSONB NOT NULL DEFAULT '{}'::jsonb;
