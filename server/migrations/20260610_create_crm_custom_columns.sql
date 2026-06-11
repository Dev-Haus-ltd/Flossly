CREATE TABLE IF NOT EXISTS "CrmCustomColumnDefinitions" (
  "id"              SERIAL PRIMARY KEY,
  "organisationId"  INTEGER NOT NULL REFERENCES "Organisations"("id") ON DELETE CASCADE,
  "columnName"      VARCHAR(100) NOT NULL,
  "displayName"     VARCHAR(150) NOT NULL,
  "dataType"        VARCHAR(20) NOT NULL DEFAULT 'text'
                      CHECK ("dataType" IN ('text','number','date','boolean','dropdown')),
  "sortOrder"       INTEGER NOT NULL DEFAULT 0,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "dropdownOptions" JSONB,
  "createdBy"       INTEGER NOT NULL REFERENCES "Users"("id"),
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("organisationId", "columnName")
);

CREATE TABLE IF NOT EXISTS "LeadCustomFields" (
  "id"                 SERIAL PRIMARY KEY,
  "leadId"             INTEGER NOT NULL REFERENCES "CrmLeads"("id") ON DELETE CASCADE,
  "columnDefinitionId" INTEGER NOT NULL REFERENCES "CrmCustomColumnDefinitions"("id") ON DELETE CASCADE,
  "value"              TEXT,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("leadId", "columnDefinitionId")
);
