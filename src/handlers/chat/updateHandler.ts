import { IntentHandler } from "./types.js";
import { extractBarcode } from "../../utils/intent.js";
import { getProductByBarcode, updateProduct } from "../../services/productService.js";
import { syncPriceStock } from "../../services/syncService.js";

/**
 * Direct Update Handler
 * Handles price and stock update commands
 */
export const updateHandler: IntentHandler = async (parsed, context) => {
    const { message, locale, intent } = context;

    // Extract barcode
    const barcode = parsed.barcode || extractBarcode(message);

    if (!barcode) {
        return {
            reply: locale === "tr"
                ? "Kanka hangi ürünü güncelleyeceğiz? Barkod numarasını söyle. 📦"
                : "Which product should I update? Please provide the barcode. 📦",
            success: false,
        };
    }

    try {
        // Get product
        const product = await getProductByBarcode(barcode);
        if (!product) {
            return {
                reply: locale === "tr"
                    ? `${barcode} barkodlu ürünü bulamadım kanka. Önce eklemen gerekiyor. 🤔`
                    : `Could not find product with barcode ${barcode}. You need to add it first. 🤔`,
                success: false,
            };
        }

        const lowerMsg = message.toLowerCase();
        let updateData: any = {};
        let successMsg = "";

        // UPDATE_PRICE intent
        if (intent === "UPDATE_PRICE") {
            // Extract price from message: "fiyatını 500 yap", "500 TL yap"
            const priceMatch = message.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:tl|try|₺|lira)?/i);

            if (!priceMatch) {
                return {
                    reply: locale === "tr"
                        ? "Kanka fiyatı anlayamadım. Örnek: 'Fiyatını 500 TL yap' 💰"
                        : "I couldn't understand the price. Example: 'Set price to 500 TL' 💰",
                    success: false,
                };
            }

            const newPrice = parseFloat(priceMatch[1].replace(",", "."));
            updateData.price = newPrice;

            successMsg = locale === "tr"
                ? `Tamamdır kanka! ✅\n\n**${product.name}**\nEski fiyat: ${product.price} ${product.currency}\nYeni fiyat: **${newPrice} ${product.currency}** 💰\n\nTüm mağazalarda güncellendi! 🚀`
                : `Done buddy! ✅\n\n**${product.name}**\nOld price: ${product.price} ${product.currency}\nNew price: **${newPrice} ${product.currency}** 💰\n\nUpdated across all marketplaces! 🚀`;
        }

        // UPDATE_STOCK intent
        if (intent === "UPDATE_STOCK") {
            // Extract stock from message: "stoğunu 10 yap", "5 adet ekle"
            const stockMatch = message.match(/(\d+)\s*(?:adet|ad)?/i);

            if (!stockMatch) {
                return {
                    reply: locale === "tr"
                        ? "Kanka stok miktarını anlayamadım. Örnek: 'Stoğunu 10 yap' 📦"
                        : "I couldn't understand the stock amount. Example: 'Set stock to 10' 📦",
                    success: false,
                };
            }

            const newStock = parseInt(stockMatch[1]);

            // Check if it's an increment ("artır", "ekle")
            if (lowerMsg.includes("artır") || lowerMsg.includes("ekle") || lowerMsg.includes("+")) {
                updateData.stock = product.stock + newStock;
                successMsg = locale === "tr"
                    ? `Tamamdır kanka! ✅\n\n**${product.name}**\nEski stok: ${product.stock}\nEklenen: +${newStock}\nYeni stok: **${product.stock + newStock}** 📦`
                    : `Done buddy! ✅\n\n**${product.name}**\nOld stock: ${product.stock}\nAdded: +${newStock}\nNew stock: **${product.stock + newStock}** 📦`;
            }
            // Check if it's a decrement ("azalt", "çıkar")
            else if (lowerMsg.includes("azalt") || lowerMsg.includes("çıkar") || lowerMsg.includes("-")) {
                updateData.stock = Math.max(0, product.stock - newStock);
                successMsg = locale === "tr"
                    ? `Tamamdır kanka! ✅\n\n**${product.name}**\nEski stok: ${product.stock}\nÇıkarılan: -${newStock}\nYeni stok: **${Math.max(0, product.stock - newStock)}** 📦`
                    : `Done buddy! ✅\n\n**${product.name}**\nOld stock: ${product.stock}\nRemoved: -${newStock}\nNew stock: **${Math.max(0, product.stock - newStock)}** 📦`;
            }
            // Direct set
            else {
                updateData.stock = newStock;
                successMsg = locale === "tr"
                    ? `Tamamdır kanka! ✅\n\n**${product.name}**\nEski stok: ${product.stock}\nYeni stok: **${newStock}** 📦\n\nTüm mağazalarda güncellendi! 🚀`
                    : `Done buddy! ✅\n\n**${product.name}**\nOld stock: ${product.stock}\nNew stock: **${newStock}** 📦\n\nUpdated across all marketplaces! 🚀`;
            }
        }

        // Update product in database
        await updateProduct(barcode, updateData);

        // Sync to marketplaces
        const syncResult = await syncPriceStock({
            barcode,
            price: updateData.price || product.price,
            stock: updateData.stock !== undefined ? updateData.stock : product.stock,
            targets: ["all"],
        });

        return {
            reply: successMsg,
            success: true,
            data: {
                barcode,
                oldValues: { price: product.price, stock: product.stock },
                newValues: updateData,
                syncResult,
            },
        };
    } catch (error) {
        return {
            reply: locale === "tr"
                ? "Hata oluştu kanka, güncelleme yapamadım. 😞"
                : "An error occurred during the update. 😞",
            success: false,
            data: { error: error instanceof Error ? error.message : "Unknown error" },
        };
    }
};
