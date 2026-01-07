import { t } from "../../i18n.js";
import { syncPriceStock } from "../../services/syncService.js";
import { getPendingSync, clearPendingSync } from "../../services/sessionService.js";
import { IntentHandler } from "./types.js";

export const syncHandler: IntentHandler = async (parsed, context) => {
  const { locale, message, requestId } = context;

  if (parsed.intent === "sync.confirm") {
    const isConfirmed = /^(evet|yes|tamam|ok|okay|olur)$/i.test(message.trim());

    if (isConfirmed) {
      if (!requestId) {
        return { reply: t(locale, "sync_pending_not_found"), success: false };
      }

      const sessionContext = getPendingSync(requestId);
      if (!sessionContext) {
        return { reply: t(locale, "sync_pending_not_found"), success: false };
      }

      try {
        const syncResult = await syncPriceStock({
          barcode: sessionContext.barcode,
          price: sessionContext.price,
          stock: sessionContext.stock,
          targets: ["all"],
        });
        clearPendingSync(requestId);

        const successCount = syncResult.results.filter((r) => r.status === "ok").length;
        const resultSummary = syncResult.results
          .map((r) => `${r.marketplace}: ${r.status === "ok" ? "✅" : r.status === "not_configured" ? "⚙️" : "❌"}`)
          .join("\n");

        return {
          reply: t(locale, "sync_completed_count", {
            count: successCount,
            summary: resultSummary,
          }),
          data: syncResult,
          success: true,
        };
      } catch (error) {
        return { reply: t(locale, "sync_failed"), success: false };
      }
    } else {
      if (requestId) clearPendingSync(requestId);
      return {
        reply: t(locale, "sync_cancelled"),
        success: true,
      };
    }
  }

  return { reply: t(locale, "unknown_intent"), success: false };
};
