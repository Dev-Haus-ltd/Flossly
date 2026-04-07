-- Set schema to dev
SET search_path TO dev;

BEGIN;

-- Create OrganisationSmtp table for custom SMTP configurations per organization
CREATE TABLE IF NOT EXISTS "OrganisationSmtps" (
  id SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  secure BOOLEAN DEFAULT FALSE,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(500) NOT NULL,
  "fromEmail" VARCHAR(255),
  "fromName" VARCHAR(255),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_organisationSmtp_organisationId" ON "OrganisationSmtps"("organisationId");
CREATE INDEX IF NOT EXISTS "idx_organisationSmtp_status" ON "OrganisationSmtps"(status);

COMMIT;
