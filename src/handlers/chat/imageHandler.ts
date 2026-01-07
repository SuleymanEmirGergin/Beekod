import fsPromises from "fs/promises";
import path from "path";
import { t } from "../../i18n.js";
import { reprocessByBarcode } from "../../images/imageRoutes.js";
import { inspectImageBuffer } from "../../images/imageInspect.js";
import { insertImageInspectReport } from "../../images/imageInspectStore.js";
import { getImageProfile } from "../../images/imageProfiles.js";
import { resolveMarketplaceProfileSet } from "../../images/marketplaceProfileSets.js";
import { readLatestOriginalBuffer, readLatestProcessedBuffer } from "../../images/imageService.js";
import { resolveProductByName } from "../../services/productResolutionService.js";
import { runImageSearch } from "../../services/imageSearchService.js";
import { runVisualSearch } from "../../services/visualSearchService.js";
import { googleVisionOcrFromBuffer } from "../../services/googleVisionService.js";
import { buildSearchQueryFromOcr } from "../../images/imageSearch.js";
import { CseConfigError, CseRequestError } from "../../services/searchService.js";
import { truncateText } from "../../utils/searchContext.js";
import { config } from "../../config.js";
import { logger } from "../../logger.js";
import { IntentHandler } from "./types.js";
import { analyzeImage } from "../../services/geminiService.js";
import { unifiedMarketplaceSearch } from "../../services/unifiedMarketplaceSearch.js";

function resolveStoragePath(relativePath: string) {
  return path.resolve(config.images.storagePath, relativePath);
}

export const imageHandler: IntentHandler = async (parsed, context) => {
  const { locale, message, requestId } = context;

  if (parsed.intent === "image.process") {
    const barcode = parsed.barcode?.toLowerCase();
    const marketplace = parsed.marketplace ?? null;
    if (!barcode) {
      return { reply: t(locale, "missing_barcode"), success: false };
    } else {
      const result = await reprocessByBarcode({
        barcode,
        marketplace,
        profileName: parsed.profile ?? undefined,
      });
      if ("error" in result) {
        if (result.error === "profile_not_found") {
          return { reply: t(locale, "image_profile_missing"), success: false };
        } else {
          return { reply: t(locale, "image_upload_required"), success: false };
        }
      } else {
        return {
          reply: t(locale, "image_ready", { url: result.result.processedUrl }),
          data: result.result,
          success: true,
          logBarcode: barcode,
        };
      }
    }
  } else if (parsed.intent === "image.inspect") {
    let barcode = parsed.barcode?.toLowerCase();
    const marketplace = parsed.marketplace ?? null;
    const profileName = parsed.profile?.trim();
    const profile = profileName ? getImageProfile(profileName) : null;
    const profileSet = resolveMarketplaceProfileSet(marketplace);
    const fallbackProfile = !profile && profileSet?.defaultProfile ? getImageProfile(profileSet.defaultProfile) : null;
    const desiredProfileName = profile?.name ?? fallbackProfile?.name ?? null;
    const autoFixRequested =
      context.body?.autoFix === true || /\bonayla\b|\bduzelt\b|\bfix\b|\bapprove\b|\bauto\s*fix\b/i.test(message);

    if (profileName && !profile) {
      return { reply: t(locale, "image_profile_missing"), success: false };
    }

    if (!barcode) {
      const nameCandidate = parsed.title ?? parsed.productName ?? parsed.text;
      if (nameCandidate) {
        const resolution = await resolveProductByName(nameCandidate);
        if (resolution.notFound) {
          return { reply: t(locale, "product_name_not_found"), success: false };
        } else if (resolution.ambiguous) {
          const list = resolution.ambiguous.map((item: any) => `${item.name} (${item.barcode})`).join(", ");
          return { reply: t(locale, "product_ambiguous", { list }), success: false };
        } else if (resolution.product) {
          barcode = resolution.product.barcode;
        }
      }
    }

    let buffer: Buffer | null = null;
    let bufferSource: "processed" | "original" | "reprocessed" | null = null;
    let bufferImageId: number | null = null;
    let processedProfileName: string | null = null;

    if (barcode) {
      const processed = await readLatestProcessedBuffer({
        barcode,
        profile: desiredProfileName ?? undefined,
      });
      if (processed) {
        buffer = processed.buffer;
        bufferSource = "processed";
        bufferImageId = processed.imageId ?? null;
        processedProfileName = processed.profile;
      } else {
        const latest = await readLatestOriginalBuffer(barcode);
        if (!latest) {
          return { reply: t(locale, "image_upload_required"), success: false };
        } else {
          buffer = latest.buffer;
          bufferSource = "original";
          bufferImageId = latest.imageId ?? null;
        }
      }
    }

    if (!barcode) {
      // If we have a buffer but no barcode, try AI analysis (General Vision)
      const file = context.body?.file;
      if (file && file.buffer) {
        try {
          const analysis = await analyzeImage({
            buffer: file.buffer,
            mimeType: file.mimetype,
            prompt: locale === 'tr' ? "Bu görseli detaylı analiz et. Ne görüyorsun?" : "Analyze this image in detail. What do you see?",
            locale
          });

          if (analysis) {
            return { reply: analysis, success: true, data: { source: 'gemini_vision' } };
          }
        } catch (e) {
          logger.warn("image.ai_analysis_failed", { err: e });
          // Fallthrough to standard error
        }
      }

      return { reply: t(locale, "image_inspect_info"), success: false };
    }

    if (buffer) {
      try {
        const inspectProfile =
          profile ?? fallbackProfile ?? (processedProfileName ? getImageProfile(processedProfileName) : null);
        let report = await inspectImageBuffer(buffer, {
          profile: inspectProfile,
          marketplace,
          maxBytes: config.images.maxUploadBytes,
        });

        const marketplaceLower = (marketplace ?? "").toLowerCase();
        const profileHint =
          report.profile ??
          profileSet?.defaultProfile ??
          (marketplaceLower.includes("trendyol")
            ? "trendyol_square"
            : marketplaceLower.includes("hepsiburada")
              ? "hepsiburada_square"
              : marketplaceLower.includes("instagram")
                ? "instagram_post_focus"
                : config.images.defaultProfile);

        let autoFixResult: any = null;

        if (autoFixRequested && report.issues.length && barcode) {
          const fix = await reprocessByBarcode({
            barcode,
            marketplace,
            profileName: profileHint,
          });

          if (!("error" in fix)) {
            autoFixResult = {
              processedUrl: fix.result.processedUrl,
              profile: fix.result.profile,
              imageId: fix.result.imageId,
            };
            bufferSource = "reprocessed";
            bufferImageId = fix.result.imageId;
            try {
              const processedBuffer = await fsPromises.readFile(resolveStoragePath(fix.result.processedPath));
              const fixProfile = getImageProfile(fix.result.profile);
              report = await inspectImageBuffer(processedBuffer, {
                profile: fixProfile,
                marketplace,
                maxBytes: config.images.maxUploadBytes,
              });
            } catch (error) {
              logger.warn("image.inspect_failed", { requestId, err: error });
            }
          }
        }

        const summary = locale === "tr" ? report.summaryTr : report.summaryEn;
        const detailLabel = locale === "tr" ? "Detay" : "Details";
        const detailChecks = [...report.failChecks, ...report.warningChecks].slice(0, 2);
        const detailList = detailChecks
          .map((check) => check.detailTr ?? check.detail ?? check.label ?? check.id)
          .filter(Boolean);
        const remaining = Math.max(0, report.issues.length - detailChecks.length);
        const moreLabel = remaining ? (locale === "tr" ? `+${remaining} daha` : `+${remaining} more`) : "";
        const detailSuffix = detailList.length
          ? ` ${detailLabel}: ${detailList.join(" | ")}${moreLabel ? ` (${moreLabel})` : ""}.`
          : "";
        const detailHint = detailSuffix;

        let action = null;
        let actionHint = "";
        let confirmPrompt = "";
        let confirmAction = null;

        if (barcode && report.issues.length && !autoFixResult) {
          action = {
            type: "image.reprocess",
            endpoint: "/images/reprocess",
            method: "POST",
            payload: { barcode, marketplace, profile: profileHint },
          };
          if (locale === "tr") {
            actionHint = ` Tek tuş: /images/reprocess?barcode=${barcode}&profile=${profileHint}`;
          } else {
            actionHint = ` One-click: /images/reprocess?barcode=${barcode}&profile=${profileHint}`;
          }
          if (!autoFixRequested) {
            const confirmText =
              locale === "tr"
                ? `onayla barkod: ${barcode} profil: ${profileHint}`
                : `approve barcode: ${barcode} profile: ${profileHint}`;
            confirmPrompt = ` ${t(locale, "image_inspect_confirm_fix", { barcode, profile: profileHint })}`;
            confirmAction = { type: "image.reprocess.confirm", message: confirmText };
          }
        }

        const activeProfileSet = report.issues.length ? profileSet : null;
        if (activeProfileSet && !report.profile && activeProfileSet.defaultProfile) {
          report.profile = activeProfileSet.defaultProfile;
        }
        let setHint = "";
        if (activeProfileSet) {
          const label = locale === "tr" ? "Profil seti" : "Profile set";
          const defaultLabel = locale === "tr" ? "varsayılan" : "default";
          const noteLabel = locale === "tr" ? "Not" : "Note";
          const list = activeProfileSet.profiles
            .slice(0, 3)
            .map((name) =>
              activeProfileSet.defaultProfile && name === activeProfileSet.defaultProfile
                ? `${name} (${defaultLabel})`
                : name,
            );
          const extra =
            activeProfileSet.profiles.length > list.length ? ` +${activeProfileSet.profiles.length - list.length}` : "";
          const note = activeProfileSet.note ? ` ${noteLabel}: ${activeProfileSet.note}.` : "";
          setHint = ` ${label}: ${list.join(", ")}${extra}.${note}`;
        }

        const autoFixHint = autoFixResult
          ? locale === "tr"
            ? ` Otomatik düzeltme: ${autoFixResult.processedUrl}`
            : ` Auto-fix: ${autoFixResult.processedUrl}`
          : "";

        const inspectImageId = autoFixResult?.imageId ?? bufferImageId ?? null;
        await insertImageInspectReport({
          imageId: inspectImageId,
          barcode: barcode ?? null,
          marketplace,
          profile: report.profile ?? profileHint,
          source: bufferSource,
          report,
          requestId,
        });

        return {
          reply: `${summary}${detailHint}${autoFixHint}${actionHint}${confirmPrompt}${setHint}`,
          data: {
            report,
            action,
            confirm: confirmAction,
            profileSet: activeProfileSet,
            source: bufferSource,
            autoFix: autoFixResult,
          },
          success: true,
          logBarcode: barcode,
          logResponse: JSON.stringify({ reply: summary, report, autoFix: autoFixResult, confirm: confirmAction }),
        };
      } catch (error) {
        logger.error("image.inspect_failed", { requestId, err: error });
        return { reply: t(locale, "image_inspect_failed"), success: false };
      }
    }
    return { reply: t(locale, "image_inspect_info"), success: false };
  } else if (parsed.intent === "image.search" || parsed.intent === "visual.search") {
    const file = context.body?.file;
    if (!file || !file.buffer) {
      return { reply: t(locale, "image_upload_required"), success: false };
    }

    try {
      // 1. Analyze image to identify product
      const identificationPrompt = locale === 'tr'
        ? "Bu görseldeki ürünü tanımla. Sadece marka ve model adını kısa bir arama terimi olarak ver (örn: Apple iPhone 15 Pro Max)."
        : "Identify the product in this image. Provide only the brand and model name as a short search term (e.g., Apple iPhone 15 Pro Max).";

      const searchTerm = await analyzeImage({
        buffer: file.buffer,
        mimeType: file.mimetype,
        prompt: identificationPrompt,
        locale
      });

      if (!searchTerm || searchTerm.length < 3) {
        return {
          reply: locale === 'tr'
            ? "Görseldeki ürünü ne yazık ki tanımlayamadım."
            : "Sorry, I couldn't identify the product in the image.",
          success: false
        };
      }

      logger.info("image_search.identified", { searchTerm });

      // 2. Perform Smart Optimized Search
      const { runOptimizedSearch } = await import("../../services/searchService.js");
      const { setContext } = await import("../../services/chatSessionService.js");
      const bestResult = await runOptimizedSearch(searchTerm);

      if (!bestResult) {
        return {
          reply: locale === 'tr'
            ? `Görselde "${searchTerm}" ürününü tespit ettim ancak uygun bir ilan bulamadım.`
            : `I identified the product as "${searchTerm}", but couldn't find a matching offer.`,
          success: false
        };
      }

      // 3. Format result
      const priceLabel = bestResult.price ? `${bestResult.price.toFixed(2)} ${bestResult.priceText?.split(' ')[1] || 'TL'}` : "Fiyat yok";
      const siteName = bestResult.site ? bestResult.site.charAt(0).toUpperCase() + bestResult.site.slice(1) : "Bilinmiyor";

      let reply = locale === "tr"
        ? `🔍 Görseldeki ürünü **"${searchTerm}"** olarak tanımladım. İşte en iyi sonuç:\n\n`
        : `🔍 Identified the product as **"${searchTerm}"**. Here is the best match:\n\n`;

      reply += `**${bestResult.title}**\n🏪 ${siteName} | 💰 ${priceLabel}\n🔗 [Ürüne Git](${bestResult.url})`;

      if (bestResult.score < 70) {
        reply += locale === "tr"
          ? "\n\n*Not: Bu sonuç görseldeki ürünle tam eşleşmeyebilir.*"
          : "\n\n*Note: This result may not be an exact match for the image.*";
      }

      // Save context for "add this product" command
      setContext(context.userId || "anon", "last_search_result", bestResult);

      // Add "Import" hint for the user
      if (locale === "tr") {
        reply += `\n\n⬇️ **Bu ürünü içeri aktarmak için:**\n"Bu ürünü ekle" yazabilirsin.`;
      } else {
        reply += `\n\n⬇️ **To import this product:**\nType "Add this product".`;
      }

      return {
        reply,
        data: {
          type: "image_search_results",
          searchTerm,
          result: bestResult
        },
        success: true,
      };

    } catch (error) {
      logger.error("image_search.failed", { requestId, error });
      return {
        reply: locale === "tr"
          ? "Görsel analizi ve arama sırasında bir hata oluştu."
          : "An error occurred during image analysis and search.",
        success: false
      };
    }
  }

  return { reply: t(locale, "unknown_intent"), success: false };
};
