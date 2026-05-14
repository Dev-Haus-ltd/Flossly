BEGIN;

-- =====================================================
-- 1. EXTEND EXISTING CRM LEADS (GOOGLE ADS ATTRIBUTION)
-- =====================================================

ALTER TABLE "CrmLeads"
  ADD COLUMN IF NOT EXISTS "gclid" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "googleCampaignId" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "googleAdGroupId" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "googleAdId" VARCHAR(50);

CREATE INDEX IF NOT EXISTS "crmleads_gclid_idx"
  ON "CrmLeads" ("gclid");

CREATE INDEX IF NOT EXISTS "crmleads_google_campaign_idx"
  ON "CrmLeads" ("organisationId", "googleCampaignId");

-- =====================================================
-- 2. GOOGLE ADS ACCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS "GoogleAdsAccounts" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL UNIQUE
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "googleCustomerId" VARCHAR(50) NOT NULL UNIQUE,
  "name" VARCHAR(200),
  "currency" VARCHAR(10),
  "timezone" VARCHAR(50),
  "googleOAuthTokenId" INTEGER
    REFERENCES "GoogleOAuthTokens" ("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "google_ads_accounts_org_idx"
  ON "GoogleAdsAccounts" ("organisationId");

-- =====================================================
-- 3. GOOGLE ADS CAMPAIGNS
-- =====================================================

CREATE TABLE IF NOT EXISTS "GoogleAdsCampaigns" (
  "campaignId" VARCHAR(50) PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "googleCustomerId" VARCHAR(50) NOT NULL
    REFERENCES "GoogleAdsAccounts" ("googleCustomerId") ON DELETE CASCADE,
  "name" VARCHAR(200),
  "status" VARCHAR(50),
  "advertisingChannelType" VARCHAR(50),
  "amountMicros" BIGINT,
  "budgetType" VARCHAR(50),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "google_campaigns_org_idx"
  ON "GoogleAdsCampaigns" ("organisationId");

-- =====================================================
-- 4. GOOGLE ADS AD GROUPS
-- =====================================================

CREATE TABLE IF NOT EXISTS "GoogleAdsAdGroups" (
  "adGroupId" VARCHAR(50) PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "campaignId" VARCHAR(50) NOT NULL
    REFERENCES "GoogleAdsCampaigns" ("campaignId") ON DELETE CASCADE,
  "name" VARCHAR(200),
  "status" VARCHAR(50),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "google_adgroups_org_idx"
  ON "GoogleAdsAdGroups" ("organisationId");

-- =====================================================
-- 5. GOOGLE ADS ADS
-- =====================================================

CREATE TABLE IF NOT EXISTS "GoogleAdsAds" (
  "adId" VARCHAR(50) PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "adGroupId" VARCHAR(50) NOT NULL
    REFERENCES "GoogleAdsAdGroups" ("adGroupId") ON DELETE CASCADE,
  "name" VARCHAR(200),
  "status" VARCHAR(50),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "google_ads_org_idx"
  ON "GoogleAdsAds" ("organisationId");

-- =====================================================
-- 6. GOOGLE ADS INSIGHTS (TIME SERIES Performance)
-- =====================================================

CREATE TABLE IF NOT EXISTS "GoogleAdsInsights" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "entityType" VARCHAR(20) NOT NULL
    CHECK ("entityType" IN ('account', 'campaign', 'adgroup', 'ad')),
  "entityId" VARCHAR(50) NOT NULL,
  "date" DATE NOT NULL,
  "impressions" INTEGER,
  "clicks" INTEGER,
  "costMicros" BIGINT,
  "conversions" DOUBLE PRECISION,
  "interactions" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "google_insights_entity_idx"
  ON "GoogleAdsInsights" ("organisationId", "entityType", "entityId", "date");

CREATE INDEX IF NOT EXISTS "google_insights_date_idx"
  ON "GoogleAdsInsights" ("organisationId", "date");

COMMIT;
