/**
 * Price Comparison Service
 * 
 * Collects product data from all configured marketplaces and generates
 * a cross-marketplace price comparison report.
 * 
 * Runs as a scheduled background job every 6 hours by default.
 */

import * as fs from "fs";
import * as path from "path";
import { getMarketplaceProviders } from "./index.js";
import { logger } from "../../logger.js";
import { MarketplaceListing } from "./types.js";

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

interface PriceComparisonReport {
    timestamp: string;
    totalProducts: number;
    comparisonsFound: number;
    topDifferences: PriceComparison[];
    summary: {
        byMarketplace: { [mp: string]: { count: number; avgPrice: number } };
    };
}

/**
 * Normalize barcode to find matches across marketplaces
 */
function normalizeBarcode(barcode: string): string {
    const match = barcode.match(/^([A-Z]+-\d+)/i);
    return match ? match[1].toUpperCase() : barcode.toUpperCase();
}

/**
 * Fetch products from all configured marketplaces
 */
async function fetchAllMarketplaces(): Promise<ProductData[]> {
    const allProducts: ProductData[] = [];
    const providers = getMarketplaceProviders();

    for (const provider of providers) {
        if (!provider.isConfigured()) continue;

        try {
            const result = await provider.listListings({ size: 100 });
            if (result.ok && result.value.items.length > 0) {
                for (const item of result.value.items as MarketplaceListing[]) {
                    allProducts.push({
                        barcode: item.barcode,
                        title: item.title,
                        price: item.price || 0,
                        stock: item.stock || 0,
                        marketplace: provider.name,
                    });
                }
                logger.info("priceComparison.fetched", {
                    marketplace: provider.name,
                    count: result.value.items.length,
                });
            }
        } catch (error) {
            logger.error("priceComparison.fetchError", {
                marketplace: provider.name,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    return allProducts;
}

/**
 * Compare products across marketplaces
 */
function compareProducts(products: ProductData[]): PriceComparison[] {
    const groups = new Map<string, ProductData[]>();

    for (const p of products) {
        const key = normalizeBarcode(p.barcode);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(p);
    }

    const comparisons: PriceComparison[] = [];

    for (const [barcode, items] of groups) {
        const marketplaces = new Set(items.map((i) => i.marketplace));
        if (marketplaces.size < 2) continue;

        const prices: { [mp: string]: number } = {};
        const stocks: { [mp: string]: number } = {};

        for (const item of items) {
            prices[item.marketplace] = item.price;
            stocks[item.marketplace] = item.stock;
        }

        const priceValues = Object.values(prices).filter((p) => p > 0);
        if (priceValues.length === 0) continue;

        const minPrice = Math.min(...priceValues);
        const maxPrice = Math.max(...priceValues);
        const cheapestAt = Object.entries(prices).find(([, v]) => v === minPrice)?.[0] || "";

        comparisons.push({
            barcode,
            title: items[0].title,
            prices,
            stocks,
            minPrice,
            maxPrice,
            priceDiff: maxPrice - minPrice,
            cheapestAt,
        });
    }

    return comparisons.sort((a, b) => b.priceDiff - a.priceDiff);
}

/**
 * Generate and save price comparison report
 */
export async function runPriceComparison(): Promise<PriceComparisonReport> {
    logger.info("priceComparison.starting");

    const products = await fetchAllMarketplaces();
    const comparisons = compareProducts(products);

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

    const byMarketplace: { [mp: string]: { count: number; avgPrice: number } } = {};
    for (const [mp, stat] of mpStats) {
        byMarketplace[mp] = {
            count: stat.count,
            avgPrice: Math.round((stat.totalPrice / stat.count) * 100) / 100,
        };
    }

    const report: PriceComparisonReport = {
        timestamp: new Date().toISOString(),
        totalProducts: products.length,
        comparisonsFound: comparisons.length,
        topDifferences: comparisons.slice(0, 20),
        summary: { byMarketplace },
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), "price_comparison_report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    logger.info("priceComparison.completed", {
        totalProducts: products.length,
        comparisonsFound: comparisons.length,
        reportPath,
    });

    return report;
}
