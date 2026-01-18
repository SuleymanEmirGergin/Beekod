import { Job } from 'bullmq';
import { logger } from '../../logger.js';
import { refreshCaches, syncAllMarketplaceListings } from '../operationsService.js';
import { performLiveUpdate, LiveUpdatePayload } from '../marketplaceLiveRetry.js';
import { performPublish } from '../marketplace/marketplacePublishService.js';
import { addJob } from './index.js';
import { runWithRequestId } from '../../lib/context.js';

export type JobType =
  | "cache.refresh"
  | "marketplace.sync_all"
  | "marketplace.live_update"
  | "marketplace.publish"
  | "ai.inventory_audit"
  | "ai.auto_pricing"
  | "ai.health_check"
  | "ai.price_comparison"
  | "ai.high_priority_sync"
  | "ai.low_priority_sync"
  | "social.check_scheduled"
  | "social.post";

export type JobStatus = "queued" | "running" | "done" | "failed";

export async function jobProcessor(job: Job) {
  // Wrap execution in AsyncLocalStorage context with Job ID as Correlation ID
  return runWithRequestId(job.id, async () => {
      const { type, payload } = job.data as { type: JobType; payload: any };
      logger.info("queue.process_job_start", { jobId: job.id, type });

      try {
        let result: unknown = null;

        if (type === "cache.refresh") {
          const refreshResult = refreshCaches();
          if (!refreshResult.ok) throw new Error("cache_refresh_failed");
          result = refreshResult;
        } else if (type === "marketplace.sync_all") {
          const syncResult = await syncAllMarketplaceListings();
          if (!syncResult.ok) throw new Error(syncResult.reason || "sync_all_failed");
          result = syncResult;
        } else if (type === "marketplace.live_update") {
          if (!payload) throw new Error("live_update_payload_required");
          const liveUpdateResult = await performLiveUpdate(payload);
          if (!liveUpdateResult.ok) throw new Error(liveUpdateResult.error.message);
          result = liveUpdateResult.value;
        } else if (type === "marketplace.publish") {
            if (!payload?.productId || !payload?.marketplace) throw new Error("publish_payload_invalid");
            const publishResult = await performPublish({
                productId: Number(payload.productId),
                marketplace: payload.marketplace,
                userId: Number(payload.userId ?? 0)
            });
            result = publishResult;
            if (publishResult.status === "failed") throw new Error(publishResult.message);
        } else if (type === "ai.inventory_audit") {
            const { inventoryAuditService } = await import("../ai/inventoryAuditService.js");
            const auditRes = await inventoryAuditService.detectOverSellingRisks();
            if (!auditRes.ok) throw auditRes.error;
            result = { riskCount: auditRes.value.length, risks: auditRes.value };
        } else if (type === "ai.auto_pricing") {
            const { pricingIntelligenceService } = await import("../ai/pricingIntelligenceService.js");
            const { query } = await import("../../db.js");
            const { getMarketplaceProvider } = await import("../marketplace/index.js");

            const products = await query<any[]>("SELECT barcode, name FROM products ORDER BY updated_at ASC LIMIT 2");
            const updates = [];
            for (const p of products) {
                const analysisRes = await pricingIntelligenceService.analyzeBuyBoxStatus(p.barcode);
                if (analysisRes.ok) {
                    const analysis = analysisRes.value;
                    if (analysis.suggestedPrice !== analysis.myPrice && analysis.suggestedPrice > 0) {
                        const marketplaces = ["Trendyol", "Hepsiburada"];
                        for (const mp of marketplaces) {
                            const provider = getMarketplaceProvider(mp);
                            if (provider && provider.isConfigured()) {
                                await provider.updateListing({ barcode: p.barcode, price: analysis.suggestedPrice });
                                updates.push({ barcode: p.barcode, marketplace: mp, oldPrice: analysis.myPrice, newPrice: analysis.suggestedPrice });
                            }
                        }
                    }
                }
            }
            result = { updatesProcessed: updates.length, details: updates };
        } else if (type === "ai.health_check") {
            const { healthCheckService } = await import("../marketplace/healthCheckService.js");
            result = await healthCheckService.runAllChecks();
        } else if (type === "ai.price_comparison") {
            const { runPriceComparison } = await import("../marketplace/priceComparisonService.js");
            const comparisonRes = await runPriceComparison();
            if (comparisonRes.ok) {
                result = { jobStatus: "Price comparison completed", ...comparisonRes.value };
            } else {
                throw comparisonRes.error;
            }
        } else if (type === "ai.high_priority_sync") {
            const syncResult = await syncAllMarketplaceListings({ onlyCritical: true });
            result = { jobStatus: "High priority sync completed", ...syncResult };
        } else if (type === "ai.low_priority_sync") {
            const syncResult = await syncAllMarketplaceListings({ minStock: 6 });
            result = { jobStatus: "Low priority sync completed", ...syncResult };
        } else if (type === "social.check_scheduled") {
            const { getPosts } = await import("../social/socialService.js");
            const posts = await getPosts({ status: "Draft" });
            const now = new Date();
            const duePosts = posts.filter(p => p.scheduledDate && new Date(p.scheduledDate) <= now);

            for (const post of duePosts) {
                await addJob("social.post", { postId: post.id });
            }
            result = { checkedCount: posts.length, queuedCount: duePosts.length };
        } else if (type === "social.post") {
            if (!payload?.postId) throw new Error("postId_required");
            const { postNow } = await import("../social/socialService.js");
            const success = await postNow(payload.postId);
            if (!success) throw new Error("social_post_failed");
            result = { success: true };
        }

        logger.info("queue.process_job_success", { jobId: job.id, type });
        return result;
      } catch (error: any) {
        logger.error("queue.process_job_failed", { jobId: job.id, type, error: error.message });
        throw error;
      }
  });
}
