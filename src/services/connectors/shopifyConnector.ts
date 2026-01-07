import { ScrapedProduct } from "../productScraper.js";
import { IIntegrationConfig } from "../../models/Integration.js";
import { logger } from "../../logger.js";

// Basic Shopify Admin API wrapper
export class ShopifyConnector {
    private shopDomain: string;
    private accessToken: string;
    private apiVersion = "2024-01";

    constructor(config: IIntegrationConfig) {
        if (!config.shopDomain || !config.accessToken) {
            throw new Error("Missing Shopify configuration (shopDomain or accessToken)");
        }
        this.shopDomain = config.shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
        this.accessToken = config.accessToken;
    }

    async createProductDraft(product: ScrapedProduct): Promise<{ id: string; editUrl: string }> {
        const url = `https://${this.shopDomain}/admin/api/${this.apiVersion}/products.json`;

        // Map fields to Shopify Product Input
        const payload = {
            product: {
                title: product.name,
                body_html: product.description,
                vendor: "Imported via Beekod",
                product_type: product.category || "Uncategorized",
                status: "draft", // IMPORTANT: Unpublished draft
                images: product.images?.map((src) => ({ src })) || [],
                variants: [
                    {
                        price: product.price?.toString(),
                        sku: product.barcode,
                        inventory_management: "shopify",
                        inventory_quantity: product.stock || 0,
                    },
                ],
            },
        };

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": this.accessToken,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Shopify API Error ${res.status}: ${errText}`);
            }

            const data: any = await res.json();
            const newProduct = data.product;

            logger.info("shopify.product_created", { id: newProduct.id, title: newProduct.title });

            return {
                id: newProduct.id,
                // Direct link to Shopify Admin product page
                editUrl: `https://${this.shopDomain}/admin/products/${newProduct.id}`,
            };
        } catch (error) {
            logger.error("shopify.create_failed", { error });
            throw error;
        }
    }
}
