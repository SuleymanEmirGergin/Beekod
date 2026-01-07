import { t } from "../../i18n.js";
import { logger } from "../../logger.js";
import { IntentHandler } from "./types.js";
import { searchProductsByEmbedding } from "../../services/productService.js";
import { randomUUID } from "crypto";

export const searchHandler: IntentHandler = async (parsed, context) => {
  const { locale, requestId } = context;

  // Handle semantic product search intent
  if (parsed.intent === "search.product" || parsed.intent === "search") {
    const query = parsed.query ?? parsed.text ?? "";

    if (!query) {
      return { reply: t(locale, "search_missing_query"), success: false };
    }

    try {
      // Use semantic search with embeddings
      const products = await searchProductsByEmbedding(query);

      if (!products.length) {
        return {
          reply: locale === "tr"
            ? `"${query}" ile eşleşen ürün bulamadım. Farklı kelimelerle deneyebilir misin?`
            : `No products found matching "${query}". Try different keywords?`,
          success: false
        };
      }

      // Format results for display
      const list = products.map((p, i) => {
        const stockLabel = p.stock > 0 ? `${p.stock} adet` : "Stokta yok";
        const priceLabel = p.price ? `${p.price} ${p.currency || 'TL'}` : "";
        return `${i + 1}. **${p.name}**\n   📦 ${stockLabel}${priceLabel ? ` | 💰 ${priceLabel}` : ""}`;
      }).join("\n\n");

      const summary = locale === "tr"
        ? `🔍 **"${query}"** için bulduğum ürünler:\n\n${list}`
        : `🔍 Products found for **"${query}"**:\n\n${list}`;

      return {
        reply: summary,
        data: {
          type: "semantic_search_results",
          query,
          items: products
        },
        success: true,
      };
    } catch (error) {
      logger.error("chat.semantic_search_failed", { requestId, error });
      return { reply: t(locale, "search_failed"), success: false };
    }
  }

  // Web search intent - search across marketplaces
  if (parsed.intent === "web.search") {
    const query = parsed.query ?? parsed.text ?? "";

    if (!query) {
      return { reply: t(locale, "search_missing_query"), success: false };
    }

    try {
      const { runOptimizedSearchList } = await import("../../services/searchService.js");
      const { optimizeSearchQuery } = await import("../../services/searchQueryOptimizer.js");
      const { setContext } = await import("../../services/chatSessionService.js");


      // CLEANUP: Ensure the query shown to user and used for search is clean
      // This handles cases where Gemini puts verbose reasoning in the JSON params
      const cleanQuery = await optimizeSearchQuery(query);


      // 1. Perform Smart Optimized Search (includes normalization + fallback loop + scoring)
      // Note: runOptimizedSearch also cleans internally, but we need cleanQuery for the reply message below
      // 1. Perform Smart Optimized Search (List Mode)
      // Note: runOptimizedSearch also cleans internally, but we need cleanQuery for the reply message below
      const results = await runOptimizedSearchList(cleanQuery, 10);

      if (!results || results.length === 0) {
        return {
          reply: locale === "tr"
            ? `"${cleanQuery}" için ne yazık ki uygun bir sonuç bulamadım. Aramayı genelleştirmeyi deneyebilirsin.`
            : `Unfortunately, I couldn't find any matching results for "${cleanQuery}". You might try generalizing your search.`,
          success: false
        };
      }

      // Format List Output
      let reply = locale === "tr"
        ? `🔍 **"${cleanQuery}"** için ${results.length} sonuç buldum:\n\n`
        : `🔍 Found ${results.length} results for **"${cleanQuery}"**:\n\n`;

      results.forEach((r, index) => {
        const storeName = r.site ? r.site.charAt(0).toUpperCase() + r.site.slice(1) : "Pazaryeri";
        const priceStr = r.price && r.price > 0 ? `${r.price} ${r.currency || 'TL'}` : (locale === 'tr' ? "Fiyat sayfada" : "See price");
        reply += `${index + 1}. **[${storeName}]** ${r.title}\n   💰 ${priceStr} | 🔗 [Link](${r.url})`;

        if (r.image) {
          reply += `\n   ![${r.title}](${r.image})`;
        }
        reply += `\n\n`;
      });

      if (locale === "tr") {
        reply += `⬇️ **Hangisini ekleyelim?**\nSadece numarasını yazman yeterli (örn: "1" veya "3.yü seç").`;
      } else {
        reply += `⬇️ **Which one should we add?**\nJust type the number (e.g., "1" or "Select 3").`;
      }

      // Save context for "add this product" command (List support)
      setContext(context.userId || "anon", "last_search_results_list", results);
      // Keep legacy single context for backward compatibility 
      setContext(context.userId || "anon", "last_search_result", results[0]);

      return {
        reply,
        data: {
          type: "product_search_results",
          query,
          results: results,
          search_id: randomUUID(),
          ts: Date.now()
        },
        success: true,
      };
    } catch (error) {
      logger.error("chat.web_search_failed", {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        reply: locale === "tr"
          ? "Web araması sırasında bir hata oluştu. Lütfen tekrar dene."
          : "An error occurred during web search. Please try again.",
        success: false
      };
    }
  }

  return { reply: t(locale, "unknown_intent"), success: false };
};
