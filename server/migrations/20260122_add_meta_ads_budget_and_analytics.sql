BEGIN;

-- =====================================================
-- 1. EXTEND EXISTING CRM LEADS (ATTRIBUTION)
-- =====================================================

ALTER TABLE "CrmLeads"
  ADD COLUMN IF NOT EXISTS "campaignId" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "adSetId" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "adId" VARCHAR(50);

CREATE INDEX IF NOT EXISTS "crmleads_campaign_idx"
  ON "CrmLeads" ("organisationId", "campaignId");

CREATE INDEX IF NOT EXISTS "crmleads_adset_idx"
  ON "CrmLeads" ("organisationId", "adSetId");

CREATE INDEX IF NOT EXISTS "crmleads_ad_idx"
  ON "CrmLeads" ("organisationId", "adId");

CREATE INDEX IF NOT EXISTS "crmleads_leadid_idx"
  ON "CrmLeads" ("leadId");

-- =====================================================
-- 2. META AD ACCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS "MetaAdAccounts" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "adAccountId" VARCHAR(50) NOT NULL UNIQUE,
  "name" VARCHAR(200),
  "currency" VARCHAR(10) NOT NULL,
  "timezone" VARCHAR(50) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "meta_adaccounts_org_idx"
  ON "MetaAdAccounts" ("organisationId");

-- =====================================================
-- 3. META CAMPAIGNS (CAMPAIGN-LEVEL BUDGET)
-- =====================================================

CREATE TABLE IF NOT EXISTS "MetaCampaigns" (
  "campaignId" VARCHAR(50) PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "adAccountId" VARCHAR(50) NOT NULL
    REFERENCES "MetaAdAccounts" ("adAccountId") ON DELETE CASCADE,
  "name" VARCHAR(200),
  "status" VARCHAR(50),
  "dailyBudget" INTEGER,
  "lifetimeBudget" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "meta_campaigns_org_idx"
  ON "MetaCampaigns" ("organisationId");

CREATE INDEX IF NOT EXISTS "meta_campaigns_account_idx"
  ON "MetaCampaigns" ("adAccountId");

-- =====================================================
-- 4. META AD SETS (AD SET-LEVEL BUDGET)
-- =====================================================

CREATE TABLE IF NOT EXISTS "MetaAdSets" (
  "adSetId" VARCHAR(50) PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "campaignId" VARCHAR(50) NOT NULL
    REFERENCES "MetaCampaigns" ("campaignId") ON DELETE CASCADE,
  "name" VARCHAR(200),
  "dailyBudget" INTEGER,
  "lifetimeBudget" INTEGER,
  "optimizationGoal" VARCHAR(100),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "meta_adsets_org_idx"
  ON "MetaAdSets" ("organisationId");

CREATE INDEX IF NOT EXISTS "meta_adsets_campaign_idx"
  ON "MetaAdSets" ("campaignId");

-- =====================================================
-- 5. META ADS (OPTIONAL BUT RECOMMENDED)
-- =====================================================

CREATE TABLE IF NOT EXISTS "MetaAds" (
  "adId" VARCHAR(50) PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "adSetId" VARCHAR(50) NOT NULL
    REFERENCES "MetaAdSets" ("adSetId") ON DELETE CASCADE,
  "name" VARCHAR(200),
  "status" VARCHAR(50),
  "creativeId" VARCHAR(50),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "meta_ads_org_idx"
  ON "MetaAds" ("organisationId");

CREATE INDEX IF NOT EXISTS "meta_ads_adset_idx"
  ON "MetaAds" ("adSetId");

-- =====================================================
-- 6. META INSIGHTS (ANALYTICS - TIME SERIES)
-- =====================================================

CREATE TABLE IF NOT EXISTS "MetaInsights" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "entityType" VARCHAR(20) NOT NULL
    CHECK ("entityType" IN ('campaign', 'adset', 'ad')),
  "entityId" VARCHAR(50) NOT NULL,
  "date" DATE NOT NULL,
  "impressions" INTEGER,
  "clicks" INTEGER,
  "spend" INTEGER,
  "leads" INTEGER,
  "cpc" DOUBLE PRECISION,
  "ctr" DOUBLE PRECISION,
  "cpm" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "meta_insights_entity_idx"
  ON "MetaInsights" ("organisationId", "entityType", "entityId", "date");

CREATE INDEX IF NOT EXISTS "meta_insights_date_idx"
  ON "MetaInsights" ("organisationId", "date");

COMMIT;
