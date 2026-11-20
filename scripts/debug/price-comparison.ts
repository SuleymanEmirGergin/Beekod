import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

// N11 credentials come from .env (env.js)
process.env.N11_API_BASE = "https://api.n11.com";

interface ProductData {
    barcode: string;
    title: string;
    price: number;
    stock: number;
    marketplace: string;
}

interface PriceComparison {
    barcode: string;
    title: string;
    prices: { [marketplace: string]: number };
    stocks: { [marketplace: string]: number };
    minPrice: number;
    maxPrice: number;
    priceDiff: number;
    cheapestAt: string;
}

async function fetchAllMarketplaces(): Promise<ProductData[]> {
    const allProducts: ProductData[] = [];
    const marketplaces = ["Trendyol", "N11", "PttAVM", "Ciceksepeti"];

    for (const mp of marketplaces) {
        console.log(`Fetching from ${mp}...`);
        const provider = getMarketplaceProvider(mp);
        if (!provider) continue;

        try {
            const result = await provider.listListings({ size: 100 });
            if (result.ok && result.value.items.length > 0) {
                for (const item of result.value.items) {
                    allProducts.push({
                        barcode: item.barcode,
                        title: item.title,
                        price: item.price,
                        stock: item.stock,
                        marketplace: mp
                    });
                }
                console.log(`  -> ${result.value.items.length} products`);
            }
        } catch (e: any) {
            console.error(`  -> Error: ${e.message}`);
        }
    }

    return allProducts;
}

function normalizeBarcode(barcode: string): string {
    // Extract base barcode pattern (e.g., BGAJHAV-4328 from BGAJHAV-4328-12345)
    const match = barcode.match(/^([A-Z]+-\d+)/i);
    return match ? match[1].toUpperCase() : barcode.toUpperCase();
}

function compareProducts(products: ProductData[]): PriceComparison[] {
    // Group by normalized barcode
    const groups = new Map<string, ProductData[]>();
    
    for (const p of products) {
        const key = normalizeBarcode(p.barcode);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(p);
    }

    // Only keep products that exist in multiple marketplaces
    const comparisons: PriceComparison[] = [];
    
    for (const [barcode, items] of groups) {
        const marketplaces = new Set(items.map(i => i.marketplace));
        if (marketplaces.size < 2) continue;

        const prices: { [mp: string]: number } = {};
        const stocks: { [mp: string]: number } = {};
        
        for (const item of items) {
            prices[item.marketplace] = item.price;
            stocks[item.marketplace] = item.stock;
        }

        const priceValues = Object.values(prices).filter(p => p > 0);
        if (priceValues.length === 0) continue;

        const minPrice = Math.min(...priceValues);
        const maxPrice = Math.max(...priceValues);
        const cheapestAt = Object.entries(prices).find(([_, v]) => v === minPrice)?.[0] || "";

        comparisons.push({
            barcode,
            title: items[0].title,
            prices,
            stocks,
            minPrice,
            maxPrice,
            priceDiff: maxPrice - minPrice,
            cheapestAt
        });
    }

    // Sort by price difference (highest first)
    return comparisons.sort((a, b) => b.priceDiff - a.priceDiff);
}

async function main() {
    console.log("=== Cross-Marketplace Price Comparison ===\n");
    
    const products = await fetchAllMarketplaces();
    console.log(`\nTotal products fetched: ${products.length}\n`);

    const comparisons = compareProducts(products);
    console.log(`Products found in multiple marketplaces: ${comparisons.length}\n`);

    if (comparisons.length > 0) {
        console.log("Top 10 Price Differences:");
        console.log("-------------------------");
        
        const top10 = comparisons.slice(0, 10);
        for (const c of top10) {
            console.log(`\n📦 ${c.barcode}: ${c.title.substring(0, 50)}...`);
            console.log(`   Prices: ${Object.entries(c.prices).map(([k, v]) => `${k}: ${v}₺`).join(" | ")}`);
            console.log(`   💰 Cheapest at: ${c.cheapestAt} (${c.minPrice}₺)`);
            console.log(`   📊 Price diff: ${c.priceDiff}₺`);
        }
    }

    // Export as JSON for chatbot
    const report = {
        timestamp: new Date().toISOString(),
        totalProducts: products.length,
        comparisonsFound: comparisons.length,
        topDifferences: comparisons.slice(0, 20),
        summary: {
            byMarketplace: {} as { [mp: string]: { count: number; avgPrice: number } }
        }
    };

    // Calculate summary per marketplace
    const mpStats = new Map<string, { count: number; totalPrice: number }>();
    for (const p of products) {
        if (!mpStats.has(p.marketplace)) {
            mpStats.set(p.marketplace, { count: 0, totalPrice: 0 });
        }
        const stat = mpStats.get(p.marketplace)!;
        stat.count++;
        stat.totalPrice += p.price;
    }

    for (const [mp, stat] of mpStats) {
        report.summary.byMarketplace[mp] = {
            count: stat.count,
            avgPrice: Math.round(stat.totalPrice / stat.count * 100) / 100
        };
    }

    // Write report to file
    const fs = await import("fs");
    fs.writeFileSync("price_comparison_report.json", JSON.stringify(report, null, 2));
    console.log("\n✅ Report saved to price_comparison_report.json");
}

main().catch(console.error);
