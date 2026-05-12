-- CRM Automation Dictionary: global system-owned groups and templates
-- Admin panel manages these; orgs seed from these rather than from crmAutomationDefaults.js at runtime

CREATE TABLE IF NOT EXISTS "CrmAutomationDictionaryGroups" (
  id SERIAL PRIMARY KEY,
  key VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  category VARCHAR(80),
  ordering INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "crm_automation_dict_groups_status_idx"
ON "CrmAutomationDictionaryGroups" (status);

CREATE INDEX IF NOT EXISTS "crm_automation_dict_groups_category_idx"
ON "CrmAutomationDictionaryGroups" (category);

CREATE TABLE IF NOT EXISTS "CrmAutomationDictionaryTemplates" (
  id SERIAL PRIMARY KEY,
  "groupKey" VARCHAR(80) NOT NULL REFERENCES "CrmAutomationDictionaryGroups"(key) ON DELETE CASCADE,
  key VARCHAR(80) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL DEFAULT 'Email',
  name VARCHAR(150) NOT NULL,
  subject VARCHAR(200),
  template TEXT,
  trigger JSONB,
  "whatsappTemplateName" VARCHAR(150),
  "whatsappTemplateLanguage" VARCHAR(10),
  ordering INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "crm_automation_dict_templates_group_key_idx"
ON "CrmAutomationDictionaryTemplates" ("groupKey");

CREATE INDEX IF NOT EXISTS "crm_automation_dict_templates_status_idx"
ON "CrmAutomationDictionaryTemplates" (status);

CREATE INDEX IF NOT EXISTS "crm_automation_dict_templates_type_idx"
ON "CrmAutomationDictionaryTemplates" (type);
