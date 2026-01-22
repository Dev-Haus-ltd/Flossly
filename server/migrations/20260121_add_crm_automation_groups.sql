CREATE TABLE IF NOT EXISTS "CrmAutomationGroups" (
  id SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations"(id) ON DELETE CASCADE,
  key VARCHAR(80) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  enabled BOOLEAN NOT NULL DEFAULT false,
  ordering INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "crm_automation_groups_org_key_idx"
ON "CrmAutomationGroups" ("organisationId", key);

CREATE TABLE IF NOT EXISTS "CrmAutomationGroupTemplates" (
  id SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations"(id) ON DELETE CASCADE,
  "groupId" INTEGER NOT NULL REFERENCES "CrmAutomationGroups"(id) ON DELETE CASCADE,
  "templateKey" VARCHAR(80) NOT NULL,
  ordering INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "crm_automation_group_templates_unique_idx"
ON "CrmAutomationGroupTemplates" ("organisationId", "groupId", "templateKey");

CREATE INDEX IF NOT EXISTS "crm_automation_group_templates_template_idx"
ON "CrmAutomationGroupTemplates" ("organisationId", "templateKey");
