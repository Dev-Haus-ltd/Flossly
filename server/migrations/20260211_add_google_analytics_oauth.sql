BEGIN;

-- =====================================================
-- 1. GOOGLE OAUTH TOKENS (Flexible Multi-Account Support)
-- =====================================================
-- Stores OAuth tokens for Google services (GSC & Business Profile)
-- Supports multiple accounts per organization with scope tracking

CREATE TABLE IF NOT EXISTS "GoogleOAuthTokens" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL
    REFERENCES "Users" ("id") ON DELETE CASCADE,
  "googleAccountEmail" VARCHAR(255),
  "googleAccountId" VARCHAR(100),
  "accessTokenEnc" TEXT NOT NULL,
  "refreshTokenEnc" TEXT,
  "scopes" JSONB NOT NULL DEFAULT '[]',
  "expiresAt" TIMESTAMPTZ,
  "status" VARCHAR(20) NOT NULL DEFAULT 'Active'
    CHECK ("status" IN ('Active', 'Revoked', 'Expired')),
  "lastUsedAt" TIMESTAMPTZ,
  "connectedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "google_oauth_tokens_org_status_idx"
  ON "GoogleOAuthTokens" ("organisationId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "google_oauth_tokens_org_account_active_idx"
  ON "GoogleOAuthTokens" ("organisationId", "googleAccountId")
  WHERE "status" = 'Active';

-- =====================================================
-- 2. GOOGLE SEARCH CONSOLE SITES
-- =====================================================
-- Stores verified sites from Google Search Console

CREATE TABLE IF NOT EXISTS "GoogleSearchConsoleSites" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "googleOAuthTokenId" INTEGER NOT NULL
    REFERENCES "GoogleOAuthTokens" ("id") ON DELETE CASCADE,
  "siteUrl" VARCHAR(500) NOT NULL,
  "siteType" VARCHAR(20)
    CHECK ("siteType" IN ('URL_PREFIX', 'DOMAIN')),
  "permissionLevel" VARCHAR(50),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastSyncAt" TIMESTAMPTZ,
  "lastSyncError" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "gsc_sites_org_active_idx"
  ON "GoogleSearchConsoleSites" ("organisationId", "isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "gsc_sites_org_url_idx"
  ON "GoogleSearchConsoleSites" ("organisationId", "siteUrl");

CREATE INDEX IF NOT EXISTS "gsc_sites_token_idx"
  ON "GoogleSearchConsoleSites" ("googleOAuthTokenId");

-- =====================================================
-- 3. GOOGLE SEARCH CONSOLE PERFORMANCE (Time-Series Analytics)
-- =====================================================
-- Stores search performance data from GSC API

CREATE TABLE IF NOT EXISTS "GoogleSearchConsolePerformances" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "siteId" INTEGER NOT NULL
    REFERENCES "GoogleSearchConsoleSites" ("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "dimensionType" VARCHAR(20) NOT NULL DEFAULT 'aggregate',
  "dimensionValue" TEXT,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "ctr" DOUBLE PRECISION,
  "position" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "gsc_perf_site_date_idx"
  ON "GoogleSearchConsolePerformances" ("siteId", "date");

CREATE INDEX IF NOT EXISTS "gsc_perf_org_date_idx"
  ON "GoogleSearchConsolePerformances" ("organisationId", "date");

CREATE INDEX IF NOT EXISTS "gsc_perf_dimension_idx"
  ON "GoogleSearchConsolePerformances" ("siteId", "dimensionType", "date");

-- Unique constraint for dimension data (when dimensionValue is not null)
CREATE UNIQUE INDEX IF NOT EXISTS "gsc_perf_unique_dimension_idx"
  ON "GoogleSearchConsolePerformances" ("siteId", "date", "dimensionType", "dimensionValue")
  WHERE "dimensionValue" IS NOT NULL;

-- Unique constraint for aggregate data
CREATE UNIQUE INDEX IF NOT EXISTS "gsc_perf_unique_aggregate_idx"
  ON "GoogleSearchConsolePerformances" ("siteId", "date")
  WHERE "dimensionType" = 'aggregate';

-- =====================================================
-- 4. GOOGLE BUSINESS PROFILES (Placeholder for future expansion)
-- =====================================================
-- Stores Google Business Profile locations

CREATE TABLE IF NOT EXISTS "GoogleBusinessProfiles" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "googleOAuthTokenId" INTEGER NOT NULL
    REFERENCES "GoogleOAuthTokens" ("id") ON DELETE CASCADE,
  "locationName" VARCHAR(255) NOT NULL,
  "businessName" VARCHAR(255),
  "address" JSONB,
  "primaryPhone" VARCHAR(50),
  "websiteUrl" VARCHAR(500),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastSyncAt" TIMESTAMPTZ,
  "lastSyncError" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "gbp_org_active_idx"
  ON "GoogleBusinessProfiles" ("organisationId", "isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "gbp_org_location_idx"
  ON "GoogleBusinessProfiles" ("organisationId", "locationName");

CREATE INDEX IF NOT EXISTS "gbp_token_idx"
  ON "GoogleBusinessProfiles" ("googleOAuthTokenId");

COMMIT;

