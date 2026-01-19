
import { Worker } from 'bullmq';
import { redisConnection } from './config.js';
import { syncProcessor } from './syncProcessor.js'; // Import processor
import { logger } from '../logger.js';
import { SyncTarget } from '../services/marketplace/syncService.js';

export interface SyncJobData {
    barcode: string;
    price: number;
    stock?: number;
    targets?: SyncTarget[];
    traceId?: string;
}

export const syncWorker = new Worker<SyncJobData>(
    'sync-inventory',
    syncProcessor, // Use extracted processor
    {
        connection: redisConnection,
        concurrency: 5,
        limiter: {
            max: 100,
            duration: 60000
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 1000 }
    }
);

syncWorker.on('completed', (job) => {
    logger.info('sync_job.bullmq_completed', { jobId: job.id });
});

syncWorker.on('failed', (job, err) => {
    logger.error('sync_job.bullmq_failed', { jobId: job?.id, error: err.message });
});
