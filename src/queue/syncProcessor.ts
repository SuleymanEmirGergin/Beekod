
import { Job, UnrecoverableError } from 'bullmq';
import { syncPriceStock } from '../services/marketplace/syncService.js';
import { logger } from '../logger.js';
import { SyncJobData } from './syncQueue.js';
import { PermanentSyncError, TransientSyncError } from '../errors/SyncErrors.js';

export const syncProcessor = async (job: Job<SyncJobData>) => {
    const { barcode, price, stock, targets, traceId } = job.data;
    const jobLogger = logger.child({ traceId, jobId: job.id, barcode });

    jobLogger.info("sync_job.start", { targets });

    try {
        const result = await syncPriceStock({
            barcode,
            price,
            stock,
            targets
        });

        if (!result.success) {
            const failed = result.results.filter(r => r.status === 'failed');

            // Analyze failures to determine retry strategy
            // If ALL failed with permanent errors (e.g. auth failed, not configured), we should NOT retry.
            // If ANY failed with transient (e.g. network, 5xx), we SHOULD retry.

            // For now, syncPriceStock returns generic message.
            // We'll rely on text matching or status codes if available in message?
            // "Sync failed after multiple attempts" is the generic wrapper.
            // But if `not_configured` status is returned, that is Permanent.

            // If all failures are "not_configured" or "invalid_credentials", throw UnrecoverableError.
            const allPermanent = failed.every(r =>
                r.message.includes("not configured") ||
                r.message.includes("Invalid credentials") ||
                r.message.includes("Product not found") // Maybe permanent?
            );

            if (failed.length === result.results.length) {
                if (allPermanent) {
                    throw new UnrecoverableError("All targets failed with permanent errors");
                }
                throw new Error("All targets failed sync"); // Triggers retry
            }

            jobLogger.warn("sync_job.partial_failure", { failedCount: failed.length, failed });
        }

        jobLogger.info("sync_job.complete", { success: result.success });
        return result;

    } catch (error: any) {
        jobLogger.error("sync_job.failed", { error });

        if (error instanceof UnrecoverableError) {
            throw error;
        }

        // Re-throw generic errors to trigger BullMQ retry
        throw error;
    }
};
