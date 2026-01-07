import { t } from "../../i18n.js";
import { resetMarketplaceCache } from "../../services/marketplaceStore.js";
import { resetSalesCache } from "../../services/salesStore.js";
// Cache import removed
import { IntentHandler } from "./types.js";

export const utilsHandler: IntentHandler = async (parsed, context) => {
  const { locale } = context;

  if (parsed.intent === "cache.reset") {
    resetMarketplaceCache();
    resetSalesCache();
    // cache.flushAll(); // TODO: Re-enable after fixing cache service
    return {
      reply: t(locale, "cache_reset_done"),
      success: true,
    };
  }

  return { reply: t(locale, "unknown_intent"), success: false };
};
