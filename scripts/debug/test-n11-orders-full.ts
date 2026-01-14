import "dotenv/config";
import { N11Provider } from "../../src/services/marketplace/providers/n11Provider.ts";

async function testOrders() {
    const p = new N11Provider();
    console.log("=== N11 Order Test ===");

    const statuses = ["Approved", "New", "Shipped", "Delivered"];
    let foundOrder = null;

    for (const status of statuses) {
        console.log(`\nChecking status: ${status}...`);
        const ordersResult = await p.getNewOrders({ status });
        
        if (!ordersResult.ok) {
            console.error(`Failed to fetch ${status} orders:`, ordersResult.error.message);
            continue;
        }

        const orders = ordersResult.value.orders || [];
        console.log(`Found ${orders.length} orders.`);

        if (orders.length > 0 && !foundOrder) {
            foundOrder = orders[0];
        }
    }

    if (!foundOrder) {
        console.log("\nNo orders found in any checked status.");
        return;
    }

    // 2. Fetch details for the first found order
    console.log(`\n2. Fetching details for order: ${foundOrder.orderNumber}`);
    const detailResult = await p.getOrderDetail(foundOrder.orderNumber);

    if (detailResult.ok) {
        console.log("Order Detail successfully retrieved!");
        console.log(JSON.stringify(detailResult.value, null, 2).slice(0, 1000) + "...");
    } else {
        console.error("Failed to fetch order detail:", detailResult.error.message);
    }
}

testOrders().catch(console.error);
