import { Worker, Job } from 'bullmq';
import { redisConnection } from '../queue/config.js';
import { AIModelJobData, AIModelResult } from '../queue/aiModelQueue.js';
import { logger } from '../logger.js';

// Lazy imports
let visualIntelligenceService: any = null;
let virtualTryOnService: any = null;

async function getServices() {
  if (!visualIntelligenceService || !virtualTryOnService) {
    const viModule = await import('../services/visualIntelligenceService.js');
    const vtoModule = await import('../services/virtualTryOnService.js');
    visualIntelligenceService = viModule;
    virtualTryOnService = vtoModule;
  }
  return { visualIntelligenceService, virtualTryOnService };
}

/**
 * AI Model / Virtual Try-On Worker
 * 
 * Bu worker AI model işlemlerini (Virtual Try-On, vb.) işler.
 * Fal.ai kullanarak senkron çalışır.
 * 
 * Ayrı bir process olarak çalıştırılmalıdır:
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

      const { visualIntelligenceService, virtualTryOnService } = await getServices();
      const startTime = Date.now();
      
      await job.updateProgress(20);
      
      let resultImageUrl: string;
      
      // Use Fal.ai for Virtual Try-On
      if (garmentImageUrl && modelImageUrl) {
        logger.info('ai_model_worker.using_fal', { jobId: job.id });
        
        const cat = category === 'upper_body' ? 'tops' : 
                    category === 'lower_body' ? 'bottoms' : 'tops';
        
        resultImageUrl = await visualIntelligenceService.runVirtualTryOn(
          modelImageUrl,
          garmentImageUrl,
          cat
        );
        
      } else {
        // Fallback to VTO service
        logger.info('ai_model_worker.using_vto_service', { jobId: job.id });
        
        const vtoResult = await virtualTryOnService.generateVirtualTryOn(
          modelImageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
          garmentImageUrl || productId,
          'tops'
        );
        
        resultImageUrl = vtoResult.imageUrl || '';
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
    concurrency: parseInt(process.env.AI_WORKER_CONCURRENCY || '2'),
    limiter: {
      max: 20,
      duration: 60000,
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
