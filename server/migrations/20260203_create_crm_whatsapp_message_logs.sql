CREATE TABLE IF NOT EXISTS "CrmWhatsAppMessageLogs" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations" ("id") ON DELETE CASCADE,
  "leadId" INTEGER NULL REFERENCES "CrmLeads" ("id") ON DELETE SET NULL,
  "to" VARCHAR(32),
  "direction" VARCHAR(16) NOT NULL DEFAULT 'outbound',
  "type" VARCHAR(16) NOT NULL DEFAULT 'text',
  "templateName" VARCHAR(150),
  "status" VARCHAR(16) NOT NULL DEFAULT 'sent',
  "providerMessageId" VARCHAR(128),
  "error" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_whatsapp_logs_org_created"
  ON "CrmWhatsAppMessageLogs" ("organisationId", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_whatsapp_logs_org_status"
  ON "CrmWhatsAppMessageLogs" ("organisationId", "status");
