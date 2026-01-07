import { ScrapedProduct } from "../productScraper.js";
import { IIntegrationConfig } from "../../models/Integration.js";
import { logger } from "../../logger.js";

export class WooConnector {
    private storeUrl: string;
    private consumerKey: string;
    private consumerSecret: string;

    constructor(config: IIntegrationConfig) {
        if (!config.storeUrl || !config.consumerKey || !config.consumerSecret) {
            throw new Error("Missing WooCommerce configuration");
        }
        this.storeUrl = config.storeUrl.replace(/\/$/, "");
        this.consumerKey = config.consumerKey;
        this.consumerSecret = config.consumerSecret;
    }

    async createProductDraft(product: ScrapedProduct): Promise<{ id: string; editUrl: string }> {
        const endpoint = `${this.storeUrl}/wp-json/wc/v3/products`;

        // Auth header (Basic Auth)
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64");

        const payload = {
            name: product.name,
            description: product.description,
            type: "simple",
            status: "draft", // Unpublished
            regular_price: product.price?.toString(),
            sku: product.barcode,
            stock_quantity: product.stock,
            manage_stock: true,
            images: product.images?.map((src) => ({ src })) || [],
            categories: product.category ? [{ name: product.category }] : [],
        };

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${auth}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`WooCommerce API Error ${res.status}: ${errText}`);
            }

            const data: any = await res.json();

            logger.info("woo.product_created", { id: data.id, name: data.name });

            // Admin URL construction (standard WordPress)
            // Attempt to guess admin URL, usually /wp-admin/post.php?post=ID&action=edit
            const adminUrl = `${this.storeUrl}/wp-admin/post.php?post=${data.id}&action=edit`;

            return {
                id: data.id,
                editUrl: adminUrl,
            };
        } catch (error) {
            logger.error("woo.create_failed", { error });
            throw error;
        }
    }
}
