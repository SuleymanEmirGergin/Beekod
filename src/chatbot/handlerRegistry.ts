import { ChatHandler } from "./handlers/baseHandler.js";
import { searchHandler } from "./handlers/searchHandler.js";
import { wholesalerHandler } from "./handlers/wholesalerHandler.js";
import { priceHandler } from "./handlers/priceHandler.js";
import { stockHandler } from "./handlers/stockHandler.js";
import { orderHandler } from "./handlers/orderHandler.js";
import { marketplaceHandler } from "./handlers/marketplaceHandler.js";
import { productSearchHandler } from "./handlers/productSearchHandler.js";
import { analyticsHandler } from "./handlers/analyticsHandler.js";
import { ChatIntent } from "./types.js";

/**
 * Handler Registry
 * 
 * Tüm handler'ları merkezi bir yerden yönetir
 */
export class HandlerRegistry {
    private handlers: ChatHandler[] = [];

    constructor() {
        // Register all handlers
        this.register(productSearchHandler); // Priority for demo
        this.register(searchHandler);
        this.register(wholesalerHandler);
        this.register(priceHandler);
        this.register(stockHandler);
        this.register(orderHandler);
        this.register(marketplaceHandler);
        this.register(analyticsHandler);
    }

    /**
     * Handler kaydet
     */
    register(handler: ChatHandler): void {
        this.handlers.push(handler);
    }

    /**
     * Intent için uygun handler bul
     */
    getHandler(intent: ChatIntent): ChatHandler | null {
        return (
            this.handlers.find((h) => h.supportedIntents.includes(intent)) || null
        );
    }

    /**
     * Tüm handler'ları listele
     */
    listHandlers(): ChatHandler[] {
        return this.handlers;
    }
}

// Singleton instance
export const handlerRegistry = new HandlerRegistry();
