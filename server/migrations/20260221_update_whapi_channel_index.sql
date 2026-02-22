DROP INDEX IF EXISTS "idx_whapi_channel_id";
CREATE INDEX IF NOT EXISTS "idx_whapi_channel_id"
  ON dev."WhapiChannelConfigs" ("channelId");
