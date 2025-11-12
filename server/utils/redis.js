import Redis from 'ioredis';

let redisClient = null;

export const getRedisClient = () => {
  if (redisClient) return redisClient;

  const config = useRuntimeConfig();
  const redisUrl = config.REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false, // Auto-connect on creation
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    return redisClient;
  } catch (err) {
    console.error('Error creating Redis client:', err);
    throw err;
  }
};

// Helper functions for session management
export const sessionKeys = {
  session: (sessionId) => `transcription:session:${sessionId}`,
  process: (sessionId) => `transcription:process:${sessionId}`,
};

// Store session metadata in Redis
export const setSessionMetadata = async (sessionId, metadata, ttl = 3600) => {
  const client = getRedisClient();
  const key = sessionKeys.session(sessionId);
  
  // Store which process owns this session
  await client.setex(sessionKeys.process(sessionId), ttl, String(metadata.processId));
  
  // Store session metadata (without the stream object which can't be serialized)
  const serializableMetadata = {
    ...metadata,
    recognizeStream: undefined, // Don't store the stream
  };
  
  await client.setex(key, ttl, JSON.stringify(serializableMetadata));
  
  // Log for debugging
  console.log(`[Redis] ✅ Stored session ${sessionId} in Redis with TTL ${ttl}s. Keys: ${key}, ${sessionKeys.process(sessionId)}`);
};

// Get session metadata from Redis
export const getSessionMetadata = async (sessionId) => {
  const client = getRedisClient();
  const key = sessionKeys.session(sessionId);
  
  const data = await client.get(key);
  if (!data) return null;
  
  return JSON.parse(data);
};

// Get which process owns this session
export const getSessionProcessId = async (sessionId) => {
  const client = getRedisClient();
  const processId = await client.get(sessionKeys.process(sessionId));
  return processId ? parseInt(processId, 10) : null;
};

// Delete session from Redis
export const deleteSession = async (sessionId) => {
  const client = getRedisClient();
  await client.del(sessionKeys.session(sessionId));
  await client.del(sessionKeys.process(sessionId));
};

// Update session metadata
export const updateSessionMetadata = async (sessionId, updates, ttl = 3600) => {
  const existing = await getSessionMetadata(sessionId);
  if (!existing) return null;
  
  const updated = {
    ...existing,
    ...updates,
    recognizeStream: undefined, // Don't store the stream
  };
  
  await setSessionMetadata(sessionId, updated, ttl);
  return updated;
};


