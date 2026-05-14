BEGIN;

-- =====================================================
-- GOCARDLESS MANDATES
-- =====================================================

CREATE TABLE IF NOT EXISTS "dev"."GCMandates" (
  "id"                 SERIAL PRIMARY KEY,
  "organisationId"     INTEGER NOT NULL REFERENCES "dev"."Organisations" ("id") ON DELETE CASCADE,
  "patientId"          INTEGER NOT NULL REFERENCES "dev"."DiaryPatients" ("id") ON DELETE CASCADE,

  "mandateId"          VARCHAR(50),
  "customerId"         VARCHAR(50) NOT NULL,
  "billingRequestId"   VARCHAR(50),

  -- pending_submission | submitted | active | failed | cancelled | expired
  "status"             VARCHAR(30) NOT NULL DEFAULT 'pending_submission',

  "scheme"             VARCHAR(20) NOT NULL DEFAULT 'bacs',
  "reference"          VARCHAR(100),

  -- Customer details at time of creation
  "customerEmail"      VARCHAR(255),
  "customerName"       VARCHAR(255),

  -- Metadata for tracking
  "metadata"           JSONB,

  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "gc_mandates_mandate_unique"
    UNIQUE ("mandateId")
);

CREATE INDEX IF NOT EXISTS "gc_mandates_org_patient_idx"
  ON "dev"."GCMandates" ("organisationId", "patientId");

CREATE INDEX IF NOT EXISTS "gc_mandates_status_idx"
  ON "dev"."GCMandates" ("organisationId", "status");

CREATE INDEX IF NOT EXISTS "gc_mandates_customer_idx"
  ON "dev"."GCMandates" ("customerId");

CREATE INDEX IF NOT EXISTS "gc_mandates_billing_request_idx"
  ON "dev"."GCMandates" ("billingRequestId");

DROP TRIGGER IF EXISTS "update_gc_mandates_updated_at"
  ON "dev"."GCMandates";

CREATE TRIGGER "update_gc_mandates_updated_at"
  BEFORE UPDATE ON "dev"."GCMandates"
  FOR EACH ROW
  EXECUTE FUNCTION dev.update_updated_at_column();

-- =====================================================
-- GOCARDLESS PAYMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS "dev"."GCPayments" (
  "id"                   SERIAL PRIMARY KEY,

  "organisationId"       INTEGER NOT NULL REFERENCES "dev"."Organisations" ("id") ON DELETE CASCADE,
  "patientId"            INTEGER NOT NULL REFERENCES "dev"."DiaryPatients" ("id") ON DELETE CASCADE,

  "invoiceId"            INTEGER
    REFERENCES "dev"."PatientInvoices" ("id")
    ON DELETE SET NULL,

  "paymentId"            VARCHAR(50) NOT NULL,

  "gcMandateDbId"        INTEGER NOT NULL
    REFERENCES "dev"."GCMandates" ("id")
    ON DELETE CASCADE,

  "mandateId"            VARCHAR(50),

  -- created | submitted | confirmed | paid_out | failed | cancelled | charged_back
  "status"               VARCHAR(30) NOT NULL DEFAULT 'created',

  "amount"               NUMERIC(10,2) NOT NULL,
  "currency"             VARCHAR(3) NOT NULL DEFAULT 'GBP',

  "description"          VARCHAR(255),
  "reference"            VARCHAR(100),

  "chargeDate"           DATE,
  "processedAt"          TIMESTAMPTZ,

  "submittedAt"          TIMESTAMPTZ,
  "confirmedAt"          TIMESTAMPTZ,
  "paidOutAt"            TIMESTAMPTZ,
  "failedAt"             TIMESTAMPTZ,

  -- Retry tracking
  "retryCount"           INTEGER NOT NULL DEFAULT 0,
  "maxRetries"           INTEGER NOT NULL DEFAULT 3,
  "lastRetryAt"          TIMESTAMPTZ,

  -- Failure tracking
  "failureReason"        TEXT,
  "failureCode"          VARCHAR(50),

  -- Webhook tracking
  "webhookEvents"        JSONB DEFAULT '[]'::jsonb,
  "lastWebhookAt"        TIMESTAMPTZ,

  -- Metadata
  "metadata"             JSONB,

  -- Accounting sync tracking
  "accountingSynced"     BOOLEAN NOT NULL DEFAULT FALSE,
  "syncError"            TEXT,
  "syncAttemptedAt"      TIMESTAMPTZ,

  "patientPaymentId"     INTEGER
    REFERENCES "dev"."PatientPayments" ("id")
    ON DELETE SET NULL,

  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "gc_payments_org_payment_unique"
    UNIQUE ("organisationId", "paymentId"),

  CONSTRAINT "check_gc_payment_amount_positive"
    CHECK ("amount" > 0),

  CONSTRAINT "check_gc_payment_retry_count"
    CHECK ("retryCount" >= 0 AND "retryCount" <= "maxRetries")
);

CREATE INDEX IF NOT EXISTS "gc_payments_org_patient_idx"
  ON "dev"."GCPayments" ("organisationId", "patientId");

CREATE INDEX IF NOT EXISTS "gc_payments_status_idx"
  ON "dev"."GCPayments" ("organisationId", "status");

CREATE INDEX IF NOT EXISTS "gc_payments_mandate_idx"
  ON "dev"."GCPayments" ("mandateId");

CREATE INDEX IF NOT EXISTS "gc_payments_invoice_idx"
  ON "dev"."GCPayments" ("invoiceId");

CREATE INDEX IF NOT EXISTS "gc_payments_accounting_synced_idx"
  ON "dev"."GCPayments" ("accountingSynced");

CREATE INDEX IF NOT EXISTS "gc_payments_charge_date_idx"
  ON "dev"."GCPayments" ("chargeDate");

CREATE INDEX IF NOT EXISTS "gc_payments_patient_payment_idx"
  ON "dev"."GCPayments" ("patientPaymentId");

CREATE INDEX IF NOT EXISTS "gc_payments_gc_mandate_db_idx"
  ON "dev"."GCPayments" ("gcMandateDbId");

DROP TRIGGER IF EXISTS "update_gc_payments_updated_at"
  ON "dev"."GCPayments";

CREATE TRIGGER "update_gc_payments_updated_at"
  BEFORE UPDATE ON "dev"."GCPayments"
  FOR EACH ROW
  EXECUTE FUNCTION dev.update_updated_at_column();

-- =====================================================
-- GOCARDLESS WEBHOOK LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS "dev"."GCWebhookLogs" (
  "id"                   SERIAL PRIMARY KEY,

  "webhookId"            VARCHAR(100),
  "signature"            VARCHAR(255),

  -- Raw webhook payload
  "payload"              JSONB NOT NULL,

  -- Processing status
  "processed"            BOOLEAN NOT NULL DEFAULT FALSE,
  "processedAt"          TIMESTAMPTZ,
  "processingError"      TEXT,

  -- Event details
  "eventCount"           INTEGER NOT NULL DEFAULT 0,
  "eventsProcessed"      INTEGER NOT NULL DEFAULT 0,

  -- Idempotency
  "idempotencyKey"       VARCHAR(255),

  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "gc_webhook_logs_webhook_unique"
    UNIQUE ("webhookId"),

  CONSTRAINT "gc_webhook_logs_idempotency_unique"
    UNIQUE ("idempotencyKey")
);

CREATE INDEX IF NOT EXISTS "gc_webhook_logs_processed_idx"
  ON "dev"."GCWebhookLogs" ("processed");

CREATE INDEX IF NOT EXISTS "gc_webhook_logs_created_at_idx"
  ON "dev"."GCWebhookLogs" ("createdAt");

CREATE INDEX IF NOT EXISTS "gc_webhook_logs_webhook_idx"
  ON "dev"."GCWebhookLogs" ("webhookId");

DROP TRIGGER IF EXISTS "update_gc_webhook_logs_updated_at"
  ON "dev"."GCWebhookLogs";

CREATE TRIGGER "update_gc_webhook_logs_updated_at"
  BEFORE UPDATE ON "dev"."GCWebhookLogs"
  FOR EACH ROW
  EXECUTE FUNCTION dev.update_updated_at_column();

COMMIT;