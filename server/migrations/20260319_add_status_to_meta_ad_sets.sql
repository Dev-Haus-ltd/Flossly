-- Add status column to MetaAdSets (mirrors MetaAd.status, populated via Meta API sync)
ALTER TABLE "MetaAdSets"
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NULL;
