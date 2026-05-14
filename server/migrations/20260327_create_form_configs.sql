-- Migration: Create FormConfigs table for lead capture form builder
-- Run date: 2026-03-27

CREATE TABLE IF NOT EXISTS "FormConfigs" (
  "id"             SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations"("id") ON DELETE CASCADE,
  "name"           VARCHAR(120) NOT NULL,
  "token"          VARCHAR(64)  NOT NULL UNIQUE,
  "fields"         JSONB        NOT NULL DEFAULT '[]',
  "active"         BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS form_configs_token_idx ON "FormConfigs" ("token");
CREATE INDEX IF NOT EXISTS form_configs_org_idx ON "FormConfigs" ("organisationId");
