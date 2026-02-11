CREATE TABLE IF NOT EXISTS dev."WhapiChannelConfigs" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES dev."Organisations" ("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES dev."Users" ("id") ON DELETE CASCADE,
  "channelId" VARCHAR(64) NOT NULL,
  "tokenEnc" TEXT NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'Active',
  "displayName" VARCHAR(150),
  "phoneNumber" VARCHAR(32),
  "connectedAt" TIMESTAMP NULL,
  "lastQrAt" TIMESTAMP NULL,
  "lastSeenAt" TIMESTAMP NULL,
  "webhookUrl" TEXT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_whapi_channel_org"
  ON dev."WhapiChannelConfigs" ("organisationId");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_whapi_channel_id"
  ON dev."WhapiChannelConfigs" ("channelId");
