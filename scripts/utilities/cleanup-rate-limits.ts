import "../env.js";
import { query } from "../src/db.js";

const rawMinutes = Number(process.env.RATE_LIMIT_CLEANUP_MINUTES ?? 10);
const minutes = Number.isFinite(rawMinutes) && rawMinutes > 0 ? Math.trunc(rawMinutes) : 10;
const cutoff = new Date(Date.now() - minutes * 60 * 1000);

async function run() {
  const result = await query<{ affectedRows?: number }>(
    "DELETE FROM rate_limits WHERE window_start < ?",
    [cutoff]
  );
  const affected = (result as unknown as { affectedRows?: number }).affectedRows ?? 0;
  console.log(`[RateLimit] cleaned ${affected} rows older than ${minutes} minutes.`);
}

run().catch((error) => {
  console.error("[RateLimit] cleanup failed", error);
  process.exitCode = 1;
});
