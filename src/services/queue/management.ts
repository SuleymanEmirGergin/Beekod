import { queue } from './index.js';
import { logger } from '../../logger.js';

export const queueManagement = {
  /**
   * Get jobs from the Dead Letter Queue
   */
  async getDeadLetterJobs(start = 0, end = 50) {
    const jobs = await queue.getJobs(['failed'], start, end, true);
    return jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      attemptsMade: job.attemptsMade,
    }));
  },

  /**
   * Retry a specific failed job
   */
  async retryJob(jobId: string) {
    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    if (await job.getState() !== 'failed') {
      throw new Error(`Job ${jobId} is not in failed state`);
    }
    await job.retry();
    logger.info("queue.job_retried", { jobId });
    return { success: true, jobId };
  },

  /**
   * Retry all failed jobs
   */
  async retryAllFailed() {
    const failedJobs = await queue.getFailed();
    const results = await Promise.allSettled(failedJobs.map(job => job.retry()));
    const succeeded = results.filter(r => r.status === 'fulfilled').length;

    logger.info("queue.retry_all", { total: failedJobs.length, succeeded });
    return {
      total: failedJobs.length,
      succeeded,
      failed: failedJobs.length - succeeded
    };
  },

  /**
   * Clean old failed jobs
   */
  async cleanFailed(gracePeriodMs = 1000 * 60 * 60 * 24 * 7) { // Default 7 days
    const count = await queue.clean(gracePeriodMs, 0, 'failed'); // 0 = unlimited
    logger.info("queue.clean_failed", { count });
    return { count };
  }
};
