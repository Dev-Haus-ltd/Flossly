export const financeModule = {
  name: 'finance',
  description: 'Invoices, payments, revenue, outstanding balances, payment methods, treatment costs',
  schema: `
## Finance Module

### Tables

**PatientInvoices** — all invoices
- id, organisationId, patientId, invoiceNumber, invoiceDate (DATEONLY), dueDate, status (Draft/Sent/Paid/Overdue/Cancelled/Partial), subtotal, discount, total, amountPaid, balance, practitionerName, practitionerId, appointmentId, createdAt

**PatientInvoiceItems** — line items per invoice
- id, organisationId, invoiceId, patientId, description, quantity, unitPrice, total, treatmentCode, practitionerName, sortOrder

**PatientPayments** — payments received
- id, organisationId, patientId, paymentNumber, paymentDate (DATEONLY), method (Cash/Card/Bank Transfer/Finance/GoCardless), amount, unallocated, reference, takenByName, practitionerId, practitionerName, createdAt

**PatientPaymentAllocations** — which payments cover which invoices
- id, organisationId, paymentId, invoiceId, patientId, amount

**Patients** — for joining to get patient names
- id, organisationId, firstName, lastName

**OrganisationTreatments** — treatment price list
- id, organisationId, name, category, price (DECIMAL), active, defaultDuration (minutes)

### Key Metrics

Revenue this month vs last:
\`\`\`sql
SELECT
  SUM(total) FILTER (WHERE "invoiceDate" >= date_trunc('month', NOW())) AS this_month_gross,
  SUM(total) FILTER (WHERE "invoiceDate" >= date_trunc('month', NOW() - INTERVAL '1 month')
                     AND "invoiceDate" < date_trunc('month', NOW())) AS last_month_gross,
  SUM("amountPaid") FILTER (WHERE "invoiceDate" >= date_trunc('month', NOW())) AS this_month_collected
FROM "PatientInvoices"
WHERE "organisationId" = <orgId> AND status != 'Cancelled'
\`\`\`

Outstanding balance:
\`\`\`sql
SELECT COUNT(*) AS invoice_count, SUM(balance) AS total_outstanding
FROM "PatientInvoices"
WHERE "organisationId" = <orgId> AND balance > 0 AND status NOT IN ('Cancelled', 'Paid')
\`\`\`

Revenue by practitioner:
\`\`\`sql
SELECT "practitionerName", SUM(total) AS gross, SUM("amountPaid") AS collected
FROM "PatientInvoices"
WHERE "organisationId" = <orgId>
  AND "invoiceDate" >= date_trunc('month', NOW())
  AND status != 'Cancelled'
GROUP BY "practitionerName" ORDER BY gross DESC
\`\`\`

Payment method breakdown:
\`\`\`sql
SELECT method, COUNT(*) AS count, SUM(amount) AS total
FROM "PatientPayments"
WHERE "organisationId" = <orgId>
  AND "paymentDate" >= date_trunc('month', NOW())
GROUP BY method ORDER BY total DESC
\`\`\`
`
}
