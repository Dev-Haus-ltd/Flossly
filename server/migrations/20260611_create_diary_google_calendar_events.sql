-- Migration: Google Calendar per-dentist integration tables

-- Maps Flossly diary appointment IDs to Google Calendar event IDs.
-- googleCalendarId records which dentist sub-calendar the event lives in.
CREATE TABLE IF NOT EXISTS "DiaryGoogleCalendarEvents" (
  "id"               SERIAL PRIMARY KEY,
  "organisationId"   INTEGER NOT NULL REFERENCES "Organisations"("id") ON DELETE CASCADE,
  "appointmentId"    INTEGER NOT NULL REFERENCES "DiaryAppointments"("id") ON DELETE CASCADE,
  "googleCalendarId" VARCHAR(255) NOT NULL,
  "googleEventId"    VARCHAR(255) NOT NULL,
  "createdAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "diary_gcal_events_org_appt_unique"
  ON "DiaryGoogleCalendarEvents" ("organisationId", "appointmentId");

CREATE INDEX IF NOT EXISTS "diary_gcal_events_org_idx"
  ON "DiaryGoogleCalendarEvents" ("organisationId");

-- Maps each dentist → their dedicated Google Calendar ID (secondary calendar
-- created under the org's connected Google account, e.g. "Dr. Alice — Flossly").
CREATE TABLE IF NOT EXISTS "DiaryDentistGoogleCalendars" (
  "id"               SERIAL PRIMARY KEY,
  "organisationId"   INTEGER NOT NULL REFERENCES "Organisations"("id") ON DELETE CASCADE,
  "dentistId"        INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "googleCalendarId" VARCHAR(255) NOT NULL,
  "calendarName"     VARCHAR(255),
  "createdAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "diary_dentist_gcal_org_dentist_unique"
  ON "DiaryDentistGoogleCalendars" ("organisationId", "dentistId");

CREATE INDEX IF NOT EXISTS "diary_dentist_gcal_org_idx"
  ON "DiaryDentistGoogleCalendars" ("organisationId");
