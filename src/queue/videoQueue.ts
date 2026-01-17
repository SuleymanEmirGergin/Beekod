import { Queue, QueueEvents } from 'bullmq';
import { redisConnection, defaultJobOptions } from './config.js';
import { logger } from '../logger.js';

/**
 * Video generation job data types
 */
export interface VideoGenerationJobData {
  userId?: string;
  productId?: string;
  barcode?: string;
  prompt?: string;
  duration?: number;
  aspectRatio?: string;
  style?: string;
  scenes?: any[];
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

import { isRedisEnabled } from './config.js';

/**
 * Video generation queue
 */
export const videoQueue = isRedisEnabled()
  ? new Queue<VideoGenerationJobData, VideoGenerationResult>('video-generation', {
      connection: redisConnection,
      defaultJobOptions: {
        ...defaultJobOptions,
        attempts: 2, // Video generation is expensive, limit retries
      },
    })
  : ({
      add: async () => { logger.warn('video_queue.disabled'); return {} as any; },
      close: async () => {},
      on: () => {},
    } as unknown as Queue<VideoGenerationJobData, VideoGenerationResult>);

/**
 * Queue events for monitoring
 */
const videoQueueEvents = isRedisEnabled()
  ? new QueueEvents('video-generation', {
      connection: redisConnection,
    })
  : ({
      on: () => {},
      close: async () => {},
    } as unknown as QueueEvents);

videoQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  const result = returnvalue as unknown as VideoGenerationResult | undefined;
  logger.info('video_queue.completed', { 
    jobId, 
    success: result?.success,
    videoUrl: result?.videoUrl 
  });
});

videoQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('video_queue.failed', { jobId, reason: failedReason });
});

videoQueueEvents.on('progress', ({ jobId, data }) => {
  logger.debug('video_queue.progress', { jobId, progress: data });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('video_queue.shutdown');
  await videoQueue.close();
  await videoQueueEvents.close();
});

logger.info('video_queue.initialized', { 
  redis: `${(redisConnection as { host?: string }).host || 'localhost'}:${(redisConnection as { port?: number }).port || 6379}` 
});

