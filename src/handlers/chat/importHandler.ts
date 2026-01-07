import { t } from "../../i18n.js";
import { logger } from "../../logger.js";
import { IntentHandler } from "./types.js";
import { importProductFromUrl } from "../../services/productImportService.js";
import { getAllIntegrations } from "../../services/integrationService.js";

export const importHandler: IntentHandler = async (parsed, context) => {
    const { locale } = context;
    const url = parsed.text; // Assuming entity extraction puts the URL in 'text' or we extract it manually

    // 1. Try to get URL from text
    // Simple regex for URL if not strictly parsed
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = url?.match(urlRegex);
    let targetUrl = match ? match[0] : null;

    // 2. If no URL in text, check context for "last_search_result"
    if (!targetUrl) {
        const { getContext } = await import("../../services/chatSessionService.js");

        // Handle Selection (e.g. "1", "2.yi seç")
        if (parsed.intent === "search.select" && parsed.selectionIndex !== undefined) {
            const list = getContext(context.userId || "anon", "last_search_results_list");
            if (list && Array.isArray(list) && list[parsed.selectionIndex]) {
                const selected = list[parsed.selectionIndex];
                targetUrl = selected.item ? selected.item.url : selected.url; // Support both structures
                logger.info("import.using_selection_url", { index: parsed.selectionIndex, url: targetUrl });

                // Inform user we picked it
                // We can prepend this to the final reply or just proceed. 
                // Let's rely on standard success message which shows product name.
            } else {
                return { reply: t(locale, "search_selection_invalid"), success: false };
            }
        }

        // Fallback to "last_search_result" (default/single)
        if (!targetUrl) {
            const lastResult = getContext(context.userId || "anon", "last_search_result");
            if (lastResult) {
                targetUrl = lastResult.item ? lastResult.item.url : lastResult.url;
                logger.info("import.using_context_url", { url: targetUrl });
            }
        }
    }

    if (!targetUrl) {
        return { reply: t(locale, "import_missing_url"), success: false };
    }

    // Check which provider to use. For now, pick the first connected one or ask user?
    // User request said "One click import". Let's prefer Shopify, then Woo.
    const integrations = await getAllIntegrations();
    const shopify = integrations.find(i => i.providerId === "shopify" && i.connected);
    const woo = integrations.find(i => i.providerId === "woocommerce" && i.connected);

    const provider = shopify ? "shopify" : (woo ? "woocommerce" : null);

    if (!provider) {
        return {
            reply: t(locale, "import_no_provider_connected"),
            success: false
        };
    }

    // Notify user we are working on it
    // Note: Handler returns *one* reply. If we want immediate feedback + async result, 
    // we normally would need streaming. Here we will await the result (might take 5-10s).

    try {
        const result = await importProductFromUrl(targetUrl, provider);

        if (result.success) {
            return {
                reply: t(locale, "import_success", {
                    name: result.productName || "Product",
                    link: result.editUrl || ""
                }),
                data: { ...result },
                success: true
            };
        } else {
            return {
                reply: t(locale, "import_failed", { reason: result.error || "Unknown error" }),
                success: false
            };
        }

    } catch (error: any) {
        logger.error("chat.import_failed", { error });
        return {
            reply: t(locale, "import_failed", { reason: error.message || "Unknown error" }),
            success: false
        };
    }
};
