
import { N11Provider } from "../../src/services/marketplace/providers/n11Provider.js";
import { logger } from "../../src/logger.js";
import * as dotenv from "dotenv";

dotenv.config();

async function testN11Images() {
  const provider = new N11Provider();
  
  if (!provider.isConfigured()) {
    console.error("N11 provider is not configured. Check your .env file.");
    return;
  }

  console.log("Fetching listings with deep=true...");
  
  const result = await provider.listListings({
    pageSize: 5,
    deep: true
  });

  if (result.ok) {
    const data = result.value;
    if (data.status === "ok") {
      console.log(`Successfully fetched ${data.items.length} items.`);
      
      for (const item of data.items) {
        console.log(`- Product: ${item.title}`);
        console.log(`  Barcode: ${item.barcode}`);
        console.log(`  Images: ${item.images?.length || 0}`);
        if (item.images && item.images.length > 0) {
          console.log(`  First Image: ${item.images[0]}`);
        }
        console.log(`  Description cached: ${item.description ? "Yes" : "No"}`);
        console.log("-------------------");
      }
    } else {
      console.error("Action failed:", data.message);
    }
  } else {
    console.error("Result failed:", result.error.message);
  }
}

testN11Images().catch(err => {
  console.error("Test failed with error:", err);
});
