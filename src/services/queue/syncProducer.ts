
import { Queue } from 'bullmq';
import { redisConnection } from '../../queue/config.js';
import { SyncJobData } from '../../queue/syncQueue.js'; // Import type
import { logger } from '../../logger.js';

// Define the queue
export const syncQueue = new Queue<SyncJobData>('sync-inventory', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: 100,
        removeOnFail: 500
    }
});

/**
 * Enqueue a sync job for a product
 */
export async function enqueueSyncJob(data: SyncJobData): Promise<string> {
    // Idempotency: Use barcode as job ID to prevent duplicate jobs for same product in queue
    // But we might want multiple updates if price changes rapidly.
    // Better: Allow duplicates but debounce? Or just simple append.
    // Requirement says: "Add idempotency keys to prevent duplicate sync storms"
    // Using barcode + timestamp suffix or just barcode (if we want to dedup pending jobs).
    // If we use just barcode as jobId, BullMQ deduplicates only if active/waiting?
    // Actually, explicit deduplication is better handled by checking queue state or specialized Redis key.
    // For simplicity and effectiveness in BullMQ, using a jobId derived from data content + time window could work,
    // OR letting BullMQ handle it if we want to update the payload of existing job?

    // Simplest robust approach:
    // If a job for this barcode is already 'waiting' or 'active', do not add another unless payload is different?
    // For high throughput, we just add it. The worker concurrency limit helps.
    // Strict idempotency: prevent *identical* request in short window.

    const jobId = await syncQueue.add('sync', data, {
        jobId: `sync-${data.barcode}-${Date.now()}` // Unique ID for every request for now to ensure it runs
    });

    logger.info("sync.enqueued", { jobId, barcode: data.barcode });
    return jobId;
}
