import { IntentHandler } from "./types.js";
import { getAllProducts, updateProduct } from "../../services/productService.js";
import { syncPriceStock } from "../../services/syncService.js";

/**
 * Batch Update Handler
 * Handles bulk operations like "Tüm stoğu sıfırla", "Hepsiburada fiyatlarını %10 düşür"
 */
export const batchHandler: IntentHandler = async (parsed, context) => {
    const { message, locale } = context;
    const lowerMsg = message.toLowerCase();

    try {
        // "Tüm stoğu sıfırla"
        if ((lowerMsg.includes("tüm") || lowerMsg.includes("hepsi")) &&
            lowerMsg.includes("stok") &&
            (lowerMsg.includes("sıfır") || lowerMsg.includes("0"))) {

            const products = await getAllProducts();
            let updatedCount = 0;

            for (const product of products) {
                await updateProduct(product.barcode, { stock: 0 });
                updatedCount++;
            }

            return {
                reply: locale === "tr"
                    ? `✅ Tamamdır kanka!\n\n📦 **${updatedCount} ürünün** stoğu sıfırlandı.\n\n⚠️ Tüm mağazalara sync ediliyor...`
                    : `✅ Done buddy!\n\n📦 Stock reset for **${updatedCount} products**.\n\n⚠️ Syncing to all marketplaces...`,
                success: true,
                data: { updatedCount, action: "stock_reset" },
            };
        }

        // "Hepsiburada fiyatlarını %10 düşür" / "Trendyol fiyatlarını %5 artır"
        const percentMatch = lowerMsg.match(/%?\s*(\d+)\s*%?/);
        const marketplace = lowerMsg.includes("hepsiburada") ? "Hepsiburada" :
            lowerMsg.includes("trendyol") ? "Trendyol" : null;


        if (percentMatch && (lowerMsg.includes("fiyat") && (lowerMsg.includes("düşür") || lowerMsg.includes("artır")))) {
            const percent = parseInt(percentMatch[1]);
            const isIncrease = lowerMsg.includes("artır") || lowerMsg.includes("yükselt") || lowerMsg.includes("+");
            const multiplier = isIncrease ? (1 + percent / 100) : (1 - percent / 100);

            const products = await getAllProducts();
            let updatedCount = 0;

            for (const product of products) {
                const newPrice = Math.round(product.price * multiplier * 100) / 100; // 2 decimal places
                await updateProduct(product.barcode, { price: newPrice });

                // Sync to specific marketplace or all
                if (marketplace) {
                    await syncPriceStock({
                        barcode: product.barcode,
                        price: newPrice,
                        stock: product.stock,
                        targets: [marketplace],
                    });
                }

                updatedCount++;
            }

            const action = isIncrease ? "artırıldı" : "düşürüldü";
            const marketplaceText = marketplace ? ` (${marketplace})` : " (tüm mağazalar)";

            return {
                reply: locale === "tr"
                    ? `✅ Tamamdır kanka!\n\n💰 **${updatedCount} ürünün** fiyatı **%${percent}** ${action}${marketplaceText}.\n\n🚀 Güncellemeler tamamlandı!`
                    : `✅ Done buddy!\n\n💰 Prices ${isIncrease ? 'increased' : 'decreased'} by **${percent}%** for **${updatedCount} products**${marketplaceText}.\n\n🚀 Updates completed!`,
                success: true,
                data: { updatedCount, percent, action: isIncrease ? "increase" : "decrease", marketplace },
            };
        }

        // "Tüm ürünleri Trendyol'a ekle"
        if ((lowerMsg.includes("tüm") || lowerMsg.includes("hepsi")) &&
            lowerMsg.includes("ekle") && marketplace) {

            const products = await getAllProducts();
            let syncedCount = 0;

            for (const product of products) {
                await syncPriceStock({
                    barcode: product.barcode,
                    price: product.price,
                    stock: product.stock,
                    targets: [marketplace],
                });
                syncedCount++;
            }

            return {
                reply: locale === "tr"
                    ? `✅ Harika kanka!\n\n📤 **${syncedCount} ürün** ${marketplace}'a ekleniyor.\n\n⏰ İşlem 24 saat içinde tamamlanacak!`
                    : `✅ Great buddy!\n\n📤 **${syncedCount} products** being added to ${marketplace}.\n\n⏰ Process will complete within 24 hours!`,
                success: true,
                data: { syncedCount, marketplace, action: "bulk_add" },
            };
        }

        // Generic batch update
        return {
            reply: locale === "tr"
                ? "Toplu işlem yapmak istediğini anladım ama tam olarak ne yapmamı istiyorsun kanka? 🤔\n\nÖrnekler:\n- 'Tüm stoğu sıfırla'\n- 'Hepsiburada fiyatlarını %10 düşür'\n- 'Tüm ürünleri Trendyol'a ekle'"
                : "I understand you want a batch operation, but what exactly should I do? 🤔\n\nExamples:\n- 'Reset all stock to zero'\n- 'Decrease Hepsiburada prices by 10%'\n- 'Add all products to Trendyol'",
            success: false,
        };
    } catch (error) {
        return {
            reply: locale === "tr"
                ? "Toplu işlem sırasında hata oluştu kanka. 😞"
                : "An error occurred during batch operation. 😞",
            success: false,
            data: { error: error instanceof Error ? error.message : "Unknown error" },
        };
    }
};
