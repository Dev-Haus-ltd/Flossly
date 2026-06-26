export const diaryModule = {
  name: 'diary',
  description: 'Appointments, DNA rates, diary utilisation, patients, recall, treatment plans, patient communications, new patient stats',
  schema: `
## Diary Module

### Tables

**DiaryAppointments** — appointment records (use this for appointment queries, NOT "appointments")
- id, organisationId, patientId, dentistId (userId of practitioner), treatmentId, treatmentName, status, startTime (TIMESTAMP), endTime (TIMESTAMP), notes, amount (DECIMAL), isDeleted, createdAt
- Statuses: Pending, Confirmed, Arrived, Complete, Cancelled, "Did not attend" (DNA)
- DNA = status = 'Did not attend'
- Active: WHERE "isDeleted" = false

**DiaryPatients** — patient records (use this for patient queries, NOT "Patients")
- id, organisationId, firstName, lastName, email, mobile, dob, sex, marketingConsent, receiveSms (BOOLEAN), receiveEmail (BOOLEAN), paymentPlan (Private/NHS), defaultDentistId, dentist, hygienist, recallMethod, recallInterval, nextDentistRecall (DATEONLY), nextHygienistRecall (DATEONLY), acquisitionSource, address1, postcode, isDeleted, createdAt
- Full name: "firstName" || ' ' || "lastName"
- Overdue recall: nextDentistRecall < CURRENT_DATE OR nextHygienistRecall < CURRENT_DATE

**DiaryTreatmentPlanItems** — treatment plan line items
- id, organisationId, patientId, treatmentName, treatmentCategory, status, cost (DECIMAL), completedAt, practitionerName

**PatientInvoices** — invoices
- id, organisationId, patientId, invoiceDate, status (Draft/Sent/Paid/Overdue/Cancelled/Partial), total, amountPaid, balance, practitionerName

**PatientPayments** — payments received
- id, organisationId, patientId, paymentDate, method, amount

**DiaryPatientCommunicationLogs** — patient comms history
- id, organisationId, patientId, type (Email/WhatsApp/SMS/Phone/In-Person/Automation/Consent Form), subject, status (Sent/Delivered/Failed/Pending), sentAt

### Key Relationships
- DiaryAppointments.patientId → DiaryPatients.id
- DiaryAppointments.dentistId → Users.id (practitioner)
- PatientInvoices.patientId → DiaryPatients.id

### Example Queries

**Appointments this week by status:**
\`\`\`sql
SELECT status, COUNT(*) AS count
FROM "DiaryAppointments"
WHERE "organisationId" = <orgId>
  AND "isDeleted" = false
  AND "startTime" >= date_trunc('week', NOW())
  AND "startTime" < date_trunc('week', NOW()) + INTERVAL '7 days'
GROUP BY status ORDER BY count DESC
\`\`\`

**DNA rate this month:**
\`\`\`sql
SELECT
  COUNT(*) FILTER (WHERE status = 'Did not attend') AS dna_count,
  COUNT(*) FILTER (WHERE status != 'Cancelled') AS total_booked,
  ROUND(COUNT(*) FILTER (WHERE status = 'Did not attend')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE status != 'Cancelled'), 0) * 100, 1) AS dna_rate_pct
FROM "DiaryAppointments"
WHERE "organisationId" = <orgId>
  AND "isDeleted" = false
  AND "startTime" >= date_trunc('month', NOW())
\`\`\`

**DNA by practitioner:**
\`\`\`sql
SELECT u."fullName" AS practitioner,
  COUNT(*) FILTER (WHERE da.status = 'Did not attend') AS dna,
  COUNT(*) FILTER (WHERE da.status != 'Cancelled') AS total,
  ROUND(COUNT(*) FILTER (WHERE da.status = 'Did not attend')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE da.status != 'Cancelled'), 0) * 100, 1) AS dna_pct
FROM "DiaryAppointments" da
JOIN "Users" u ON u.id = da."dentistId"
WHERE da."organisationId" = <orgId> AND da."isDeleted" = false
  AND da."startTime" >= date_trunc('month', NOW())
GROUP BY u."fullName" ORDER BY dna_pct DESC
\`\`\`

**Patients overdue for recall:**
\`\`\`sql
SELECT "firstName" || ' ' || "lastName" AS name, mobile, email,
  "nextDentistRecall", "nextHygienistRecall"
FROM "DiaryPatients"
WHERE "organisationId" = <orgId> AND "isDeleted" = false
  AND ("nextDentistRecall" < CURRENT_DATE OR "nextHygienistRecall" < CURRENT_DATE)
ORDER BY LEAST("nextDentistRecall", "nextHygienistRecall") ASC
LIMIT 50
\`\`\`

**Patients due for recall in next 30 days:**
\`\`\`sql
SELECT "firstName" || ' ' || "lastName" AS name, mobile, email,
  "nextDentistRecall", "nextHygienistRecall"
FROM "DiaryPatients"
WHERE "organisationId" = <orgId> AND "isDeleted" = false
  AND (
    ("nextDentistRecall" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
    OR ("nextHygienistRecall" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
  )
ORDER BY LEAST("nextDentistRecall", "nextHygienistRecall") ASC
\`\`\`

**New patients this month vs last month:**
\`\`\`sql
SELECT
  COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('month', NOW())) AS this_month,
  COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('month', NOW() - INTERVAL '1 month')
                    AND "createdAt" < date_trunc('month', NOW())) AS last_month
FROM "DiaryPatients" WHERE "organisationId" = <orgId> AND "isDeleted" = false
\`\`\`

**Marketing consent / SMS / email opt-in stats:**
\`\`\`sql
SELECT
  COUNT(*) AS total_patients,
  COUNT(*) FILTER (WHERE "marketingConsent" = 'yes') AS marketing_consent,
  COUNT(*) FILTER (WHERE "receiveSms" = true) AS sms_opted_in,
  COUNT(*) FILTER (WHERE "receiveEmail" = true) AS email_opted_in,
  COUNT(*) FILTER (WHERE mobile IS NULL OR mobile = '') AS no_mobile,
  COUNT(*) FILTER (WHERE email IS NULL OR email = '') AS no_email
FROM "DiaryPatients"
WHERE "organisationId" = <orgId> AND "isDeleted" = false
\`\`\`

**Private vs NHS split:**
\`\`\`sql
SELECT "paymentPlan", COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM "DiaryPatients"
WHERE "organisationId" = <orgId> AND "isDeleted" = false
  AND "paymentPlan" IS NOT NULL
GROUP BY "paymentPlan"
\`\`\`

**Appointments this month vs last month:**
\`\`\`sql
SELECT
  COUNT(*) FILTER (WHERE "startTime" >= date_trunc('month', NOW())) AS this_month,
  COUNT(*) FILTER (WHERE "startTime" >= date_trunc('month', NOW() - INTERVAL '1 month')
                    AND "startTime" < date_trunc('month', NOW())) AS last_month
FROM "DiaryAppointments"
WHERE "organisationId" = <orgId> AND "isDeleted" = false
  AND status NOT IN ('Cancelled', 'Did not attend')
\`\`\`

**Patients not seen in 6+ months:**
\`\`\`sql
SELECT dp."firstName" || ' ' || dp."lastName" AS name, dp.mobile, dp.email,
  MAX(da."startTime") AS last_appointment
FROM "DiaryPatients" dp
LEFT JOIN "DiaryAppointments" da ON da."patientId" = dp.id
  AND da."organisationId" = dp."organisationId"
  AND da.status = 'Complete' AND da."isDeleted" = false
WHERE dp."organisationId" = <orgId> AND dp."isDeleted" = false
GROUP BY dp.id, dp."firstName", dp."lastName", dp.mobile, dp.email
HAVING MAX(da."startTime") < NOW() - INTERVAL '6 months' OR MAX(da."startTime") IS NULL
ORDER BY last_appointment ASC NULLS FIRST
LIMIT 50
\`\`\`
`
}
