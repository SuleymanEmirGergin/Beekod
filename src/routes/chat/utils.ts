import { t } from "../../i18n.js";
import { ParsedMessage } from "../../services/nlp.js";
import * as Handlers from "../../handlers/chat/index.js";
import * as SessionService from "../../services/chatSessionService.js";

export function looksLikeNewCommand(text: string): boolean {
    const m = (text || "").toLowerCase();
    if (m.includes("?")) return true;
    if (m.includes("kritik stok")) return true;
    if (m.includes("en çok satan")) return true;
    if (m.includes("satış") && (m.includes("özet") || m.includes("performans"))) return true;
    if (m.includes("fiyat") && m.includes("analiz")) return true;
    if (m.includes("yardım") || m.includes("help")) return true;
    return false;
}

export function looksLikeRefinement(text: string): boolean {
    const s = (text || "").trim();
    if (!s) return false;
    if (s.length > 60) return false;
    return true;
}

export function applyPending(parsed: ParsedMessage, message: string, pending: SessionService.PendingTask | null) {
    if (!pending) return;
    if (looksLikeNewCommand(message)) return;
    if (!looksLikeRefinement(message)) return;

    const currentIntent = String(parsed.intent || "");
    const pendingIntent = String(pending.intent || "");

    const shouldOverride =
        currentIntent === "unknown" ||
        (currentIntent.startsWith("product.") && currentIntent !== "product.add") ||
        currentIntent.startsWith("price.") ||
        currentIntent.startsWith("stock.") ||
        currentIntent.startsWith("search.");

    if (!shouldOverride) return;

    parsed.intent = pendingIntent as any;
    parsed.query = message;

    if (!parsed.barcode && pending.params?.barcode) parsed.barcode = pending.params.barcode;
    if (!parsed.marketplace && pending.params?.marketplace) parsed.marketplace = pending.params.marketplace;

    if (Array.isArray(parsed.missing)) {
        if (parsed.barcode) parsed.missing = parsed.missing.filter((x: string) => x !== "barcode");
        if (parsed.marketplace) parsed.missing = parsed.missing.filter((x: string) => x !== "marketplace");
    }
}

export const getIntentHandler = (intent: string): Handlers.IntentHandler | null => {
    if (intent === "unknown") return Handlers.geminiHandler;

    if (intent.startsWith("content.")) {
        if (
            intent === "content.instagram" ||
            intent === "content.facebook" ||
            intent === "content.twitter" ||
            intent === "content.social_media"
        ) {
            return Handlers.socialMediaHandler;
        }
        return Handlers.contentHandler;
    }

    if (intent.startsWith("image.") || intent.startsWith("visual.")) return Handlers.imageHandler;
    if (intent === "cargo.list") return Handlers.cargoHandler;
    if (intent.startsWith("report.")) return Handlers.reportHandler;
    if (intent === "pricing.recommend") return Handlers.pricingHandler;
    if (intent === "cache.reset") return Handlers.utilsHandler;
    if (intent.startsWith("sync.")) return Handlers.syncHandler;
    if (intent === "network.stock.query" || intent === "NETWORK_STOCK_QUERY") return Handlers.networkHandler;
    if (intent === "UPDATE_PRICE" || intent === "UPDATE_STOCK") return Handlers.updateHandler;
    if (intent === "BATCH_UPDATE") return Handlers.batchHandler;
    if (intent === "SEND_MESSAGE") return Handlers.messageHandler;
    if (intent === "SEO_CONTENT" || intent === "TRANSLATE") return Handlers.contentHandler;

    if (
        intent.startsWith("product.") ||
        intent.startsWith("price.") ||
        intent.startsWith("stock.") ||
        intent === "competitor.list"
    )
        return Handlers.productHandler;

    // search.select should go to importHandler (product selection from list)
    if (intent === "search.select") return Handlers.importHandler;
    if (intent === "product.import") return Handlers.importHandler;
    if (intent.startsWith("web.") || intent.startsWith("search.")) return Handlers.searchHandler;
    if (intent.startsWith("marketplace.")) return Handlers.marketplaceHandler;
    if (intent.startsWith("analytics.")) return Handlers.analyticsHandler;
    if (intent === "user.preferences.set") return Handlers.preferenceHandler;

    if (intent === "help")
        return async (_parsed, context) => ({ reply: t(context.locale, "help_message"), success: true });

    return null;
};
