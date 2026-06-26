export const crmModule = {
  name: 'crm',
  description: 'CRM leads, pipeline, contact attempts, speed-to-lead, conversion rates, follow-ups, alert types, staff performance on leads, automation status',
  schema: `
## CRM Module

### Tables

**CrmLeads** — all inbound leads
- id, organisationId, name, email, telephone, leadSource, leadStatus, treatment, inquiryDate (form submission timestamp), followUpDate, campaignId, adSetId, adId, googleCampaignId, gclid, rawData (JSONB), comments, alert, softDeleted, isDeleted, leadStatusChangedAt, autoReplyEnabled, createdAt, updatedAt
- Active leads: WHERE "softDeleted" = false AND "isDeleted" = false
- Lead statuses: New, Contacted, Converted, Lost, Uploaded, Archived
- Alert values: 'hot' (🔥 Hot Lead), 'urgent' (🚨 Urgent), 'high-value' (💸 High Value), 'call-required' (📞 Call Required), NULL = no alert
- Default time period: last 30 days unless specified

**CrmLeadNotes** — every contact attempt logged by staff
- id, organisationId, leadId, title, date (DATEONLY), time (VARCHAR), channel (Phone/Email/WhatsApp/SMS), summary, createdAt
- First contact attempt = MIN(createdAt) per leadId

**CrmLeadTreatments** — treatment and budget info
- id, organisationId, leadId, primaryTreatment (INTEGER), primaryTreatmentPrice (DECIMAL), secondaryTreatments (JSONB), budget (VARCHAR)

**CrmLeadAssignees** — staff assigned to a lead
- id, organisationId, leadId, userId, createdAt

**CrmLeadCommunications** — contact preferences
- id, organisationId, leadId, preferredContactMethod (Email/Phone/SMS/In-Person), preferredAppointmentDay, bestTimesToContact (JSONB)

**CrmOptions** — dropdown options per org
- id, organisationId, category, name, color, active
- category='lead_source' → lead source labels
- category='treatment' → treatment names

**CrmAutomationTemplates** — automation sequences
- id, organisationId, key, type (Email/WhatsApp), name, enabled, lastSentAt, isDeleted

### Average Treatment Values (for revenue estimates)
- Teeth Whitening: £350
- Composite Bonding: £800
- Teeth Straightening: £2,500
- INVISALIGN®: £3,500
- Veneers: £1,200 per tooth (assume 8 = £9,600)
- Smile Makeover: £8,000

### Key Metrics & Example Queries

**Pipeline breakdown by status:**
\`\`\`sql
SELECT "leadStatus", COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "softDeleted" = false AND "isDeleted" = false
GROUP BY "leadStatus" ORDER BY count DESC
\`\`\`

**Lead volume this month vs last month:**
\`\`\`sql
SELECT
  COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('month', NOW())) AS this_month,
  COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('month', NOW() - INTERVAL '1 month')
                    AND "createdAt" < date_trunc('month', NOW())) AS last_month
FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "softDeleted" = false AND "isDeleted" = false
\`\`\`

**Conversion rate by source with % change:**
\`\`\`sql
SELECT "leadSource",
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE "leadStatus" = 'Converted') AS converted,
  ROUND(COUNT(*) FILTER (WHERE "leadStatus" = 'Converted')::numeric / NULLIF(COUNT(*),0) * 100, 1) AS rate_pct
FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "softDeleted" = false AND "isDeleted" = false
GROUP BY "leadSource" ORDER BY total DESC
\`\`\`

**Speed to lead (avg minutes from inquiryDate to first CrmLeadNote):**
\`\`\`sql
WITH first_contact AS (
  SELECT "leadId", MIN("createdAt") AS first_contact_at
  FROM "CrmLeadNotes" WHERE "organisationId" = <orgId> GROUP BY "leadId"
)
SELECT
  l."leadSource",
  ROUND(AVG(EXTRACT(EPOCH FROM (fc.first_contact_at - l."inquiryDate")) / 60)) AS avg_minutes,
  COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (fc.first_contact_at - l."inquiryDate")) <= 3600) AS within_1hr,
  COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (fc.first_contact_at - l."inquiryDate")) <= 86400) AS within_24hr,
  COUNT(*) AS total_contacted
FROM "CrmLeads" l
JOIN first_contact fc ON fc."leadId" = l.id
WHERE l."organisationId" = <orgId> AND l."softDeleted" = false AND l."inquiryDate" IS NOT NULL
  AND fc.first_contact_at > l."inquiryDate"
GROUP BY l."leadSource"
\`\`\`

**Never contacted within 24h (last 30 days):**
\`\`\`sql
WITH first_contact AS (
  SELECT "leadId", MIN("createdAt") AS first_contact_at
  FROM "CrmLeadNotes" WHERE "organisationId" = <orgId> GROUP BY "leadId"
)
SELECT l."leadSource", COUNT(*) AS count
FROM "CrmLeads" l
LEFT JOIN first_contact fc ON fc."leadId" = l.id
WHERE l."organisationId" = <orgId> AND l."softDeleted" = false
  AND l."createdAt" >= NOW() - INTERVAL '30 days'
  AND (fc.first_contact_at IS NULL OR fc.first_contact_at > l."inquiryDate" + INTERVAL '24 hours')
GROUP BY l."leadSource"
\`\`\`

**Leads sitting in New > 7 days:**
\`\`\`sql
SELECT COUNT(*) AS count FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "leadStatus" = 'New'
  AND "softDeleted" = false AND "isDeleted" = false
  AND "createdAt" < NOW() - INTERVAL '7 days'
\`\`\`

**Overdue follow-ups:**
\`\`\`sql
SELECT l.id, l.name, l."leadStatus", l."followUpDate", u."fullName" AS assigned_to
FROM "CrmLeads" l
LEFT JOIN "CrmLeadAssignees" la ON la."leadId" = l.id AND la."organisationId" = l."organisationId"
LEFT JOIN "Users" u ON u.id = la."userId"
WHERE l."organisationId" = <orgId>
  AND l."softDeleted" = false AND l."isDeleted" = false
  AND l."followUpDate" < CURRENT_DATE
  AND l."leadStatus" NOT IN ('Converted', 'Lost', 'Archived')
ORDER BY l."followUpDate" ASC
\`\`\`

**Alert-based leads (hot, urgent, high-value):**
\`\`\`sql
SELECT alert, COUNT(*) AS count FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "softDeleted" = false
  AND alert IS NOT NULL AND alert != ''
  AND "leadStatus" NOT IN ('Converted', 'Lost', 'Archived')
GROUP BY alert
\`\`\`

**Staff performance leaderboard:**
\`\`\`sql
SELECT u."fullName",
  COUNT(l.id) AS total_assigned,
  COUNT(l.id) FILTER (WHERE l."leadStatus" = 'Converted') AS converted,
  ROUND(COUNT(l.id) FILTER (WHERE l."leadStatus" = 'Converted')::numeric / NULLIF(COUNT(l.id),0) * 100, 1) AS rate_pct
FROM "CrmLeadAssignees" la
JOIN "Users" u ON u.id = la."userId"
JOIN "CrmLeads" l ON l.id = la."leadId" AND l."organisationId" = la."organisationId"
WHERE la."organisationId" = <orgId>
  AND l."softDeleted" = false AND l."isDeleted" = false
GROUP BY u."fullName" ORDER BY converted DESC
\`\`\`

**Unassigned leads:**
\`\`\`sql
SELECT COUNT(*) AS unassigned FROM "CrmLeads" l
WHERE l."organisationId" = <orgId> AND l."softDeleted" = false AND l."isDeleted" = false
  AND l."leadStatus" NOT IN ('Converted', 'Lost', 'Archived')
  AND NOT EXISTS (SELECT 1 FROM "CrmLeadAssignees" la WHERE la."leadId" = l.id)
\`\`\`

**Treatment interest breakdown:**
\`\`\`sql
SELECT treatment, COUNT(*) AS enquiries,
  COUNT(*) FILTER (WHERE "leadStatus" = 'Converted') AS converted,
  ROUND(COUNT(*) FILTER (WHERE "leadStatus" = 'Converted')::numeric / NULLIF(COUNT(*),0) * 100, 1) AS rate_pct
FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "softDeleted" = false
  AND treatment IS NOT NULL AND treatment != ''
GROUP BY treatment ORDER BY enquiries DESC
\`\`\`

**Estimated pipeline value (using avg treatment values):**
\`\`\`sql
SELECT treatment,
  COUNT(*) AS leads,
  CASE treatment
    WHEN 'Teeth Whitening' THEN COUNT(*) * 350
    WHEN 'INVISALIGN' THEN COUNT(*) * 3500
    WHEN 'Smile Makeover' THEN COUNT(*) * 8000
    WHEN 'Veneers' THEN COUNT(*) * 9600
    WHEN 'Composite Bonding' THEN COUNT(*) * 800
    WHEN 'Teeth Straightening' THEN COUNT(*) * 2500
    ELSE 0
  END AS estimated_value_gbp
FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "softDeleted" = false
  AND "leadStatus" NOT IN ('Converted', 'Lost', 'Archived')
GROUP BY treatment ORDER BY estimated_value_gbp DESC
\`\`\`
`
}
