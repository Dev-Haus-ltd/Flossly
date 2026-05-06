BEGIN;

-- =====================================================
-- GOOGLE SEARCH CONSOLE SITE PAGES
-- =====================================================
-- Stores individual page URLs discovered under a GSC site
-- Supports multiple organizations connecting the same site
-- Designed for periodic cron job syncing

CREATE TABLE IF NOT EXISTS "GoogleSearchConsoleSitePages" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL
    REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "siteId" INTEGER NOT NULL
    REFERENCES "GoogleSearchConsoleSites" ("id") ON DELETE CASCADE,
  "pageUrl" TEXT NOT NULL,
  "lastFetchedAt" TIMESTAMPTZ,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastAnalyticsSyncAt" TIMESTAMPTZ,
  "lastSyncError" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint to prevent duplicate pages per org/site
CREATE UNIQUE INDEX IF NOT EXISTS "gsc_site_pages_unique_idx"
  ON "GoogleSearchConsoleSitePages" ("organisationId", "siteId", "pageUrl");

-- Efficient queries for active pages under a site
CREATE INDEX IF NOT EXISTS "gsc_site_pages_site_active_idx"
  ON "GoogleSearchConsoleSitePages" ("siteId", "isActive");

-- Organisation-level queries
CREATE INDEX IF NOT EXISTS "gsc_site_pages_org_idx"
  ON "GoogleSearchConsoleSitePages" ("organisationId");

-- For cron jobs to find pages needing analytics refresh
CREATE INDEX IF NOT EXISTS "gsc_site_pages_sync_idx"
  ON "GoogleSearchConsoleSitePages" ("siteId", "isActive", "lastAnalyticsSyncAt");

COMMIT;

