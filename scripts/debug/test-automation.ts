import { enqueueJob, getJobs } from "../../src/services/jobQueue.js";
import { updateUserPreferences, getUserPreferences } from "../../src/services/userPreferenceService.js";
import { logger } from "../../src/logger.js";

async function testAutomation() {
    console.log("=== Testing AI Background Automation ===");

    // 1. Initial State
    console.log("\n1. Initial preferences:");
    console.log(getUserPreferences("admin"));

    // 2. Disable auto pricing and enqueue
    console.log("\n2. Disabling auto pricing and enqueuing job...");
    updateUserPreferences("admin", { enable_ai_auto_pricing: false });
    const job1 = await enqueueJob("ai.auto_pricing");
    console.log("Job 1 enqueued:", job1?.id);

    // 3. Enable auto pricing and enqueue
    console.log("\n3. Enabling auto pricing and enqueuing job...");
    updateUserPreferences("admin", { enable_ai_auto_pricing: true });
    const job2 = await enqueueJob("ai.auto_pricing");
    console.log("Job 2 enqueued:", job2?.id);

    // 4. Enqueue inventory audit
    console.log("\n4. Enqueuing inventory audit...");
    const job3 = await enqueueJob("ai.inventory_audit");
    console.log("Job 3 enqueued:", job3?.id);

    console.log("\nWaiting for jobs to process...");
    await new Promise(r => setTimeout(r, 5000));

    const allJobs = await getJobs(10);
    console.log("\nRecent Jobs status:");
    allJobs.filter(j => j.type.startsWith("ai.")).forEach(j => {
        console.log(`- [${j.type}] Status: ${j.status}, Result:`, j.result);
    });
}

testAutomation().catch(console.error);
