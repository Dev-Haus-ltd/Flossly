-- Create CRM Options table
CREATE TABLE IF NOT EXISTS "CrmOptions" (
  id SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations"(id),
  category VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  color VARCHAR(20) NULL,
  ordering INTEGER NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM Lead Communications table
CREATE TABLE IF NOT EXISTS "CrmLeadCommunications" (
  id SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "Organisations"(id),
  "leadId" INTEGER NOT NULL REFERENCES "CrmLeads"(id),
  "preferredContactMethod" VARCHAR(50),
  "preferredAppointmentDay" VARCHAR(20),
  "bestTimesToContact" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Soft delete column on CrmLeads
ALTER TABLE "CrmLeads" ADD COLUMN IF NOT EXISTS "softDeleted" BOOLEAN NOT NULL DEFAULT FALSE;

