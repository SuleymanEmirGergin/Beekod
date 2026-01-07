import { scrapeProductFromUrl } from "./productScraper.js";
import { getAllIntegrations } from "./integrationService.js";
import { ShopifyConnector } from "./connectors/shopifyConnector.js";
import { WooConnector } from "./connectors/wooConnector.js";
import { logger } from "../logger.js";
import { IIntegrationConfig } from "../models/Integration.js";

// Helper to parse config
function parseConfig(raw: any): IIntegrationConfig {
    if (typeof raw === "string") {
        try { return JSON.parse(raw); } catch { return {} as any; }
    }
    return raw || {};
}

type ImportResult = {
    success: boolean;
    provider: string;
    productName: string;
    editUrl?: string;
    error?: string;
};

export async function importProductFromUrl(url: string, providerId: "shopify" | "woocommerce"): Promise<ImportResult> {
    logger.info("import.start", { url, providerId });

    // 1. Scrape
    const scraped = await scrapeProductFromUrl(url);
    if (!scraped) {
        return { success: false, provider: providerId, productName: "", error: "Failed to scrape product data from URL" };
    }

    // 2. Get Integration Config
    // Note: getIntegrationRow is internal to integrationService. 
    // I should use getAllIntegrations or add a getIntegrationById export.
    // For now I will import the one I need from direct DB access logic or update integrationService to export it. 
    // Let's assume (based on my previous plan) I might not have exported getIntegrationRow initially.
    // I'll fix this by adding a public "getIntegrationConfig" to integrationService or just using db here.
    // Checking previous file content... integrationService exports `toIntegration` inside `getAllIntegrations`.
    // I will write a simple query here or (better) reuse existing service properly. 

    // WAIT, I can use `getAllIntegrations` and find by ID. Not efficient but safe.
    const { getAllIntegrations } = await import("./integrationService.js");
    const integrations = await getAllIntegrations();
    const integration = integrations.find(i => i.providerId === providerId);

    if (!integration || !integration.connected) {
        return {
            success: false,
            provider: providerId,
            productName: scraped.name || "Unknown",
            error: `Integration ${providerId} is not connected. Please configure it in settings.`
        };
    }

    // 3. Connect & Create
    try {
        let result: { id: string; editUrl: string };

        if (providerId === "shopify") {
            const connector = new ShopifyConnector(integration.config);
            result = await connector.createProductDraft(scraped);
        } else {
            const connector = new WooConnector(integration.config);
            result = await connector.createProductDraft(scraped);
        }

        return {
            success: true,
            provider: providerId,
            productName: scraped.name || "Untitled Product",
            editUrl: result.editUrl
        };

    } catch (err: any) {
        logger.error("import.connector_error", { err });
        return {
            success: false,
            provider: providerId,
            productName: scraped.name || "Unknown",
            error: err.message || "Connector failed"
        };
    }
}
