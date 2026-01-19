
import { Job } from 'bullmq';
import { syncPriceStock, SyncPriceInput, SyncTarget } from '../services/marketplace/syncService.js';
import { logger } from '../logger.js';
import { SyncJobData } from './syncQueue.js';

export const syncProcessor = async (job: Job<SyncJobData>) => {
    const { barcode, price, stock, targets, traceId } = job.data;
    const jobLogger = logger.child({ traceId, jobId: job.id, barcode });

    jobLogger.info("sync_job.start", { targets });

    try {
        // Call the sync logic
        const result = await syncPriceStock({
            barcode,
            price,
            stock,
            targets
        });

        if (!result.success) {
            const failed = result.results.filter(r => r.status === 'failed');
            jobLogger.error("sync_job.partial_failure", { failedCount: failed.length, failed });

            if (failed.length === result.results.length) {
                throw new Error("All targets failed sync");
            }
        }

        jobLogger.info("sync_job.complete", { success: result.success });
        return result;

    } catch (error) {
        jobLogger.error("sync_job.failed", { error });
        throw error;
    }
};
