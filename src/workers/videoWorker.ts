import { Worker, Job } from 'bullmq';
import { redisConnection } from '../queue/config.js';
import { VideoGenerationJobData, VideoGenerationResult } from '../queue/videoQueue.js';
import { logger } from '../logger.js';

// Lazy import videoService to avoid circular dependencies
let videoService: any = null;

async function getVideoService() {
  if (!videoService) {
    const module = await import('../services/videoService.js');
    videoService = module;
  }
  return videoService;
}

/**
 * Video Generation Worker
 * 
 * Bu worker video oluşturma işlemlerini işler.
 * Ayrı bir process olarak çalıştırılmalıdır:
 * 
 * $ node dist/workers/videoWorker.js
 */
const worker = new Worker<VideoGenerationJobData, VideoGenerationResult>(
  'video-generation',
  async (job: Job<VideoGenerationJobData>) => {
    const { productId, barcode, prompt, duration, scenes } = job.data;
    
    logger.info('video_worker.start', { 
      jobId: job.id, 
      productId, 
      barcode 
    });

    try {
      // Update progress
      await job.updateProgress(10);

      // Get video service
      const service = await getVideoService();
      
      // Generate video
      await job.updateProgress(20);
      
      let result: VideoGenerationResult;
      
      if (scenes && scenes.length > 0) {
        // Scene-based generation
        const videoUrl = await service.generateVideoFromScenes(scenes);
        result = {
          success: true,
          videoUrl,
          duration: duration || 30,
        };
      } else {
        // Prompt-based or product-based generation
        const videoData = await service.generateProductVideo({
          productId,
          barcode,
          prompt,
          duration,
        });
        
        result = {
          success: true,
          videoUrl: videoData.url,
          thumbnailUrl: videoData.thumbnail,
          duration: videoData.duration,
        };
      }

      await job.updateProgress(100);
      
      logger.info('video_worker.complete', { 
        jobId: job.id, 
        videoUrl: result.videoUrl 
      });
      
      return result;
      
    } catch (error) {
      logger.error('video_worker.error', { 
        jobId: job.id, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video generation failed',
      };
    }
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.VIDEO_WORKER_CONCURRENCY || '1'), // 1 video at a time
    limiter: {
      max: 10,
      duration: 60000, // Max 10 videos per minute
    },
  }
);

// Event handlers
worker.on('completed', (job) => {
  logger.info('video_worker.completed', { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error('video_worker.failed', { 
    jobId: job?.id, 
    error: err.message 
  });
});

worker.on('error', (err) => {
  logger.error('video_worker.error', { error: err.message });
});

worker.on('stalled', (jobId) => {
  logger.warn('video_worker.stalled', { jobId });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('video_worker.shutdown');
  await worker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('video_worker.started', { 
  concurrency: worker.opts.concurrency,
  redis: `${(redisConnection as { host?: string }).host || 'localhost'}:${(redisConnection as { port?: number }).port || 6379}` 
});

export default worker;
