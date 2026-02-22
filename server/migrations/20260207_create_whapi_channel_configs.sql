CREATE TABLE IF NOT EXISTS public."WhapiChannelConfigs" (
  "id" SERIAL PRIMARY KEY,
  "organisationId" INTEGER NOT NULL REFERENCES public."Organisations" ("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES public."Users" ("id") ON DELETE CASCADE,
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
  ON public."WhapiChannelConfigs" ("organisationId");

-- Ensure non-unique index on channelId
DROP INDEX IF EXISTS "idx_whapi_channel_id";
CREATE INDEX IF NOT EXISTS "idx_whapi_channel_id"
  ON public."WhapiChannelConfigs" ("channelId");
