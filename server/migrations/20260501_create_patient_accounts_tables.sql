BEGIN;

-- =====================================================
-- COMMON TRIGGER FUNCTION (safe upsert)
-- =====================================================

CREATE OR REPLACE FUNCTION dev.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PATIENT INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS "dev"."PatientInvoices" (
  "id"               SERIAL PRIMARY KEY,
  "organisationId"   INTEGER NOT NULL REFERENCES "dev"."Organisations" ("id") ON DELETE CASCADE,
  "patientId"        INTEGER NOT NULL REFERENCES "dev"."DiaryPatients"  ("id") ON DELETE CASCADE,

  "invoiceNumber"    VARCHAR(20)  NOT NULL,
  "invoiceDate"      DATE         NOT NULL,
  "dueDate"          DATE,

  -- unpaid | part_paid | paid | written_off | credited | draft
  "status"           VARCHAR(20)  NOT NULL DEFAULT 'unpaid',

  "subtotal"         NUMERIC(10,2) NOT NULL DEFAULT 0,
  "discount"         NUMERIC(10,2) NOT NULL DEFAULT 0,
  "total"            NUMERIC(10,2) NOT NULL DEFAULT 0,
  "amountPaid"       NUMERIC(10,2) NOT NULL DEFAULT 0,
  "balance"          NUMERIC(10,2) NOT NULL DEFAULT 0,

  "notes"            TEXT,
  "practitionerId"   INTEGER,
  "practitionerName" VARCHAR(120),
  "appointmentId"    INTEGER,
  "appointmentGroupId" VARCHAR(80),
  "planId"           VARCHAR(80),
  "planName"         VARCHAR(160),
  "createdByUserId"  INTEGER,

  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "patient_invoices_org_number_unique"
    UNIQUE ("organisationId", "invoiceNumber")
);

CREATE INDEX IF NOT EXISTS "patient_invoices_org_patient_idx"
  ON "dev"."PatientInvoices" ("organisationId", "patientId");

CREATE INDEX IF NOT EXISTS "patient_invoices_status_idx"
  ON "dev"."PatientInvoices" ("organisationId", "patientId", "status");

DROP TRIGGER IF EXISTS "update_patient_invoices_updated_at" ON "dev"."PatientInvoices";
CREATE TRIGGER "update_patient_invoices_updated_at"
  BEFORE UPDATE ON "dev"."PatientInvoices"
  FOR EACH ROW EXECUTE FUNCTION dev.update_updated_at_column();

-- =====================================================
-- PATIENT INVOICE ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS "dev"."PatientInvoiceItems" (
  "id"                  SERIAL PRIMARY KEY,
  "organisationId"      INTEGER NOT NULL REFERENCES "dev"."Organisations"         ("id") ON DELETE CASCADE,
  "patientId"           INTEGER NOT NULL REFERENCES "dev"."DiaryPatients"         ("id") ON DELETE CASCADE,
  "invoiceId"           INTEGER NOT NULL REFERENCES "dev"."PatientInvoices"       ("id") ON DELETE CASCADE,

  "treatmentPlanItemId" INTEGER REFERENCES "dev"."DiaryTreatmentPlanItems" ("id") ON DELETE SET NULL,

  "description"         VARCHAR(300) NOT NULL DEFAULT '',
  "quantity"            NUMERIC(8,2) NOT NULL DEFAULT 1,
  "unitPrice"           NUMERIC(10,2) NOT NULL DEFAULT 0,
  "total"               NUMERIC(10,2) NOT NULL DEFAULT 0,

  "fdi"                 INTEGER,
  "surface"             VARCHAR(40),
  "treatmentCode"       VARCHAR(80),
  "practitionerId"      INTEGER,
  "practitionerName"    VARCHAR(120),
  "sortOrder"           INTEGER NOT NULL DEFAULT 0,

  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "patient_invoice_items_org_patient_idx"
  ON "dev"."PatientInvoiceItems" ("organisationId", "patientId");

CREATE INDEX IF NOT EXISTS "patient_invoice_items_invoice_idx"
  ON "dev"."PatientInvoiceItems" ("invoiceId");

CREATE INDEX IF NOT EXISTS "patient_invoice_items_treatment_item_idx"
  ON "dev"."PatientInvoiceItems" ("treatmentPlanItemId");

DROP TRIGGER IF EXISTS "update_patient_invoice_items_updated_at" ON "dev"."PatientInvoiceItems";
CREATE TRIGGER "update_patient_invoice_items_updated_at"
  BEFORE UPDATE ON "dev"."PatientInvoiceItems"
  FOR EACH ROW EXECUTE FUNCTION dev.update_updated_at_column();

-- =====================================================
-- PATIENT PAYMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS "dev"."PatientPayments" (
  "id"               SERIAL PRIMARY KEY,
  "organisationId"   INTEGER NOT NULL REFERENCES "dev"."Organisations" ("id") ON DELETE CASCADE,
  "patientId"        INTEGER NOT NULL REFERENCES "dev"."DiaryPatients"  ("id") ON DELETE CASCADE,

  "paymentNumber"    VARCHAR(20)  NOT NULL,
  "paymentDate"      DATE         NOT NULL,

  -- cash | card | bank_transfer | cheque | finance | other
  "method"           VARCHAR(30)  NOT NULL DEFAULT 'cash',

  "amount"           NUMERIC(10,2) NOT NULL DEFAULT 0,
  "unallocated"      NUMERIC(10,2) NOT NULL DEFAULT 0,

  "reference"        VARCHAR(120),
  "notes"            TEXT,

  "takenByUserId"    INTEGER,
  "takenByName"      VARCHAR(120),
  "practitionerId"   INTEGER,
  "practitionerName" VARCHAR(120),

  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "patient_payments_org_number_unique"
    UNIQUE ("organisationId", "paymentNumber"),

  CONSTRAINT "check_payment_amount_positive"
    CHECK ("amount" >= 0),

  CONSTRAINT "check_payment_unallocated_valid"
    CHECK ("unallocated" >= 0 AND "unallocated" <= "amount")
);

CREATE INDEX IF NOT EXISTS "patient_payments_org_patient_idx"
  ON "dev"."PatientPayments" ("organisationId", "patientId");

CREATE INDEX IF NOT EXISTS "patient_payments_date_idx"
  ON "dev"."PatientPayments" ("organisationId", "patientId", "paymentDate");

DROP TRIGGER IF EXISTS "update_patient_payments_updated_at" ON "dev"."PatientPayments";
CREATE TRIGGER "update_patient_payments_updated_at"
  BEFORE UPDATE ON "dev"."PatientPayments"
  FOR EACH ROW EXECUTE FUNCTION dev.update_updated_at_column();

-- =====================================================
-- PATIENT PAYMENT ALLOCATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS "dev"."PatientPaymentAllocations" (
  "id"             SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES "dev"."Organisations"          ("id") ON DELETE CASCADE,
  "patientId"      INTEGER NOT NULL REFERENCES "dev"."DiaryPatients"          ("id") ON DELETE CASCADE,
  "paymentId"      INTEGER NOT NULL REFERENCES "dev"."PatientPayments"        ("id") ON DELETE CASCADE,
  "invoiceId"      INTEGER NOT NULL REFERENCES "dev"."PatientInvoices"        ("id") ON DELETE CASCADE,

  "amount"         NUMERIC(10,2) NOT NULL DEFAULT 0,

  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "check_allocation_amount_positive"
    CHECK ("amount" > 0)
);

CREATE INDEX IF NOT EXISTS "patient_payment_alloc_org_patient_idx"
  ON "dev"."PatientPaymentAllocations" ("organisationId", "patientId");

CREATE INDEX IF NOT EXISTS "patient_payment_alloc_payment_idx"
  ON "dev"."PatientPaymentAllocations" ("paymentId");

CREATE INDEX IF NOT EXISTS "patient_payment_alloc_invoice_idx"
  ON "dev"."PatientPaymentAllocations" ("invoiceId");

DROP TRIGGER IF EXISTS "update_patient_payment_allocations_updated_at" ON "dev"."PatientPaymentAllocations";
CREATE TRIGGER "update_patient_payment_allocations_updated_at"
  BEFORE UPDATE ON "dev"."PatientPaymentAllocations"
  FOR EACH ROW EXECUTE FUNCTION dev.update_updated_at_column();

COMMIT;
