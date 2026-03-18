BEGIN;

-- ============================================================================
-- Migration: Fix Meta ad schema — composite unique keys + insights dedup
-- IDEMPOTENT: safe to run multiple times — every step checks before acting.
--
-- Problems fixed:
--   1. MetaCampaigns / MetaAdSets / MetaAds used the Meta entity ID as sole PK.
--      Sequelize upsert() targets the PK, so syncing the same campaign for a
--      different org silently overwrote organisationId, stealing data.
--   2. MetaAdAccounts had adAccountId as globally-unique. Same cross-org risk.
--   3. MetaInsights had no UNIQUE constraint. Every sync run inserted new rows
--      instead of updating, so the table grew unboundedly and all totals were
--      inflated by the number of syncs that had run.
-- ============================================================================


-- ============================================================================
-- STEP 0 — Drop ALL FK constraints on CrmLeads that point at the old string PKs
--           (MetaCampaigns.campaignId, MetaAdSets.adSetId, MetaAds.adId).
--           PostgreSQL blocks dropping a PK while any FK references its index.
-- ============================================================================

DO $$
DECLARE r RECORD;
BEGIN
  -- FKs from CrmLeads → MetaCampaigns (campaignId)
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_class f ON f.oid = c.confrelid
    WHERE t.relname = 'CrmLeads'
      AND f.relname = 'MetaCampaigns'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE dev."CrmLeads" DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  -- FKs from CrmLeads → MetaAdSets (adSetId)
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_class f ON f.oid = c.confrelid
    WHERE t.relname = 'CrmLeads'
      AND f.relname = 'MetaAdSets'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE dev."CrmLeads" DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  -- FKs from CrmLeads → MetaAds (adId)
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_class f ON f.oid = c.confrelid
    WHERE t.relname = 'CrmLeads'
      AND f.relname = 'MetaAds'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE dev."CrmLeads" DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;


-- ============================================================================
-- STEP 1 — Drop FK constraints between the Meta tables themselves
-- ============================================================================

ALTER TABLE dev."MetaAdSets"
  DROP CONSTRAINT IF EXISTS "MetaAdSets_campaignId_fkey";

ALTER TABLE dev."MetaAds"
  DROP CONSTRAINT IF EXISTS "MetaAds_adSetId_fkey";

ALTER TABLE dev."MetaCampaigns"
  DROP CONSTRAINT IF EXISTS "MetaCampaigns_adAccountId_fkey";


-- ============================================================================
-- STEP 2 — MetaCampaigns: string PK → autoincrement id + composite unique
-- ============================================================================

-- Add id column (no-op if already present)
ALTER TABLE dev."MetaCampaigns"
  ADD COLUMN IF NOT EXISTS "id" SERIAL;

-- Drop old string PK only if it still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaCampaigns"'::regclass
      AND contype   = 'p'
      AND conname   = 'MetaCampaigns_pkey'
  ) THEN
    ALTER TABLE dev."MetaCampaigns" DROP CONSTRAINT "MetaCampaigns_pkey";
  END IF;
END $$;

-- Promote id to PK only if MetaCampaigns has no PK yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaCampaigns"'::regclass
      AND contype  = 'p'
  ) THEN
    ALTER TABLE dev."MetaCampaigns" ADD PRIMARY KEY ("id");
  END IF;
END $$;

-- Add composite unique only if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaCampaigns"'::regclass
      AND conname  = 'meta_campaigns_campaign_org_uq'
  ) THEN
    ALTER TABLE dev."MetaCampaigns"
      ADD CONSTRAINT "meta_campaigns_campaign_org_uq"
      UNIQUE ("campaignId", "organisationId");
  END IF;
END $$;


-- ============================================================================
-- STEP 3 — MetaAdSets: string PK → autoincrement id + composite unique
-- ============================================================================

ALTER TABLE dev."MetaAdSets"
  ADD COLUMN IF NOT EXISTS "id" SERIAL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaAdSets"'::regclass
      AND contype   = 'p'
      AND conname   = 'MetaAdSets_pkey'
  ) THEN
    ALTER TABLE dev."MetaAdSets" DROP CONSTRAINT "MetaAdSets_pkey";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaAdSets"'::regclass
      AND contype  = 'p'
  ) THEN
    ALTER TABLE dev."MetaAdSets" ADD PRIMARY KEY ("id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaAdSets"'::regclass
      AND conname  = 'meta_adsets_adset_org_uq'
  ) THEN
    ALTER TABLE dev."MetaAdSets"
      ADD CONSTRAINT "meta_adsets_adset_org_uq"
      UNIQUE ("adSetId", "organisationId");
  END IF;
END $$;


-- ============================================================================
-- STEP 4 — MetaAds: string PK → autoincrement id + composite unique
--           Also add columns missing from the original DDL
-- ============================================================================

ALTER TABLE dev."MetaAds"
  ADD COLUMN IF NOT EXISTS "id" SERIAL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaAds"'::regclass
      AND contype   = 'p'
      AND conname   = 'MetaAds_pkey'
  ) THEN
    ALTER TABLE dev."MetaAds" DROP CONSTRAINT "MetaAds_pkey";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaAds"'::regclass
      AND contype  = 'p'
  ) THEN
    ALTER TABLE dev."MetaAds" ADD PRIMARY KEY ("id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaAds"'::regclass
      AND conname  = 'meta_ads_ad_org_uq'
  ) THEN
    ALTER TABLE dev."MetaAds"
      ADD CONSTRAINT "meta_ads_ad_org_uq"
      UNIQUE ("adId", "organisationId");
  END IF;
END $$;

ALTER TABLE dev."MetaAds"
  ADD COLUMN IF NOT EXISTS "platform"  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "imageUrl"  TEXT,
  ADD COLUMN IF NOT EXISTS "body"      TEXT;


-- ============================================================================
-- STEP 5 — MetaAdAccounts: drop global unique, replace with composite unique
-- ============================================================================

ALTER TABLE dev."MetaAdAccounts"
  DROP CONSTRAINT IF EXISTS "MetaAdAccounts_adAccountId_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaAdAccounts"'::regclass
      AND conname  = 'meta_adaccounts_account_org_uq'
  ) THEN
    ALTER TABLE dev."MetaAdAccounts"
      ADD CONSTRAINT "meta_adaccounts_account_org_uq"
      UNIQUE ("adAccountId", "organisationId");
  END IF;
END $$;


-- ============================================================================
-- STEP 6 — MetaInsights: add missing columns, deduplicate, add unique constraint
-- ============================================================================

ALTER TABLE dev."MetaInsights"
  ADD COLUMN IF NOT EXISTS "reach"         INTEGER,
  ADD COLUMN IF NOT EXISTS "frequency"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "purchase_roas" DOUBLE PRECISION;

-- Deduplicate: keep the highest id (latest) per (org, entityType, entityId, date)
-- Safe to re-run — if no duplicates exist, HAVING COUNT(*) > 1 returns nothing
DELETE FROM dev."MetaInsights" AS mi
USING (
  SELECT
    "organisationId",
    "entityType",
    "entityId",
    "date",
    MAX(id) AS keep_id
  FROM dev."MetaInsights"
  GROUP BY "organisationId", "entityType", "entityId", "date"
  HAVING COUNT(*) > 1
) AS dupes
WHERE mi."organisationId" = dupes."organisationId"
  AND mi."entityType"     = dupes."entityType"
  AND mi."entityId"       = dupes."entityId"
  AND mi."date"           = dupes."date"
  AND mi.id               < dupes.keep_id;

-- Drop the old non-unique index before adding the unique constraint
DROP INDEX IF EXISTS dev."meta_insights_entity_idx";

-- Add unique constraint only if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'dev."MetaInsights"'::regclass
      AND conname  = 'meta_insights_entity_date_uq'
  ) THEN
    ALTER TABLE dev."MetaInsights"
      ADD CONSTRAINT "meta_insights_entity_date_uq"
      UNIQUE ("organisationId", "entityType", "entityId", "date");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "meta_insights_org_date_idx"
  ON dev."MetaInsights" ("organisationId", "date");


-- ============================================================================
-- STEP 7 — Supporting indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS "meta_campaigns_org_idx2"
  ON dev."MetaCampaigns" ("organisationId");

CREATE INDEX IF NOT EXISTS "meta_adsets_campaign_idx2"
  ON dev."MetaAdSets" ("campaignId");

CREATE INDEX IF NOT EXISTS "meta_adsets_org_idx2"
  ON dev."MetaAdSets" ("organisationId");

CREATE INDEX IF NOT EXISTS "meta_ads_adset_idx2"
  ON dev."MetaAds" ("adSetId");

CREATE INDEX IF NOT EXISTS "meta_ads_org_idx2"
  ON dev."MetaAds" ("organisationId");

COMMIT;
