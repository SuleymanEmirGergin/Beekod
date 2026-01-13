import "../../env.js";
import { pttavmService } from "../../src/services/pttavmService.js";
import { hepsiburadaService } from "../../src/services/hepsiburadaService.js";
import fs from "fs";

async function check() {
    const results: any = { ptt: null, hb: null };
    console.log("--- PttAVM Check ---");
    try {
        const res = await pttavmService.getListings({});
        results.ptt = res;
        console.log("PttAVM Items Count:", res.items?.length || 0);
    } catch (e: any) {
        results.pttError = e.message;
        console.log("PttAVM Error:", e.message);
    }

    console.log("\n--- Hepsiburada Check ---");
    try {
        console.log("Testing Listings API...");
        const res = await hepsiburadaService.getListings({ limit: 1 });
        results.hbListings = res;
        console.log("HB Listings Status: SUCCESS");
    } catch (e: any) {
        results.hbListingsError = e.message;
        console.log("HB Listings Error:", e.message);
    }

    try {
        console.log("Testing Categories API...");
        const res = await hepsiburadaService.getAllCategories({ size: 1 });
        results.hbCategories = res;
        console.log("HB Categories Status: SUCCESS, Count:", res.length);
    } catch (e: any) {
        results.hbCategoriesError = e.message;
        console.log("HB Categories Error:", e.message);
    }

    fs.writeFileSync("debug_dump.json", JSON.stringify(results, null, 2));
    console.log("\nResults written to debug_dump.json");
}

check();
