
import { Queue } from 'bullmq';
import { redisConnection } from '../../queue/config.js';
import { SyncJobData } from '../../queue/syncQueue.js'; // Import type
import { logger } from '../../logger.js';
import crypto from 'crypto';

// Define the queue
export const syncQueue = new Queue<SyncJobData>('sync-inventory', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: 1000,
        removeOnFail: 5000
    }
});

/**
 * Generates a deterministic job ID for idempotency.
 * Combines barcode, targets, and a time bucket (e.g. 5 seconds) to dedup rapid duplicate requests.
 */
function generateJobId(data: SyncJobData): string {
    const targetsKey = data.targets ? data.targets.sort().join(',') : 'all';
    // 5-second idempotency window
    const timeBucket = Math.floor(Date.now() / 5000);
    const raw = `${data.barcode}:${targetsKey}:${timeBucket}`;
    return crypto.createHash('md5').update(raw).digest('hex');
}

/**
 * Enqueue a sync job for a product
 */
export async function enqueueSyncJob(data: SyncJobData): Promise<string> {
    const jobId = generateJobId(data);

    // BullMQ deduplicates automatically if jobId matches an active/waiting/delayed job state?
    // Actually, adding a job with same ID while one exists in any state (even completed/failed if not removed) might act differently depending on BullMQ version.
    // Usually it returns the existing job if present.
    // Our configuration removes completed jobs (count: 1000), so older completed jobs won't block new ones eventually.
    // But short-term (5s window), this prevents spamming the queue.

    await syncQueue.add('sync', data, {
        jobId: jobId
    });

    logger.info("sync.enqueued", { jobId, barcode: data.barcode });
    return jobId;
}
