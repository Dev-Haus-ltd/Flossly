BEGIN;

-- =====================================================
-- 1. EXPEND META INSIGHTS (NEW METRICS)
-- =====================================================

ALTER TABLE "MetaInsights"
  ADD COLUMN IF NOT EXISTS "reach" INTEGER,
  ADD COLUMN IF NOT EXISTS "frequency" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "purchase_roas" DOUBLE PRECISION;

-- =====================================================
-- 2. EXPEND META ADS (CREATIVE DETAILS)
-- =====================================================

ALTER TABLE "MetaAds"
  ADD COLUMN IF NOT EXISTS "platform" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "body" TEXT;

COMMIT;
