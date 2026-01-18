import { Queue, Worker, Job } from 'bullmq';
import { connection, QUEUE_NAME } from './config.js';
import { jobProcessor } from './jobProcessor.js';
import { logger } from '../../logger.js';

export const queue = new Queue(QUEUE_NAME, { connection });

export const worker = new Worker(QUEUE_NAME, jobProcessor, {
  connection,
  concurrency: 5 // Process 5 jobs in parallel
});

worker.on('completed', (job) => {
  logger.info("queue.job_completed", { jobId: job.id, type: job.data.type });
});

worker.on('failed', (job, err) => {
  logger.error("queue.job_failed", { jobId: job?.id, type: job?.data?.type, error: err.message });
});

export async function addJob(type: string, payload?: unknown, options?: any) {
  return queue.add(type, { type, payload }, options);
}

export async function initRepeatedJobs() {
  const enabled = (process.env.SCHEDULER_ENABLED ?? "false").toLowerCase() === "true";
  if (!enabled) return;

  // Cleanup old repeatable jobs to ensure fresh config
  const repeatableJobs = await queue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await queue.removeRepeatableByKey(job.key);
  }

  const addRepeat = async (type: string, minutesStr?: string, defaultMinutes = 0) => {
    const minutes = Number(minutesStr ?? defaultMinutes);
    if (minutes > 0) {
      await queue.add(type, { type }, {
        repeat: {
          every: minutes * 60 * 1000
        }
      });
      logger.info("queue.scheduled", { type, minutes });
    }
  };

  await addRepeat("cache.refresh", process.env.SCHEDULER_CACHE_MINUTES);
  await addRepeat("marketplace.sync_all", process.env.SCHEDULER_SYNC_MINUTES);
  await addRepeat("ai.inventory_audit", process.env.SCHEDULER_AI_AUDIT_MINUTES, 60);
  await addRepeat("ai.auto_pricing", process.env.SCHEDULER_AI_PRICING_MINUTES);
  await addRepeat("ai.health_check", process.env.SCHEDULER_AI_HEALTH_MINUTES, 720);
  await addRepeat("ai.price_comparison", process.env.SCHEDULER_PRICE_COMPARISON_MINUTES, 360);
}
