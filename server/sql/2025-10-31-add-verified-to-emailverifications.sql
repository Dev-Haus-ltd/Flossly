-- Add verified column to EmailVerifications table
ALTER TABLE "dev"."EmailVerifications" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT FALSE;

