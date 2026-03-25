-- Add videoId column to MetaAds (stores Meta video asset ID for inline playback)
ALTER TABLE "MetaAds"
  ADD COLUMN IF NOT EXISTS "videoId" VARCHAR(50) NULL;
