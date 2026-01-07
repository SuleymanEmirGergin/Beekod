import { getDashboardData } from "../src/services/dashboardService.js";
import mongoose from "mongoose";
import { config } from "../src/config.js";

async function verify() {
    console.log("Connecting to DB...");
    // Simple connection if config allows, or just test logic if we can mock.
    // Actually, we need DB connection for Order.find()

    try {
        if (config.db.mongoUri) {
            await mongoose.connect(config.db.mongoUri);
            console.log("Connected to DB");
        } else {
            console.log("No Mongo URI, skipping DB test");
            return;
        }

        const data = await getDashboardData();
        console.log("Dashboard Data:", JSON.stringify(data, null, 2));

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
