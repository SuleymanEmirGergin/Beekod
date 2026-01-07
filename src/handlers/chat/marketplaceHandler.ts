import { t, formatCurrency } from "../../i18n.js";
import {
  getMarketplaceListing,
  getMarketplaceListings,
  reconcileMarketplaceListing,
  upsertMarketplaceListing,
  upsertMarketplaceListings,
} from "../../services/marketplaceStore.js";
import { getProductByBarcode } from "../../services/productService.js";
import { getMarketplaceProvider, listMarketplaceProviders } from "../../marketplaces/index.js";
import { logMarketplaceEvent } from "../../marketplaces/logger.js";
import { normalizeMarketplaceName } from "../../utils/marketplace.js";
import { config } from "../../config.js";
import { logger } from "../../logger.js";
import { enqueueLiveUpdateRetry } from "../../services/jobQueue.js";
import { generateGeminiReply } from "../../services/geminiService.js";
import { resolveProductByName } from "../../services/productResolutionService.js";
import { IntentHandler } from "./types.js";
import { ParsedMessage } from "../../services/nlp.js";
// Cache import removed

const applyDelta = (base: number, isIncrease: boolean, amount: number, isStock: boolean) => {
  const delta = amount;
  const next = isIncrease ? base + delta : base - delta;
  if (isStock) {
    return Math.max(0, Math.round(next));
  }
  return Math.max(0, next);
};

const applyPercent = (base: number, percentValue: number, isIncrease: boolean, isStock: boolean) => {
  const delta = (base * percentValue) / 100;
  return applyDelta(base, isIncrease, delta, isStock);
};

const appendTargets = (reply: string, targets: string[], locale: string) => {
  if (!targets.length) return reply;
  const label = locale === "tr" ? "Hedef pazaryerleri" : "Target marketplaces";
  return `${reply}\n\n${label}: ${targets.join(", ")}`;
};

const buildFallbackBarcode = (name: string) => {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "item";
  const withDigits = /\d/.test(base) ? base : `${base}-001`;
  return `ai-${withDigits}`;
};

const applyMarketplaceAddFallbacks = (parsed: any, nameHint: string) => {
  // config.marketplace.addDefaults does not exist, using hardcoded defaults
  const defaults = { price: 100, stock: 10, currency: "TRY" };
  if (!parsed.title && nameHint) parsed.title = nameHint;
  if (!parsed.barcode) parsed.barcode = buildFallbackBarcode(nameHint || "product");
  if (!Number.isFinite(parsed.price)) parsed.price = defaults.price;
  if (!Number.isFinite(parsed.stock)) parsed.stock = defaults.stock;
  if (!parsed.currency) parsed.currency = defaults.currency;
};

const tryParseJsonBlock = (raw: string) => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

export const marketplaceHandler: IntentHandler = async (parsed, context) => {
  const { locale, requestId } = context;

  if (parsed.intent === "marketplace.configured.list") {
    const cacheKey = `mp:configured:${locale}`;
    // const cached = cache.get<any>(cacheKey);
    // if (cached) return cached;

    const providers = listMarketplaceProviders();
    const configured = providers.filter((provider) => provider.configured);
    if (!configured.length) {
      return { reply: t(locale, "marketplace_configured_empty"), success: false };
    }
    const list = configured.map((provider) => provider.name).join(", ");
    const result = {
      reply: t(locale, "marketplace_configured_list", { count: configured.length, list }),
      data: {
        marketplaces: configured.map((p) => ({
          name: p.name,
          status: "active", // Since it's in configured list
          configured: true,
        })),
      },
      success: true,
    };
    return result;
  }

  if (parsed.intent === "marketplace.batch.result") {
    const marketplace = parsed.marketplace;
    const batchRequestId = parsed.batchRequestId;

    if (!marketplace) return { reply: t(locale, "missing_marketplace"), success: false };
    if (!batchRequestId) return { reply: t(locale, "missing_batch_request_id"), success: false };

    try {
      const provider = getMarketplaceProvider(marketplace);
      if (!provider) {
        return {
          reply: t(locale, "marketplace_live_mode_not_supported", { marketplace: marketplace }),
          success: false,
        };
      }

      if (!provider.getBatchRequestResult) {
        return {
          reply: t(locale, "marketplace_batch_not_supported", { marketplace }),
          success: false,
        };
      }

      const result = await provider.getBatchRequestResult(batchRequestId);
      return {
        reply: t(locale, "marketplace_batch_request_ready", {
          marketplace,
          summary: (result as any).summary || result.message,
        }),
        data: result,
        success: true,
      };
    } catch (error: any) {
      logger.error("chat.marketplace.batch_failed", { requestId, err: error });
      return {
        reply: t(locale, "marketplace_batch_request_failed", {
          marketplace,
          reason: error.message,
        }),
        success: false,
      };
    }
  }

  // Marketplace listing/sync/status/etc
  const marketplaceRaw = parsed.marketplace;
  const marketplace = marketplaceRaw ? normalizeMarketplaceName(marketplaceRaw) : undefined;
  const barcode = parsed.barcode;
  const isScopeAll = !parsed.barcode || parsed.barcode === "ALL";
  const statusFilter = parsed.status;
  const marketplaceLabel = marketplace ?? (locale === "tr" ? "Tüm Pazaryerleri" : "All Marketplaces");

  const wantsMarketplaceAdd = parsed.intent === "marketplace.add";
  const wantsMarketplaceSync = parsed.intent === "marketplace.sync";
  const wantsMarketplaceActivate = parsed.intent === "marketplace.activate";
  const wantsMarketplaceDeactivate = parsed.intent === "marketplace.deactivate";
  const wantsMarketplacePriceSet = parsed.intent === "marketplace.price.set";
  const wantsMarketplaceStockSet = parsed.intent === "marketplace.stock.set";
  const wantsMarketplaceList = parsed.intent === "marketplace.list";
  const wantsMarketplaceBulk = parsed.intent === "marketplace.bulk";

  // Shared variables
  let product = barcode ? await getProductByBarcode(barcode) : null;
  let success = true;
  let reply = "";
  let data: any = null;
  let handledLiveMarketplace = false;
  let logBarcode = barcode;

  if (wantsMarketplaceAdd) {
    if (!parsed.marketplace) parsed.marketplace = "ALL";
    const nameHint = parsed.title ?? parsed.productName ?? parsed.text ?? "";

    if ((!parsed.barcode || !Number.isFinite(parsed.price) || !Number.isFinite(parsed.stock)) && nameHint) {
      const resolution = await resolveProductByName(nameHint);
      if (resolution.product) {
        parsed.barcode = parsed.barcode ?? resolution.product.barcode;
        parsed.price = Number.isFinite(parsed.price) ? parsed.price : resolution.product.price;
        parsed.stock = Number.isFinite(parsed.stock) ? parsed.stock : resolution.product.stock;
        parsed.currency = parsed.currency ?? resolution.product.currency;
        parsed.title = parsed.title ?? resolution.product.name;
        product = product ?? resolution.product;
      }
    }

    if (!parsed.barcode || !Number.isFinite(parsed.price) || !Number.isFinite(parsed.stock)) {
      const prompt = [
        "Extract marketplace product fields from the user request.",
        "Return JSON only with keys: barcode, price, stock, currency, name.",
        "If missing, synthesize values:",
        "- barcode: lowercase slug of name + '-001'",
        "- price: 99999",
        "- stock: 10",
        "- currency: TRY",
        "",
        `User: ${context.message}`,
      ].join("\n");
      const aiReply = await generateGeminiReply({ message: prompt, locale });
      if (aiReply) {
        const parsedJson = tryParseJsonBlock(aiReply);
        if (parsedJson && typeof parsedJson === "object") {
          const aiBarcode = typeof parsedJson.barcode === "string" ? parsedJson.barcode.trim().toLowerCase() : "";
          const aiName = typeof parsedJson.name === "string" ? parsedJson.name.trim() : "";
          const aiCurrency = typeof parsedJson.currency === "string" ? parsedJson.currency.trim().toUpperCase() : "";
          const aiPrice = Number(parsedJson.price);
          const aiStock = Number(parsedJson.stock);

          if (aiBarcode) parsed.barcode = parsed.barcode ?? aiBarcode;
          if (aiName) parsed.title = parsed.title ?? aiName;
          if (Number.isFinite(aiPrice)) parsed.price = Number.isFinite(parsed.price) ? parsed.price : aiPrice;
          if (Number.isFinite(aiStock)) parsed.stock = Number.isFinite(parsed.stock) ? parsed.stock : aiStock;
          if (aiCurrency) parsed.currency = parsed.currency ?? aiCurrency;
        }
      }
    }

    applyMarketplaceAddFallbacks(parsed, nameHint);
  }

  if (wantsMarketplaceAdd && parsed.marketplace === "ALL" && config.marketplace.mode === "live") {
    const providers = listMarketplaceProviders().filter((provider) => provider.configured);
    if (!providers.length) {
      return { reply: t(locale, "marketplace_configured_empty"), success: false };
    }

    const promises = providers.map(async (provider) => {
      const providerInstance = getMarketplaceProvider(provider.name);
      if (!providerInstance) {
        return { marketplace: provider.name, status: "failed", message: "provider_not_found" };
      }
      try {
        const result = await providerInstance.upsertProduct({
          barcode: parsed.barcode ?? "",
          name: parsed.title ?? parsed.barcode ?? "",
          price: Number(parsed.price) ?? 0,
          stock: Number(parsed.stock) ?? 0,
          currency: parsed.currency ?? "TRY",
        });
        if (result.status === "ok") {
          logMarketplaceEvent({
            provider: provider.name,
            action: "add_listing",
            status: "ok",
            message: result.message,
            barcode: parsed.barcode ?? "",
          });
        }
        return { marketplace: provider.name, ...result };
      } catch (error: any) {
        return { marketplace: provider.name, status: "failed", message: error?.message || "failed" };
      }
    });

    const results = await Promise.all(promises);
    const ok = results.filter((r) => r.status === "ok").length;
    const failed = results.length - ok;

    return {
      reply: t(locale, "marketplace_live_mode_all_summary", { ok, failed }),
      data: { items: results },
      success: ok > 0,
      logBarcode: parsed.barcode,
    };
  }

  if (config.marketplace.mode === "live" && !wantsMarketplaceList) {
    if (isScopeAll && !wantsMarketplaceBulk) {
      reply = t(locale, "marketplace_live_mode_all_not_supported");
      success = false;
    } else if (marketplace) {
      const provider = getMarketplaceProvider(marketplace);
      if (!provider) {
        reply = t(locale, "marketplace_live_mode_not_supported", { marketplace: marketplaceLabel });
        success = false;
      } else {
        const providerStatus = provider.getConfigStatus();
        if (!providerStatus.configured) {
          reply = t(locale, "marketplace_live_mode_not_configured", {
            marketplace: marketplaceLabel,
            missing: providerStatus.missing?.join(", ") ?? "",
          });
          success = false;
        } else {
          // Live execution
          const action = wantsMarketplaceAdd
            ? "add"
            : wantsMarketplaceSync
              ? "sync"
              : wantsMarketplaceActivate
                ? "activate"
                : wantsMarketplaceDeactivate
                  ? "deactivate"
                  : wantsMarketplacePriceSet
                    ? "price"
                    : wantsMarketplaceStockSet
                      ? "stock"
                      : null;
          const actionLabel = action ?? "";

          if (action) {
            const persistTitle = parsed.title ?? product?.name ?? barcode ?? "";
            const persistPrice = (parsed.price ?? parsed.amount ?? product?.price) as number;
            const persistStock = (parsed.stock ?? parsed.amount ?? product?.stock) as number;
            const persistCurrency = parsed.currency ?? product?.currency ?? "TRY";
            const persistActive = wantsMarketplaceActivate ? true : wantsMarketplaceDeactivate ? false : true;

            let result: any = null;
            if (wantsMarketplaceAdd) {
              result = await provider.upsertProduct({
                barcode: barcode as string,
                name: persistTitle,
                price: persistPrice,
                stock: Math.trunc(persistStock),
                currency: persistCurrency,
              });
            } else if (wantsMarketplaceSync) {
              result = await provider.updateListing({
                barcode: barcode as string,
                price: persistPrice,
                stock: Math.trunc(persistStock),
              });
            } else if (wantsMarketplaceActivate || wantsMarketplaceDeactivate) {
              result = await provider.updateListing({
                barcode: barcode as string,
                active: persistActive,
              });
            } else if (wantsMarketplacePriceSet) {
              result = await provider.updateListing({
                barcode: barcode as string,
                price: persistPrice,
              });
            } else if (wantsMarketplaceStockSet) {
              result = await provider.updateListing({
                barcode: barcode as string,
                stock: Math.trunc(persistStock),
              });
            }

            if (result) {
              handledLiveMarketplace = true;
              if (result.status === "ok") {
                await reconcileMarketplaceListing({
                  marketplace,
                  barcode: barcode as string,
                  title: persistTitle,
                  price: persistPrice,
                  stock: persistStock,
                  currency: persistCurrency,
                  active: persistActive,
                  product,
                });
                logBarcode = barcode;
                if (wantsMarketplaceAdd) {
                  reply = t(locale, "marketplace_listing_saved", {
                    marketplace: marketplaceLabel,
                    barcode: barcode ?? "",
                  });
                } else if (wantsMarketplaceSync) {
                  reply = t(locale, "marketplace_sync_done", { marketplace: marketplaceLabel, barcode: barcode ?? "" });
                } else if (wantsMarketplaceActivate || wantsMarketplaceDeactivate) {
                  const statusLabel = wantsMarketplaceActivate
                    ? locale === "tr"
                      ? "aktif"
                      : "active"
                    : locale === "tr"
                      ? "pasif"
                      : "inactive";
                  reply = t(locale, "marketplace_status_updated", {
                    marketplace: marketplaceLabel,
                    scope: barcode ?? "",
                    status: statusLabel,
                  });
                } else if (wantsMarketplacePriceSet) {
                  reply = t(locale, "marketplace_price_updated", {
                    marketplace: marketplaceLabel,
                    barcode: barcode ?? "",
                  });
                } else if (wantsMarketplaceStockSet) {
                  reply = t(locale, "marketplace_stock_updated", {
                    marketplace: marketplaceLabel,
                    barcode: barcode ?? "",
                  });
                }
                data = result;
              } else if (result.status === "queued") {
                reply = t(locale, "marketplace_live_mode_request_queued", {
                  marketplace: marketplaceLabel,
                  action: actionLabel,
                });
                data = result;
              } else {
                if (config.marketplace.liveRetryEnabled) {
                  await enqueueLiveUpdateRetry({
                    marketplace,
                    action,
                    barcode: barcode as string,
                    name: persistTitle,
                    price: persistPrice,
                    stock: persistStock,
                    currency: persistCurrency,
                  });
                }
                reply = t(locale, "marketplace_live_mode_request_failed", {
                  marketplace: marketplaceLabel,
                  reason: result.message,
                });
                success = false;
              }
            }
          }
        }
      }
    }
  }

  if (success && wantsMarketplaceAdd && parsed.marketplace === "ALL" && config.marketplace.mode !== "live") {
    let providers = listMarketplaceProviders().filter((provider) => provider.configured);
    if (!providers.length) {
      providers = listMarketplaceProviders();
    }

    if (!providers.length) {
      return { reply: t(locale, "marketplace_configured_empty"), success: false };
    }

    const listings = providers.map((provider) => ({
      marketplace: provider.name,
      barcode: parsed.barcode ?? "",
      title: parsed.title ?? parsed.barcode ?? "",
      price: Number(parsed.price) ?? 0,
      stock: Number(parsed.stock) ?? 0,
      currency: parsed.currency ?? "TRY",
      active: true,
    }));
    await upsertMarketplaceListings(listings);
    const providerList = providers.map((provider) => provider.name).join(", ");
    reply =
      locale === "tr"
        ? `Pazaryerlerine liste eklendi: ${providerList}.`
        : `Listings added to marketplaces: ${providerList}.`;

    return { reply, data: listings, success: true, logBarcode: parsed.barcode };
  }

  if (success && !handledLiveMarketplace && wantsMarketplaceList) {
    const allListings = await getMarketplaceListings();
    const scopedListings = allListings.filter((listing) => {
      if (!isScopeAll && marketplace) {
        return listing.marketplace.toLowerCase() === marketplace.toLowerCase();
      }
      return true;
    });
    const filteredListings = statusFilter
      ? scopedListings.filter((listing) => (statusFilter === "active" ? listing.active : !listing.active))
      : scopedListings;

    if (!filteredListings.length) {
      return { reply: t(locale, "marketplace_list_empty", { marketplace: marketplaceLabel }), success: false };
    } else {
      const showMarketplace = isScopeAll || !marketplace;
      const preview = filteredListings
        .slice(0, 8)
        .map((listing, index) => {
          const statusLabel = listing.active
            ? locale === "tr"
              ? "aktif"
              : "active"
            : locale === "tr"
              ? "pasif"
              : "inactive";
          const priceLabel = formatCurrency(listing.price, listing.currency);
          const stockLabel = locale === "tr" ? `stok ${listing.stock}` : `stock ${listing.stock}`;
          const name = listing.title || listing.barcode;
          const marketLabel = showMarketplace ? `${listing.marketplace} - ` : "";
          return `${index + 1}) ${marketLabel}${name} (${listing.barcode}, ${priceLabel}, ${stockLabel}, ${statusLabel})`;
        })
        .join("; ");

      return {
        reply: t(locale, "marketplace_list_summary", {
          marketplace: marketplaceLabel,
          count: filteredListings.length,
          list: preview,
        }),
        data: { count: filteredListings.length, items: filteredListings.slice(0, 20) },
        success: true,
      };
    }
  }

  if (success && !handledLiveMarketplace && !wantsMarketplaceList) {
    const percent = parsed.percent != null ? Math.abs(parsed.percent) : null;
    const rawAmount = parsed.amount != null ? Math.abs(parsed.amount) : null;
    const scopeLabel = wantsMarketplaceBulk ? (locale === "tr" ? "tüm ürünler" : "all products") : (barcode ?? "");
    const statusLabel = wantsMarketplaceDeactivate
      ? locale === "tr"
        ? "pasif"
        : "inactive"
      : locale === "tr"
        ? "aktif"
        : "active";

    if (wantsMarketplaceSync && wantsMarketplaceBulk) {
      return { reply: t(locale, "missing_barcode"), success: false };
    }

    if (success && (wantsMarketplacePriceSet || wantsMarketplaceStockSet)) {
      if (percent != null) {
        return { reply: t(locale, "percent_not_allowed"), success: false };
      }
    }

    if (success && wantsMarketplaceBulk) {
      const allListings = await getMarketplaceListings();
      const scopedListings = isScopeAll
        ? allListings
        : allListings.filter((l) => l.marketplace.toLowerCase() === marketplace?.toLowerCase());

      if (!scopedListings.length) {
        return { reply: t(locale, "marketplace_listings_missing"), success: false };
      } else {
        const updatedListings = scopedListings.map((listing) => {
          let nextPrice = listing.price;
          let nextStock = listing.stock;
          let nextActive = listing.active;

          if (wantsMarketplaceActivate) nextActive = true;
          else if (wantsMarketplaceDeactivate) nextActive = false;

          if (wantsMarketplacePriceSet) nextPrice = Number(parsed.price ?? rawAmount);
          else if (parsed.intent === "marketplace.price.increase" || parsed.intent === "marketplace.price.decrease") {
            const isInc = parsed.intent.includes("increase");
            if (percent != null) nextPrice = applyPercent(listing.price, percent, isInc, false);
            else if (rawAmount != null) nextPrice = applyDelta(listing.price, isInc, rawAmount, false);
          }

          if (wantsMarketplaceStockSet) nextStock = Math.max(0, Math.round(Number(parsed.stock ?? rawAmount)));
          else if (parsed.intent === "marketplace.stock.increase" || parsed.intent === "marketplace.stock.decrease") {
            const isInc = parsed.intent.includes("increase");
            if (percent != null) nextStock = applyPercent(listing.stock, percent, isInc, true);
            else if (rawAmount != null) nextStock = applyDelta(listing.stock, isInc, rawAmount, true);
          }

          return { ...listing, price: nextPrice, stock: nextStock, active: nextActive };
        });

        await upsertMarketplaceListings(updatedListings);
        let finalReply = "";
        if (wantsMarketplaceActivate || wantsMarketplaceDeactivate)
          finalReply = t(locale, "marketplace_status_updated", {
            marketplace: marketplaceLabel,
            scope: scopeLabel,
            status: statusLabel,
          });
        else if (wantsMarketplacePriceSet || parsed.intent.includes("price"))
          finalReply = t(locale, "marketplace_price_updated", { marketplace: marketplaceLabel, barcode: scopeLabel });
        else
          finalReply = t(locale, "marketplace_stock_updated", { marketplace: marketplaceLabel, barcode: scopeLabel });

        return { reply: finalReply, data: updatedListings, success: true, logBarcode: barcode };
      }
    } else if (success && isScopeAll) {
      const existingListings = await getMarketplaceListings(barcode as string);
      if (!existingListings.length) {
        return { reply: t(locale, "marketplace_listings_missing"), success: false };
      } else if (wantsMarketplaceSync) {
        if (!product) return { reply: t(locale, "not_found"), success: false };
        const updatedListings = existingListings.map((l) => ({
          ...l,
          price: product!.price,
          stock: product!.stock,
          currency: product!.currency,
          title: product!.name,
        }));
        await upsertMarketplaceListings(updatedListings);
        return {
          reply: t(locale, "marketplace_sync_done", { marketplace: marketplaceLabel, barcode: barcode ?? "" }),
          data: updatedListings,
          success: true,
          logBarcode: barcode,
        };
      } else {
        const updatedListings = existingListings.map((listing) => {
          const basePrice = listing.price ?? product?.price;
          const baseStock = listing.stock ?? product?.stock;
          let nextPrice = listing.price;
          let nextStock = listing.stock;
          let nextActive = listing.active;

          if (wantsMarketplaceActivate) nextActive = true;
          else if (wantsMarketplaceDeactivate) nextActive = false;

          if (wantsMarketplacePriceSet) nextPrice = Number(parsed.price ?? rawAmount);
          else if (parsed.intent === "marketplace.price.increase" || parsed.intent === "marketplace.price.decrease") {
            if (basePrice != null) {
              const isInc = parsed.intent.includes("increase");
              if (percent != null) nextPrice = applyPercent(basePrice, percent, isInc, false);
              else if (rawAmount != null) nextPrice = applyDelta(basePrice, isInc, rawAmount, false);
            }
          }

          if (wantsMarketplaceStockSet) nextStock = Math.max(0, Math.round(Number(parsed.stock ?? rawAmount)));
          else if (parsed.intent === "marketplace.stock.increase" || parsed.intent === "marketplace.stock.decrease") {
            if (baseStock != null) {
              const isInc = parsed.intent.includes("increase");
              if (percent != null) nextStock = applyPercent(baseStock, percent, isInc, true);
              else if (rawAmount != null) nextStock = applyDelta(baseStock, isInc, rawAmount, true);
            }
          }

          return { ...listing, price: nextPrice, stock: nextStock, active: nextActive };
        });

        await upsertMarketplaceListings(updatedListings);
        let finalReply = "";
        if (wantsMarketplaceActivate || wantsMarketplaceDeactivate)
          finalReply = t(locale, "marketplace_status_updated", {
            marketplace: marketplaceLabel,
            scope: barcode ?? "",
            status: statusLabel,
          });
        else if (wantsMarketplacePriceSet || parsed.intent.includes("price"))
          finalReply = t(locale, "marketplace_price_updated", {
            marketplace: marketplaceLabel,
            barcode: barcode ?? "",
          });
        else
          finalReply = t(locale, "marketplace_stock_updated", {
            marketplace: marketplaceLabel,
            barcode: barcode ?? "",
          });

        return { reply: finalReply, data: updatedListings, success: true, logBarcode: barcode };
      }
    } else if (success) {
      const existing = await getMarketplaceListing(barcode as string, marketplace!);
      if (!existing && wantsMarketplaceDeactivate)
        return { reply: t(locale, "marketplace_listings_missing"), success: false };

      const baseListing =
        existing ??
        (product
          ? {
            marketplace: marketplace!,
            barcode: barcode!,
            price: product.price,
            stock: product.stock,
            currency: product.currency,
            title: product.name,
            active: true,
          }
          : null);

      if (!baseListing) return { reply: t(locale, "marketplace_listings_missing"), success: false };

      if (wantsMarketplaceSync) {
        if (!product) return { reply: t(locale, "not_found"), success: false };
        const listing = {
          ...baseListing,
          price: product.price,
          stock: product.stock,
          currency: product.currency,
          title: product.name,
        };
        await upsertMarketplaceListing(listing);
        return {
          reply: t(locale, "marketplace_sync_done", { marketplace: marketplaceLabel, barcode: barcode ?? "" }),
          data: listing,
          success: true,
          logBarcode: barcode,
        };
      } else {
        let nextPrice = baseListing.price;
        let nextStock = baseListing.stock;
        let nextActive = baseListing.active ?? true;

        if (wantsMarketplaceActivate) nextActive = true;
        else if (wantsMarketplaceDeactivate) nextActive = false;

        if (wantsMarketplacePriceSet) nextPrice = Number(parsed.price ?? rawAmount);
        else if (parsed.intent === "marketplace.price.increase" || parsed.intent === "marketplace.price.decrease") {
          const isInc = parsed.intent.includes("increase");
          if (percent != null) nextPrice = applyPercent(baseListing.price, percent, isInc, false);
          else if (rawAmount != null) nextPrice = applyDelta(baseListing.price, isInc, rawAmount, false);
        }

        if (wantsMarketplaceStockSet) nextStock = Math.max(0, Math.round(Number(parsed.stock ?? rawAmount)));
        else if (parsed.intent === "marketplace.stock.increase" || parsed.intent === "marketplace.stock.decrease") {
          const isInc = parsed.intent.includes("increase");
          if (percent != null) nextStock = applyPercent(baseListing.stock, percent, isInc, true);
          else if (rawAmount != null) nextStock = applyDelta(baseListing.stock, isInc, rawAmount, true);
        }

        const listing = { ...baseListing, price: nextPrice, stock: nextStock, active: nextActive };
        await upsertMarketplaceListing(listing);
        let finalReply = "";
        if (wantsMarketplaceActivate || wantsMarketplaceDeactivate)
          finalReply = t(locale, "marketplace_status_updated", {
            marketplace: marketplaceLabel,
            scope: barcode ?? "",
            status: statusLabel,
          });
        else if (wantsMarketplacePriceSet || parsed.intent.includes("price"))
          finalReply = t(locale, "marketplace_price_updated", {
            marketplace: marketplaceLabel,
            barcode: barcode ?? "",
          });
        else
          finalReply = t(locale, "marketplace_stock_updated", {
            marketplace: marketplaceLabel,
            barcode: barcode ?? "",
          });

        return { reply: finalReply, data: listing, success: true, logBarcode: barcode };
      }
    }
  }

  return { reply, data, success, logBarcode, handledLiveMarketplace };
};
