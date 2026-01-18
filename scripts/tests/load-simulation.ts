#!/usr/bin/env node
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const ADMIN_KEY = process.env.ADMIN_KEY || 'Threem123';
const CONCURRENCY = 20;
const DURATION_MS = 10000;

async function flood() {
  console.log(`🚀 Starting load simulation: ${CONCURRENCY} concurrent requests for ${DURATION_MS}ms`);

  const start = Date.now();
  let completed = 0;
  let errors = 0;
  let slow = 0;

  const runWorker = async () => {
    while (Date.now() - start < DURATION_MS) {
      const reqStart = Date.now();
      try {
        await axios.get(`${API_URL}/products?limit=10`, {
          headers: { 'x-admin-key': ADMIN_KEY },
          timeout: 5000
        });
        const duration = Date.now() - reqStart;
        if (duration > 500) slow++;
        completed++;
      } catch (e: any) {
        errors++;
        // console.error(e.message);
      }
      // Small delay to prevent complete local port exhaustion if mocking
      await new Promise(r => setTimeout(r, 10));
    }
  };

  const workers = Array(CONCURRENCY).fill(null).map(runWorker);
  await Promise.all(workers);

  console.log("\n📊 Load Test Results:");
  console.log(`- Total Requests: ${completed + errors}`);
  console.log(`- Success: ${completed}`);
  console.log(`- Errors: ${errors}`);
  console.log(`- Slow Requests (>500ms): ${slow}`);
  console.log(`- RPS: ${((completed + errors) / (DURATION_MS / 1000)).toFixed(1)}`);

  const failureRate = errors / (completed + errors || 1);
  const slowRate = slow / (completed + errors || 1);

  if (failureRate > 0.05) {
      console.error(`❌ FAILURE: Error rate ${(failureRate * 100).toFixed(1)}% exceeds 5% threshold.`);
      process.exit(1);
  }

  if (slowRate > 0.10) {
      console.error(`❌ FAILURE: Slow request rate ${(slowRate * 100).toFixed(1)}% exceeds 10% threshold.`);
      process.exit(1);
  }

  console.log("✅ Load test passed (Latency & Error Rate within limits).");
}

flood();
