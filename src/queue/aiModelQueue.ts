import { Queue, QueueEvents } from 'bullmq';
import { redisConnection, defaultJobOptions } from './config.js';
import { logger } from '../logger.js';

/**
 * AI Model / Virtual Try-On job data types
 */
export interface AIModelJobData {
  userId?: string;
  productId?: string;
  barcode?: string;
  modelType?: string;
  garmentImageUrl?: string;
  modelImageUrl?: string;
  category?: string;
}

export interface AIModelResult {
  success: boolean;
  resultImageUrl?: string;
  modelUsed?: string;
  processingTime?: number;
  error?: string;
}

/**
 * AI Model generation queue (Virtual Try-On, etc.)
 */
export const aiModelQueue = new Queue<AIModelJobData, AIModelResult>('ai-model-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
  },
});

/**
 * Queue events for monitoring
 */
const aiModelQueueEvents = new QueueEvents('ai-model-generation', {
  connection: redisConnection,
});

aiModelQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  const result = returnvalue as unknown as AIModelResult | undefined;
  logger.info('ai_model_queue.completed', { 
    jobId, 
    success: result?.success,
    resultUrl: result?.resultImageUrl 
  });
});

aiModelQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('ai_model_queue.failed', { jobId, reason: failedReason });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('ai_model_queue.shutdown');
  await aiModelQueue.close();
  await aiModelQueueEvents.close();
});

logger.info('ai_model_queue.initialized');
