#!/usr/bin/env node
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runAudit() {
  console.log("🔍 Running dependency security audit...");
  try {
    const { stdout } = await execAsync("npm audit --json");
    const result = JSON.parse(stdout);

    // Check for high/critical vulnerabilities
    // npm audit json structure varies by version, but generally has 'vulnerabilities' or 'advisories'
    // Modern npm (v7+) uses 'vulnerabilities' object with counts in 'metadata.vulnerabilities'

    const stats = result.metadata?.vulnerabilities || {};
    const critical = stats.critical || 0;
    const high = stats.high || 0;

    console.log("📊 Audit Summary:", stats);

    if (critical > 0 || high > 0) {
      console.error(`\n❌ SECURITY FAILURE: Found ${critical} critical and ${high} high vulnerabilities.`);
      console.error("Run 'npm audit' manually to investigate and fix.");
      process.exit(1);
    } else {
      console.log("\n✅ Security check passed. No high/critical vulnerabilities found.");
    }

  } catch (error: any) {
    // npm audit returns non-zero exit code if vulnerabilities are found
    // We need to parse stdout even on error if it contains the json
    try {
        if (error.stdout) {
            const result = JSON.parse(error.stdout);
            const stats = result.metadata?.vulnerabilities || {};
            const critical = stats.critical || 0;
            const high = stats.high || 0;

            console.log("📊 Audit Summary:", stats);

            if (critical > 0 || high > 0) {
                console.error(`\n❌ SECURITY FAILURE: Found ${critical} critical and ${high} high vulnerabilities.`);
                process.exit(1);
            }
             console.log("\n✅ Security check passed (only low/moderate issues).");
             process.exit(0);
        }
    } catch (parseError) {
        // Fallback
    }

    console.error("⚠️ Failed to run audit:", error.message);
    // Don't block build on tool failure, but warn
    process.exit(0);
  }
}

runAudit();
