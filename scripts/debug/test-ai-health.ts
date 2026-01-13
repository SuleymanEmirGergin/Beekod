import "../../env.js";
import { enqueueJob, getJobs } from "../../src/services/jobQueue.js";
import { logger } from "../../src/logger.js";

async function testHealthCheck() {
    console.log("=== Testing AI Health Check Job ===\n");

    // 1. Enqueue the job
    const job = await enqueueJob("ai.health_check");
    console.log(`Job enqueued: ${job?.id}`);

    // 2. Start worker to process it
    // We don't start the full scheduler, just the worker loop
    console.log("Processing queue...");
    
    // Wait a bit for processing
    let finished = false;
    for (let i = 0; i < 10; i++) {
        const current = await getJobs(1);
        const healthJob = current.find(j => j.id === job?.id);
        if (healthJob?.status === "done") {
            console.log("\n✅ Health check job completed!");
            console.log("Result:", JSON.stringify(healthJob.result, null, 2));
            finished = true;
            break;
        } else if (healthJob?.status === "failed") {
            console.error("\n❌ Health check job failed!");
            console.error("Error:", healthJob.error);
            finished = true;
            break;
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    if (!finished) {
        console.log("\nTimeout waiting for job completion.");
    }
}

testHealthCheck().catch(console.error);
