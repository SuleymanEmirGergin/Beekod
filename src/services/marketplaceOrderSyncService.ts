import { getMarketplaceProviders } from "./marketplace/index.js";
import { BaseMarketplaceProvider } from "./marketplace/providers/baseProvider.js";
import { createOrder, getAllOrders } from "./order/orderService.js";
import { logger } from "../logger.js";

export class MarketplaceOrderSyncService {
    /**
     * Syncs new orders from all configured marketplaces
     */
    async syncAllOrders() {
        const providers = getMarketplaceProviders();
        const configuredProviders = providers.filter(p => p.isConfigured());
        
        logger.info("order_sync.start", { count: configuredProviders.length });

        const results = [];
        for (const provider of configuredProviders) {
            try {
                const syncResult = await this.syncProviderOrders(provider as BaseMarketplaceProvider);
                results.push({ marketplace: provider.name, ...syncResult });
            } catch (error) {
                logger.error("order_sync.provider_failed", { marketplace: provider.name, error });
                results.push({ marketplace: provider.name, error: String(error) });
            }
        }

        return results;
    }

    private async syncProviderOrders(provider: BaseMarketplaceProvider) {
        // Fetch new orders (defaults to Approved for N11)
        const result = await provider.getNewOrders();
        if (!result.ok) {
            throw new Error(result.error.message);
        }

        const externalOrders = result.value.orders || [];
        const syncRes = await getAllOrders();
        if (!syncRes.ok) throw syncRes.error;
        const existingOrders = syncRes.value;
        
        let createdCount = 0;
        for (const extOrder of externalOrders) {
            // Check if order already exists (using requestId/orderNumber)
            const exists = existingOrders.some(o => 
                o.requestId === extOrder.orderNumber || 
                (o.source?.marketplaceId === provider.name && o.requestId.includes(extOrder.orderNumber))
            );

            if (!exists) {
                await createOrder({
                    source: {
                        name: provider.name,
                        marketplaceId: provider.name,
                        // We could add icons/logos here
                    },
                    customer: {
                        name: extOrder.customerName || "Müşteri",
                        email: extOrder.customerEmail,
                        phone: extOrder.customerPhone,
                        address: extOrder.customerAddress
                    },
                    total: `${extOrder.currency === 'TRY' ? '₺' : extOrder.currency}${extOrder.totalAmount}`,
                    items: extOrder.items.map((item) => ({
                        product_name: item.name,
                        sku: item.sku || "",
                        price: `₺${item.price}`,
                        quantity: item.quantity,
                        image_url: "" // Detailed fetch needed for images later
                    }))
                });
                createdCount++;
            }
        }

        return { fetched: externalOrders.length, created: createdCount };
    }
}

export const marketplaceOrderSyncService = new MarketplaceOrderSyncService();
