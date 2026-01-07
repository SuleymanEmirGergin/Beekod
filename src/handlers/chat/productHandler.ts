import { t, formatCurrency } from "../../i18n.js";
import {
  getProductByBarcode,
  searchProductsByName,
  upsertProduct,
  updateStock,
  updatePrice,
  getAllProducts,
} from "../../services/productService.js";
import { handleStockAlert } from "../../services/stockAlertService.js";
import { getConfiguredMarketplaces } from "../../services/syncService.js";
import { setPendingSync } from "../../services/sessionService.js";
import { batchUpdatePrice, batchUpdateStock } from "../../services/batchUpdateService.js";
import { resolveProductByName } from "../../services/productResolutionService.js";
import { getMarketplaceListings } from "../../services/marketplaceStore.js";
// import { SearchHit } from "../../marketplaces/index.js";
import { truncateText } from "../../utils/searchContext.js";
import { logger } from "../../logger.js";
import { IntentHandler } from "./types.js";

export const productHandler: IntentHandler = async (parsed, context) => {
  const { locale, requestId } = context;

  if (parsed.intent === "product.info") {
    const barcode = parsed.barcode;
    const productName = parsed.productName ?? parsed.text;
    let product = null;

    if (barcode) {
      try {
        product = await getProductByBarcode(barcode);
      } catch (err) {
        logger.error("chat.product_lookup_failed", { barcode, err });
      }
    } else if (productName) {
      // Direct web search logic REMOVED.
      // Falls through to inventory search.

      // No web signal - try inventory search with STRICT name matching
      try {
        const results = await searchProductsByName(productName, 5);
        // Only accept if name is a close match - prevent random product fallback
        const exactMatch = results.find((p: any) =>
          p.name.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
        );
        product = exactMatch ?? null;
      } catch (err) {
        logger.error("chat.product_search_failed", { productName, err });
      }
    }

    if (!product) {
      // Web search fallback REMOVED.
      return {
        reply: locale === "tr"
          ? `Mağaza kataloğunda "${productName}" ile eşleşen ürün bulamadım. Ürün adını netleştirir misin?`
          : `No matching product found for "${productName}" in catalog. Could you clarify the product name?`,
        success: false
      };
    } else {
      const price = formatCurrency(product.price, product.currency);
      return {
        reply: t(locale, "product_info_format", {
          name: product.name,
          barcode: product.barcode,
          price: price,
          stock: product.stock,
          category: product.category || "-",
        }),
        data: product,
        success: true,
        logBarcode: product.barcode,
      };
    }
  }

  if (parsed.intent === "product.add") {
    const barcode = parsed.barcode?.toLowerCase();
    const nameCandidate = parsed.title ?? parsed.productName ?? parsed.text;
    const priceValue = Number(parsed.price);
    const stockValue = Number(parsed.stock);
    const currency = parsed.currency ?? "TRY";

    // Eksik alanları tespit et ve kullanıcıya bildir
    const missingFields: string[] = [];
    if (!barcode) missingFields.push(locale === "tr" ? "barkod" : "barcode");
    if (!nameCandidate) missingFields.push(locale === "tr" ? "ürün adı" : "product name");
    if (!Number.isFinite(priceValue)) missingFields.push(locale === "tr" ? "fiyat" : "price");
    if (!Number.isFinite(stockValue)) missingFields.push(locale === "tr" ? "stok" : "stock");

    if (missingFields.length > 0) {
      const missing = missingFields.join(", ");
      return {
        reply: locale === "tr"
          ? `Eksik bilgi: ${missing}. Lütfen belirtin.`
          : `Missing information: ${missing}. Please specify.`,
        success: false
      };
    }

    const saved = await upsertProduct({
      barcode: barcode!,
      name: nameCandidate!,
      price: priceValue,
      stock: Math.trunc(stockValue),
      currency,
    });

    return {
      reply: locale === "tr"
        ? `✅ Ürün başarıyla eklendi:\n**${nameCandidate}**\nBarkod: ${barcode}\nFiyat: ${priceValue} ${currency}\nStok: ${stockValue}`
        : `✅ Product successfully added:\n**${nameCandidate}**\nBarcode: ${barcode}\nPrice: ${priceValue} ${currency}\nStock: ${stockValue}`,
      data: { product: saved },
      success: true,
      logBarcode: barcode,
    };
  }

  if (parsed.intent === "batch.price.update" || parsed.intent === "batch.stock.update") {
    const percent = parsed.percent;
    const amount = parsed.amount;
    const category = parsed.category;

    if (!percent && !amount) {
      const missingKey =
        parsed.intent === "batch.price.update" ? "batch_price_missing_amount" : "batch_stock_missing_amount";
      return { reply: t(locale, missingKey), success: false };
    }

    try {
      const isPrice = parsed.intent === "batch.price.update";
      const result = await (isPrice
        ? batchUpdatePrice({ percent, amount, category })
        : batchUpdateStock({ percent, amount, category }));
      const scopeLabel = category ? `"${category}"` : locale === "tr" ? "tüm ürünler" : "all products";
      const doneKey = isPrice ? "batch_price_complete" : "batch_stock_complete";

      let reply = t(locale, doneKey, {
        scope: scopeLabel,
        updated: result.updated,
        failed: result.failed,
      });

      if (result.errors.length > 0 && result.errors.length <= 5) {
        const errorList = result.errors.map((e: any) => `${e.barcode}: ${e.error}`).join("\n");
        reply += t(locale, "batch_errors", { list: errorList });
      }
      return { reply, data: result, success: true };
    } catch (error) {
      logger.error(`chat.${parsed.intent}_failed`, { requestId, err: error });
      const failKey = parsed.intent === "batch.price.update" ? "batch_price_failed" : "batch_stock_failed";
      return { reply: t(locale, failKey), success: false };
    }
  }

  if (parsed.intent === "stock.alert.list") {
    try {
      const threshold = typeof parsed.amount === "number" ? parsed.amount : 10;
      const allProducts = await getAllProducts();
      const lowStock = allProducts.filter((p) => p.stock < threshold).sort((a, b) => a.stock - b.stock);

      if (lowStock.length === 0) {
        return {
          reply:
            locale === "tr" ? `${threshold} altı stoklu ürün yok! 🎉` : `No products with stock below ${threshold}! 🎉`,
          success: true,
        };
      } else {
        const list = lowStock
          .slice(0, 10)
          .map((p, i) => `${i + 1}. **${p.name}** (${p.barcode}) - Stok: ${p.stock}`)
          .join("\n");

        return {
          reply:
            locale === "tr"
              ? `**⚠️ Düşük Stoklu Ürünler (Eşik: ${threshold}, Toplam: ${lowStock.length}):**\n\n${list}${lowStock.length > 10 ? `\n\n...ve ${lowStock.length - 10} ürün daha` : ""}`
              : `**⚠️ Low Stock Products (Threshold: ${threshold}, Total: ${lowStock.length}):**\n\n${list}${lowStock.length > 10 ? `\n\n...and ${lowStock.length - 10} more` : ""}`,
          data: { lowStockProducts: lowStock.slice(0, 10), total: lowStock.length, threshold },
          success: true,
        };
      }
    } catch (error) {
      logger.error("chat.stock_alert_list_failed", { requestId, err: error });
      return { reply: locale === "tr" ? "Stok uyarıları alınamadı." : "Failed to fetch stock alerts.", success: false };
    }
  }

  if (parsed.intent === "competitor.list") {
    let barcode = parsed.barcode;
    if (!barcode) {
      const nameCandidate = (parsed.productName ?? parsed.text)?.trim();
      if (nameCandidate) {
        const resolution = await resolveProductByName(nameCandidate);
        if (resolution.notFound) {
          return { reply: t(locale, "product_name_not_found"), success: false };
        } else if (resolution.ambiguous) {
          const list = resolution.ambiguous.map((item) => `${item.name} (${item.barcode})`).join(", ");
          return { reply: t(locale, "product_ambiguous", { list }), success: false };
        } else if (resolution.product) {
          barcode = resolution.product.barcode;
        }
      }
    }

    if (barcode) {
      const items = await getMarketplaceListings(barcode);
      if (!items.length) {
        return { reply: t(locale, "competitor_empty"), success: false };
      } else {
        const list = items
          .map((item) => `${item.marketplace}: ${formatCurrency(item.price, item.currency)}`)
          .join(", ");
        const averageRaw = items.reduce((sum, item) => sum + item.price, 0) / items.length;
        const average = formatCurrency(averageRaw, items[0].currency);
        return {
          reply: t(locale, "competitor_list", { list, average }),
          data: { items, average },
          success: true,
          logBarcode: barcode,
        };
      }
    }
  }

  // Base price/stock update logic
  let barcode = parsed.barcode;
  let product = barcode ? await getProductByBarcode(barcode) : null;

  if (!product) {
    const nameCandidate = (parsed.productName ?? parsed.text)?.trim();
    if (nameCandidate) {
      const resolution = await resolveProductByName(nameCandidate);
      if (resolution.product) {
        product = resolution.product;
        barcode = product.barcode;
      } else if (resolution.ambiguous) {
        const list = resolution.ambiguous.map((item) => `${item.name} (${item.barcode})`).join(", ");
        return { reply: t(locale, "product_ambiguous", { list }), success: false };
      } else if (resolution.notFound) {
        return { reply: t(locale, "not_found"), success: false };
      }
    }
  }

  if (!product) {
    return { reply: t(locale, "not_found"), success: false };
  }

  const isPriceUpdate = parsed.intent.startsWith("price.");
  const isStockUpdate = parsed.intent.startsWith("stock.");

  if (!isPriceUpdate && !isStockUpdate) {
    return { reply: t(locale, "unknown_intent"), success: false };
  }

  if ((parsed.intent === "price.set" || parsed.intent === "stock.set") && parsed.percent != null) {
    return { reply: t(locale, "percent_not_allowed"), success: false };
  }

  const amount = parsed.amount == null ? 0 : Math.abs(parsed.amount);
  const percent = parsed.percent == null ? null : Math.abs(parsed.percent);
  const priceValue = Number(product.price);
  const stockValue = Number(product.stock);

  if (isStockUpdate) {
    let newStock = stockValue;
    if (parsed.intent === "stock.set") {
      newStock = Math.max(0, Math.round(amount));
    } else {
      const delta = percent != null ? Math.round((stockValue * percent) / 100) : Math.round(amount);
      newStock = parsed.intent === "stock.increase" ? stockValue + delta : Math.max(0, stockValue - delta);
    }
    const updated = await updateStock(barcode as string, newStock);
    if (updated) {
      const productForAlert = await getProductByBarcode(barcode as string);
      if (productForAlert) {
        try {
          await handleStockAlert(productForAlert, `chat.${parsed.intent}`);
        } catch (error) {
          logger.warn("chat.stock_alert_failed", { requestId, err: error });
        }
      }
    }
    return {
      reply: t(locale, "stock_updated", { stock: newStock }),
      data: updated,
      success: true,
      logBarcode: barcode,
    };
  } else {
    let newPrice = amount;
    if (parsed.intent === "price.increase") {
      const delta = percent != null ? (priceValue * percent) / 100 : amount;
      newPrice = priceValue + delta;
    } else if (parsed.intent === "price.decrease") {
      const delta = percent != null ? (priceValue * percent) / 100 : amount;
      newPrice = priceValue - delta;
    }

    if (newPrice < 0) {
      return { reply: t(locale, "negative_price"), success: false };
    } else {
      const updated = await updatePrice(barcode as string, newPrice);
      let reply = t(locale, "price_updated", { price: formatCurrency(newPrice, product.currency) });

      const configured = getConfiguredMarketplaces();
      if (configured.length > 0) {
        if (requestId) {
          setPendingSync(requestId, {
            barcode: barcode as string,
            price: newPrice,
            stock: stockValue,
          });
        }
        const marketplaceList = configured.join(", ");
        const followUp =
          locale === "tr"
            ? `\n\n📦 **Pazaryeri Senkronizasyonu:**\nŞu anda ${configured.length} pazaryeri yapılandırılmış: ${marketplaceList}\n\nBu fiyatı diğer pazaryerlerde de güncellemek ister misiniz? (Evet/Hayır)`
            : `\n\n📦 **Marketplace Sync:**\n${configured.length} marketplaces are configured: ${marketplaceList}\n\nWould you like to update this price on all marketplaces? (Yes/No)`;
        reply += followUp;
      }

      return {
        reply,
        data: updated,
        success: true,
        logBarcode: barcode,
      };
    }
  }
};
