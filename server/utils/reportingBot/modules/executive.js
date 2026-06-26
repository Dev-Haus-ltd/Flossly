export const executiveModule = {
  name: 'executive',
  description: 'KPI dashboards, full practice summaries, cross-module insights, ROAS, pipeline value, top-level performance snapshots for practice owners',
  schema: `
## Executive / KPI Summary Module

This module covers high-level practice performance snapshots that combine multiple data domains.
For each metric below, fetch the data from the relevant tables.

### Key Tables (cross-module)
- CrmLeads (organisationId, leadStatus, leadSource, treatment, createdAt, softDeleted, isDeleted)
- CrmLeadNotes (organisationId, leadId, createdAt) — contact attempts
- DiaryAppointments (organisationId, status, startTime, isDeleted)
- DiaryPatients (organisationId, isDeleted, createdAt)
- PatientInvoices (organisationId, status, total, amountPaid, invoiceDate)
- MetaInsights (organisationId, entityType, spend, leads, date)
- UserTasks (organisationId, isArchieved, dueDate, statusId)
- DefaultStatuses (id, key, name) — task statuses

### Average Treatment Values (for pipeline value estimates)
- Teeth Whitening: £350
- Composite Bonding: £800
- Teeth Straightening: £2,500
- INVISALIGN®: £3,500
- Veneers: £9,600 (8 teeth)
- Smile Makeover: £8,000
- Default/unknown: £1,500

### KPI Summary Approach
For a full KPI summary, run MULTIPLE targeted queries and combine them in your answer:

1. **Lead funnel**: total leads in period, by status, by source
2. **Conversions**: count and rate vs previous period
3. **Appointments**: booked, DNA rate, this vs last period
4. **Revenue**: gross invoiced, collected, outstanding
5. **Meta spend**: total spend, leads, CPL
6. **Pipeline value**: unconverted leads × avg treatment value
7. **Team tasks**: overdue count

### Example: Full KPI summary (run as separate queries)

**Query 1 — Lead summary:**
\`\`\`sql
SELECT
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE "leadStatus" = 'Converted') AS converted,
  COUNT(*) FILTER (WHERE "leadStatus" = 'New') AS new_unactioned,
  COUNT(*) FILTER (WHERE "leadStatus" = 'Contacted') AS in_progress,
  COUNT(*) FILTER (WHERE "leadStatus" = 'Lost') AS lost,
  ROUND(COUNT(*) FILTER (WHERE "leadStatus" = 'Converted')::numeric / NULLIF(COUNT(*),0) * 100, 1) AS conversion_rate_pct
FROM "CrmLeads"
WHERE "organisationId" = <orgId>
  AND "softDeleted" = false AND "isDeleted" = false
  AND "createdAt" >= NOW() - INTERVAL '30 days'
\`\`\`

**Query 2 — Lead source breakdown:**
\`\`\`sql
SELECT "leadSource", COUNT(*) AS leads,
  COUNT(*) FILTER (WHERE "leadStatus" = 'Converted') AS converted
FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "softDeleted" = false AND "isDeleted" = false
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "leadSource" ORDER BY leads DESC
\`\`\`

**Query 3 — Appointments:**
\`\`\`sql
SELECT
  COUNT(*) FILTER (WHERE status NOT IN ('Cancelled','Did not attend')) AS booked,
  COUNT(*) FILTER (WHERE status = 'Did not attend') AS dna,
  COUNT(*) FILTER (WHERE status = 'Complete') AS completed,
  ROUND(COUNT(*) FILTER (WHERE status = 'Did not attend')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE status != 'Cancelled'),0) * 100, 1) AS dna_rate_pct
FROM "DiaryAppointments"
WHERE "organisationId" = <orgId> AND "isDeleted" = false
  AND "startTime" >= NOW() - INTERVAL '30 days'
\`\`\`

**Query 4 — Revenue:**
\`\`\`sql
SELECT
  ROUND(SUM(total)::numeric, 2) AS gross_invoiced,
  ROUND(SUM("amountPaid")::numeric, 2) AS collected,
  ROUND(SUM(balance)::numeric, 2) AS outstanding
FROM "PatientInvoices"
WHERE "organisationId" = <orgId>
  AND status NOT IN ('Cancelled', 'Draft')
  AND "invoiceDate" >= NOW() - INTERVAL '30 days'
\`\`\`

**Query 5 — Meta ad spend:**
\`\`\`sql
SELECT
  ROUND(SUM(spend) / 100.0, 2) AS total_spend_gbp,
  SUM(leads) AS meta_leads,
  CASE WHEN SUM(leads) > 0 THEN ROUND(SUM(spend)::numeric / SUM(leads) / 100, 2) END AS cpl_gbp
FROM "MetaInsights"
WHERE "organisationId" = <orgId>
  AND "entityType" = 'campaign'
  AND date >= NOW() - INTERVAL '30 days'
\`\`\`

**Query 6 — Pipeline value (unconverted leads):**
\`\`\`sql
SELECT
  COUNT(*) AS unconverted_leads,
  SUM(CASE treatment
    WHEN 'Teeth Whitening' THEN 350
    WHEN 'INVISALIGN' THEN 3500
    WHEN 'Smile Makeover' THEN 8000
    WHEN 'Veneers' THEN 9600
    WHEN 'Composite Bonding' THEN 800
    WHEN 'Teeth Straightening' THEN 2500
    ELSE 1500
  END) AS estimated_pipeline_value_gbp
FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "softDeleted" = false AND "isDeleted" = false
  AND "leadStatus" NOT IN ('Converted', 'Lost', 'Archived')
\`\`\`

**Query 7 — Overdue tasks:**
\`\`\`sql
SELECT COUNT(*) AS overdue_tasks FROM "UserTasks"
WHERE "organisationId" = <orgId>
  AND "isArchieved" = false
  AND "dueDate" < CURRENT_DATE
  AND "statusId" NOT IN (SELECT id FROM "DefaultStatuses" WHERE key = 'completed')
\`\`\`

### ROAS Calculation
ROAS = (converted leads' estimated treatment value) / Meta ad spend
\`\`\`sql
WITH meta_spend AS (
  SELECT SUM(spend) / 100.0 AS spend_gbp
  FROM "MetaInsights"
  WHERE "organisationId" = <orgId> AND "entityType" = 'campaign'
    AND date >= NOW() - INTERVAL '30 days'
),
converted_value AS (
  SELECT SUM(CASE treatment
    WHEN 'Teeth Whitening' THEN 350
    WHEN 'INVISALIGN' THEN 3500
    WHEN 'Smile Makeover' THEN 8000
    WHEN 'Veneers' THEN 9600
    WHEN 'Composite Bonding' THEN 800
    WHEN 'Teeth Straightening' THEN 2500
    ELSE 1500
  END) AS value_gbp
  FROM "CrmLeads"
  WHERE "organisationId" = <orgId>
    AND "leadSource" ILIKE '%meta%'
    AND "leadStatus" = 'Converted'
    AND "createdAt" >= NOW() - INTERVAL '30 days'
    AND "softDeleted" = false AND "isDeleted" = false
)
SELECT
  ROUND(ms.spend_gbp::numeric, 2) AS meta_spend_gbp,
  ROUND(cv.value_gbp::numeric, 2) AS converted_value_gbp,
  ROUND(cv.value_gbp / NULLIF(ms.spend_gbp, 0), 2) AS roas
FROM meta_spend ms, converted_value cv
\`\`\`

### Bottleneck Detection
\`\`\`sql
SELECT
  COUNT(*) FILTER (WHERE "leadStatus" = 'New' AND "createdAt" < NOW() - INTERVAL '7 days') AS stale_new_leads,
  COUNT(*) FILTER (WHERE "followUpDate" < CURRENT_DATE AND "leadStatus" NOT IN ('Converted','Lost','Archived')) AS overdue_followups,
  COUNT(*) FILTER (WHERE "leadStatus" = 'Contacted' AND "leadStatusChangedAt" < NOW() - INTERVAL '30 days') AS stuck_in_contacted
FROM "CrmLeads"
WHERE "organisationId" = <orgId> AND "softDeleted" = false AND "isDeleted" = false
\`\`\`
`
}
