import { Router } from "express";
import { z } from "zod";
import { t } from "../i18n.js";
import { createLog } from "../services/logService.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/responseHelper.js";
import { parseMessage, ParsedMessage } from "../services/nlp.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody } from "../validation.js";
import { ChatBodySchema } from "../validation/schemas.js";
import { logger, chatLogger } from "../logger.js";
import { Locale, ApiErrorResponse } from "../types.js";
import * as Handlers from "../handlers/chat/index.js";
import * as SessionService from "../services/chatSessionService.js";
import { getUserPreferences, updateUserPreferences } from "../services/userPreferenceService.js";
import { generateDailyBrief } from "../services/dailyBriefService.js";
// Cache import removed
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

const router = Router();
// requireJsonBody middleware'i sadece JSON istekleri için çalışır
// FormData istekleri için otomatik olarak next() çağrılır, bu yüzden sorun yok
// Ama daha güvenli olması için sadece JSON endpoint'lerine uygulayalım
// router.use(requireJsonBody); // Tüm route'lara uygulamak yerine, sadece JSON bekleyen route'lara uygulayalım

function looksLikeNewCommand(text: string): boolean {
  const m = (text || "").toLowerCase();
  if (m.includes("?")) return true;
  if (m.includes("kritik stok")) return true;
  if (m.includes("en çok satan")) return true;
  if (m.includes("satış") && (m.includes("özet") || m.includes("performans"))) return true;
  if (m.includes("fiyat") && m.includes("analiz")) return true;
  if (m.includes("yardım") || m.includes("help")) return true;
  return false;
}

function looksLikeRefinement(text: string): boolean {
  const s = (text || "").trim();
  if (!s) return false;
  if (s.length > 60) return false;
  return true;
}

function applyPending(parsed: ParsedMessage, message: string, pending: SessionService.PendingTask | null) {
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

const getIntentHandler = (intent: string): Handlers.IntentHandler | null => {
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

router.get("/chat/preferences", requireJsonBody, async (req, res) => {
  const sessionKey = SessionService.getSessionKey(req);
  const prefs = getUserPreferences(sessionKey);
  return sendSuccessResponse(res, prefs);
});

router.get("/chat/history", requireJsonBody, async (req, res) => {
  const sessionKey = SessionService.getSessionKey(req);
  const locale = (req.query.locale as Locale) || "tr";

  // Try to generate daily brief if not already done today
  const today = new Date().toDateString();
  const briefKey = `daily_brief_sent:${sessionKey}:${today}`;

  // Send proactive daily brief if enabled
  const userId = sessionKey; // Assuming sessionKey is userId
  const briefKeyNew = `daily_brief_sent:${userId}:${new Date().toDateString()}`;
  // Cache disabled for now
  const shouldSendBrief = false; // Disabled until cache service is fixed
  let proactiveBrief = null;

  if (shouldSendBrief) {
    const brief = await generateDailyBrief(userId, locale);
    if (brief) {
      // Cache disabled for now
      proactiveBrief = brief;
    } else {
      // Cache disabled for now
    }
  }

  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const history = await SessionService.getHistory(sessionKey, limit);
  return sendSuccessResponse(res, history);
});

router.get("/chat/daily-brief", requireJsonBody, async (req, res) => {
  const sessionKey = SessionService.getSessionKey(req);
  const locale = (req.query.locale as Locale) || "tr";

  try {
    const brief = await generateDailyBrief(sessionKey, locale);
    return sendSuccessResponse(res, { brief });
  } catch (error) {
    logger.error("chat.daily_brief_failed", { sessionKey, err: error });
    return sendErrorResponse({ res, statusCode: 500, message: "Brief generation failed", error: "generation_failed" });
  }
});

router.post("/chat/preferences", requireJsonBody, async (req, res) => {
  const sessionKey = SessionService.getSessionKey(req);
  const prefs = req.body;
  if (!prefs) {
    return sendErrorResponse({ res, statusCode: 400, message: "Missing preferences", error: "missing_body" });
  }
  // Ideally we should validate prefs here
  await updateUserPreferences(sessionKey, prefs);
  return sendSuccessResponse(res, { success: true });
});

router.post("/chat", upload.single("image"), async (req, res, next) => {
  // FormData ve JSON için esnek validation
  const isFormData = req.is("multipart/form-data");

  if (isFormData) {
    // FormData için validation'ı atla, multer zaten parse etti
    // Sadece gerekli alanları kontrol et
    if (!req.body?.message && !req.body?.action) {
      return sendErrorResponse({
        res,
        statusCode: 400,
        code: "BAD_REQUEST",
        message: "Either 'message' or 'action' must be provided",
        error: "Missing parameters",
      });
    }
    return next();
  } else {
    // JSON için normal validation
    return validateBody(ChatBodySchema)(req, res, next);
  }
}, async (req, res) => {
  const message = (req.body?.message || "").trim();
  // history can be an array if JSON or a string if FormData
  let history: any[] = [];
  try {
    if (typeof req.body.history === "string") {
      history = JSON.parse(req.body.history);
    } else if (Array.isArray(req.body.history)) {
      history = req.body.history;
    }
  } catch (e) {
    logger.warn("chat.history_parse_failed", { err: e });
  }

  const action = req.body?.action;

  if (!message && !action) {
    return sendErrorResponse({
      res,
      statusCode: 400,
      code: "BAD_REQUEST",
      message: "Message or action is required",
      error: "Missing parameters",
    });
  }

  const sessionKey = SessionService.getSessionKey(req) || req.body.sessionId || 'default-session';
  const pending = SessionService.getPending(sessionKey);

  if (/^\s*(iptal|vazgeç|sıfırla|reset)\s*$/i.test(message)) {
    SessionService.clearPending(sessionKey);
  }

  const localeHint: Locale | undefined =
    req.body?.locale === "en" ? "en" : req.body?.locale === "tr" ? "tr" : undefined;

  let parsed: ParsedMessage = parseMessage(message, localeHint);

  // If an explicit action is provided, override the intent
  if (action === "TOP_SELLERS") {
    parsed.intent = "report.top_products";
    parsed.amount = req.body.limit || 5;
  } else if (action === "CRITICAL_STOCK") {
    parsed.intent = "stock.alert.list";
    parsed.amount = req.body.threshold || 10;
  } else if (action === "SALES_SUMMARY") {
    parsed.intent = "report.sales";
    parsed.period = "this_week";
  }

  if (req.body?.barcode) {
    parsed.barcode = req.body.barcode;
    parsed.missing = parsed.missing.filter((m: string) => m !== "barcode");
  }

  const file = (req as any).file as Express.Multer.File | undefined;

  if (file) {
    const intent = String(parsed.intent || "");
    const isImageIntent = intent.startsWith("image.") || intent.startsWith("visual.");
    if (!isImageIntent) {
      const isSearchQuery = /\b(ara|bul|bak|search|find|lookup|fiyat|ne\s*kadar)\b/i.test(message);

      if (isSearchQuery) {
        parsed.intent = "image.search";
        if (Array.isArray(parsed.missing)) {
          parsed.missing = parsed.missing.filter((x: string) => !x.startsWith("image_"));
        }
      } else if (intent !== "unknown" || !message) {
        parsed.intent = "image.inspect";
        if (Array.isArray(parsed.missing)) {
          parsed.missing = parsed.missing.filter((x: string) => !x.startsWith("image_"));
        }
      }
    }
  }

  applyPending(parsed, message, pending);

  // Save user message
  if (message) {
    await SessionService.saveMessage(sessionKey, "user", message);
  }

  // 1. Context injection: If barcode is missing, try to get from previous context
  if (!parsed.barcode) {
    const activeBarcode = await SessionService.getActiveBarcode(sessionKey);
    if (activeBarcode) {
      parsed.barcode = activeBarcode;
      if (Array.isArray(parsed.missing)) {
        parsed.missing = parsed.missing.filter((m: string) => m !== "barcode");
      }
      logger.debug("chat.context_barcode_injected", { sessionKey, barcode: activeBarcode });
    }
  }

  const userPreferences = getUserPreferences(sessionKey);

  const context: Handlers.ChatContext = {
    locale: parsed.locale,
    requestId: res.locals?.requestId,
    userId: sessionKey,
    message,
    history,
    userPreferences,
    body: { ...req.body, file },
  };

  let reply = "";
  let success = true;
  let status = 200;
  let data: any = null;
  let logBarcode = parsed.barcode;
  let errorText: string | undefined;

  try {
    if (parsed.missing.length && parsed.intent !== "marketplace.add") {
      if (parsed.missing.includes("image_inspect_info")) reply = t(context.locale, "image_inspect_info");
      else if (parsed.missing.includes("image_search_info")) reply = t(context.locale, "image_search_missing");
      else if (parsed.missing.includes("batch_request_id")) reply = t(context.locale, "missing_batch_request_id");
      else if (parsed.missing.includes("product_info")) reply = t(context.locale, "missing_product_info");
      else if (parsed.missing.includes("marketplace")) reply = t(context.locale, "missing_marketplace");
      else if (parsed.missing.includes("name")) reply = t(context.locale, "missing_product_name");
      else if (parsed.missing.includes("price")) reply = t(context.locale, "missing_price");
      else if (parsed.missing.includes("stock")) reply = t(context.locale, "missing_stock");
      else if (parsed.missing.includes("search_query")) reply = t(context.locale, "search_missing_query");
      else if (parsed.missing.includes("barcode") && parsed.missing.includes("amount"))
        reply = t(context.locale, "missing_both");
      else if (parsed.missing.includes("barcode")) reply = t(context.locale, "missing_barcode");
      else {
        const needsPercent = parsed.intent.includes("increase") || parsed.intent.includes("decrease");
        reply = t(context.locale, needsPercent ? "missing_amount_or_percent" : "missing_amount");
      }
      success = false;
    } else {
      const handler = getIntentHandler(parsed.intent);
      if (handler) {
        const startTime = Date.now();
        const result = await handler(parsed, context);
        reply = result.reply;
        data = result.data;
        success = result.success;
        if (result.logBarcode) logBarcode = result.logBarcode;

        let finalIntent = parsed.intent;

        // SPECIAL: If gemini suggests a different intent, we can re-route or just attach it
        if (parsed.intent === "unknown" && reply) {
          try {
            const jsonMatch = reply.match(/\{.*"suggested_intent"\s*:\s*"([^"]+)".*\}/s);
            if (jsonMatch) {
              const suggestion = JSON.parse(jsonMatch[0]);
              const newIntent = suggestion.suggested_intent;
              const newHandler = getIntentHandler(newIntent);
              if (newHandler && newIntent !== "unknown") {
                logger.info("chat.rerouting_to_suggested_intent", { newIntent });
                const newParsed = { ...parsed, intent: newIntent, ...suggestion.params };
                const newResult = await newHandler(newParsed, context);
                // Merge or override? Let's prefix the original reply if it had text
                let cleanReply = reply.replace(/\{.*"suggested_intent".*\}/s, "").trim();

                // Remove common technical prefixes if they are the only thing left
                if (cleanReply.includes("Özet:") || cleanReply.includes("Adımlar:") || cleanReply.includes("Düşünce Süreci:")) {
                  // Only keep if it seems like a real human-friendly message (heuristic: has more than just the notes)
                  // For now, let's just strip the notes sections if possible or discard if it's mostly notes
                  cleanReply = cleanReply.replace(/(?:Özet|Adımlar|Düşünce Süreci|Onay Gerekmiyor):.*$/is, "").trim();
                }

                reply = (cleanReply ? cleanReply + "\n\n" : "") + newResult.reply;
                data = { ...data, ...newResult.data, appliedIntent: newIntent };
                success = newResult.success;
                finalIntent = newIntent;
              }
            }
          } catch (e) {
            logger.warn("chat.suggested_intent_parse_failed", { err: e });
          }
        }

        // Log intent analytics
        chatLogger.info("chat.intent", {
          event: "intent_execution",
          intent: finalIntent,
          duration: Date.now() - startTime,
          success,
          locale: context.locale,
        });

        if (success) {
          const intent = String(parsed.intent || "");
          const shouldPend =
            intent.startsWith("analytics.") || intent.startsWith("report.") || intent.startsWith("marketplace.");

          if (shouldPend) {
            SessionService.setPending(sessionKey, intent, {
              barcode: logBarcode,
              marketplace: parsed.marketplace,
            });
          } else {
            SessionService.clearPending(sessionKey);
          }
        }
      } else {
        reply = t(context.locale, "unknown_intent");
        success = false;
      }
    }
  } catch (error) {
    logger.error("chat.handle_failed", { requestId: context.requestId, err: error });
    reply = t(context.locale, "server_error");
    success = false;
    status = 500;
    errorText = error instanceof Error ? error.message : String(error);
  }

  // Ensure we always have a reply
  if (!reply || reply.trim() === "") {
    reply = context.locale === "tr"
      ? "Üzgünüm kanka, bir şeyler ters gitti. Tekrar deneyebilir misin? 🤔"
      : "Sorry buddy, something went wrong. Could you try again? 🤔";
    success = false;
    logger.warn("chat.empty_reply", {
      intent: parsed.intent,
      message,
      requestId: context.requestId
    });
  }

  // Save AI response
  if (reply) {
    const messageMeta = { ...data, barcode: logBarcode || data?.barcode || parsed.barcode };
    await SessionService.saveMessage(sessionKey, "ai", reply, messageMeta);
  }

  await createLog({
    intent: parsed.intent,
    locale: context.locale,
    message,
    barcode: logBarcode,
    amount: parsed.amount ?? parsed.percent ?? undefined,
    response: reply,
    success,
    error: errorText,
  });

  if (status >= 400) {
    return sendErrorResponse({
      res,
      statusCode: status,
      code: status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
      message: reply,
      error: errorText,
      requestId: context.requestId,
    });
  }

  // --- DEBUG_FAKE_AI MANTIĞI (İsteğe bağlı, test için açılabilir) ---
  const DEBUG_FAKE_AI = false; // Gerçek test için true yapabilirsin
  if (DEBUG_FAKE_AI) {
    return res.json({
      success: true,
      reply: "Test cevabı çalışıyor ✅ (Fake AI Mode)",
      data: null,
      meta: { locale: context.locale }
    });
  }

  return res.json({
    success: success && !!reply,
    reply: reply || (context.locale === "tr" ? "Cevap yok (Backend)" : "No reply (Backend)"),
    data: data || {},
    meta: { locale: context.locale }
  });
});

export { router as chatRouter };
