import { ConnectionOptions } from 'bullmq';
import { logger } from '../logger.js';

/**
 * Redis connection configuration for BullMQ
 */
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy(times: number) {
    if (times > 10) {
      logger.error('queue.redis.max_retries', { times });
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    logger.warn('queue.redis.retry', { times, delay });
    return delay;
  },
};

/**
 * Default job options for all queues
 */
export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 24 * 3600, // 24 hours
    count: 1000, // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // 7 days
    count: 5000, // Keep last 5000 failed jobs
  },
};
