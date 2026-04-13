-- Add lifetimeReach and linkClicks columns to MetaInsights
-- lifetimeReach: deduplicated reach over the full sync window (matches Meta Ads Manager)
-- linkClicks: outbound link clicks from actions[link_click] (matches Ads Manager "Link Clicks")
ALTER TABLE "MetaInsights"
  ADD COLUMN IF NOT EXISTS "lifetimeReach" INTEGER,
  ADD COLUMN IF NOT EXISTS "linkClicks"    INTEGER;
