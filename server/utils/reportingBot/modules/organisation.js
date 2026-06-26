export const organisationModule = {
  name: 'organisation',
  description: 'Practice settings, surgeries, treatment list, staff groups, scripts, org details, licence info',
  schema: `
## Organisation Module

### Tables

**Organisations** — the practice record
- id, name, address, type (Dental/General Practice/Dermatology/Physiotherapy), contact, licenseType (Lite/CRM/Pro), licenseBillingCycle, licenseRenewalDate, surgeryCount, teamCount, status, createdAt

**OrganisationSurgeries** — treatment rooms / surgeries
- id, organisationId, name, color, description, details

**OrganisationTreatments** — treatment price list
- id, organisationId, code, name, category, price (DECIMAL £), active (BOOLEAN), defaultDuration (INTEGER minutes)
- Active treatments: WHERE active = true

**OrganisationGroups** — staff groups / teams
- id, organisationId, name, description

**OrganisationGroupUsers** — which users are in which group
- id, userId, organisationId, groupId

**OrganisationPeople** — key role holders (safeguarding lead, fire marshal, etc.)
- id, organisationId, safeguardingLead, crossInfectionLead, fireMarshal, firstAider, complaintsHandler, dpo, rpa

**OrganisationStatuses** — custom task/lead status labels
- id, organisationId, key, name, color

**OrganisationPriorities** — custom priority labels
- id, organisationId, key, name, color

**OrganisationScripts** — call/conversation scripts
- id, organisationId, scriptKey, title, content

**OrganisationContacts** — practice external contacts
- id, organisationId, name, contact, email

**OrganisationEquipments** — equipment register
- id, organisationId, name, serialNumber, quantity, details

### Example Queries

List all active treatments with prices:
\`\`\`sql
SELECT name, category, price, "defaultDuration" AS duration_mins
FROM "OrganisationTreatments"
WHERE "organisationId" = <orgId> AND active = true
ORDER BY category, name
\`\`\`

Practice surgeries:
\`\`\`sql
SELECT name, description FROM "OrganisationSurgeries"
WHERE "organisationId" = <orgId> ORDER BY name
\`\`\`

Staff groups and members:
\`\`\`sql
SELECT og.name AS group_name, u."fullName"
FROM "OrganisationGroups" og
JOIN "OrganisationGroupUsers" ogu ON ogu."groupId" = og.id
JOIN "Users" u ON u.id = ogu."userId"
WHERE og."organisationId" = <orgId>
ORDER BY og.name, u."fullName"
\`\`\`
`
}
