import { ConnectionOptions } from 'bullmq';

const redisHost = process.env.REDIS_HOST?.trim() || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const redisPassword = process.env.REDIS_PASSWORD?.trim();
const redisTls = process.env.REDIS_TLS === 'true' || process.env.REDIS_TLS === '1';

export const connection: ConnectionOptions = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  tls: redisTls ? {} : undefined, // Enable TLS if configured (e.g. for managed Redis)
  maxRetriesPerRequest: null, // Recommended by BullMQ
};

export const QUEUE_NAME = 'beekod-jobs';

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep completed jobs for 24 hours
    count: 1000,    // Max 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days (for debugging)
    count: 5000,        // Max 5000 failed jobs
  },
};
