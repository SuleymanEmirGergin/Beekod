import { Worker, Job } from 'bullmq';
import { redisConnection } from '../queue/config.js';
import { AIModelJobData, AIModelResult } from '../queue/aiModelQueue.js';
import { logger } from '../logger.js';

// Lazy imports
let virtualTryOnService: any = null;
let wiroService: any = null;

async function getServices() {
  if (!virtualTryOnService || !wiroService) {
    const vtoModule = await import('../services/virtualTryOnService.js');
    const wiroModule = await import('../services/wiroService.js');
    virtualTryOnService = vtoModule;
    wiroService = wiroModule;
  }
  return { virtualTryOnService, wiroService };
}

/**
 * AI Model / Virtual Try-On Worker
 * 
 * Bu worker AI model işlemlerini (Virtual Try-On, vb.) işler.
 * Ayrı bir process olarak çalıştırılmalıdır:
 * 
 * $ node dist/workers/aiModelWorker.js
 */
const worker = new Worker<AIModelJobData, AIModelResult>(
  'ai-model-generation',
  async (job: Job<AIModelJobData>) => {
    const { productId, barcode, modelType, garmentImageUrl, modelImageUrl, category } = job.data;
    
    logger.info('ai_model_worker.start', { 
      jobId: job.id, 
      productId, 
      modelType 
    });

    try {
      await job.updateProgress(10);

      const { virtualTryOnService, wiroService } = await getServices();
      const startTime = Date.now();
      
      await job.updateProgress(20);
      
      let resultImageUrl: string;
      
      // Try Wiro service first (if available)
      if (process.env.WIRO_API_KEY && garmentImageUrl && modelImageUrl) {
        logger.info('ai_model_worker.using_wiro', { jobId: job.id });
        
        const wiroResult = await wiroService.generateVirtualTryOn({
          garmentImage: garmentImageUrl,
          modelImage: modelImageUrl,
          category: category || 'upper_body',
        });
        
        resultImageUrl = wiroResult.resultUrl;
        
      } else {
        // Fallback to Replicate or local VTO service
        logger.info('ai_model_worker.using_fallback', { jobId: job.id });
        
        const vtoResult = await virtualTryOnService.applyVirtualTryOn({
          productId,
          barcode,
          modelType: modelType || 'latin_female',
        });
        
        resultImageUrl = vtoResult.imageUrl;
      }

      await job.updateProgress(100);
      
      const processingTime = Date.now() - startTime;
      
      logger.info('ai_model_worker.complete', { 
        jobId: job.id, 
        resultImageUrl,
        processingTime 
      });
      
      return {
        success: true,
        resultImageUrl,
        modelUsed: modelType || 'default',
        processingTime,
      };
      
    } catch (error) {
      logger.error('ai_model_worker.error', { 
        jobId: job.id, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI model generation failed',
      };
    }
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.AI_WORKER_CONCURRENCY || '2'), // 2 concurrent AI jobs
    limiter: {
      max: 20,
      duration: 60000, // Max 20 AI jobs per minute
    },
  }
);

// Event handlers
worker.on('completed', (job) => {
  logger.info('ai_model_worker.completed', { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error('ai_model_worker.failed', { 
    jobId: job?.id, 
    error: err.message 
  });
});

worker.on('error', (err) => {
  logger.error('ai_model_worker.error', { error: err.message });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('ai_model_worker.shutdown');
  await worker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('ai_model_worker.started', { 
  concurrency: worker.opts.concurrency 
});

export default worker;
