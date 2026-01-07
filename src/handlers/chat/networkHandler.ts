import { IntentHandler } from "./types.js";
import { searchNetwork } from "../../services/networkService.js";
import { extractBarcode } from "../../utils/intent.js";
import { t } from "../../i18n.js";

/**
 * Network Stock Query Handler
 * Handles "Kimde var?" type queries for wholesaler network
 */
export const networkHandler: IntentHandler = async (parsed, context) => {
    const { message, locale } = context;

    // Extract barcode from message
    const barcode = parsed.barcode || extractBarcode(message);

    if (!barcode) {
        return {
            reply: locale === "tr"
                ? "Kanka hangi ürünü arıyorsun? Barkod numarasını söyle. 🤔"
                : "Which product are you looking for? Please provide the barcode. 🤔",
            success: false,
        };
    }

    try {
        // Search in wholesaler network
        const wholesalers = await searchNetwork(barcode);

        if (wholesalers.length === 0) {
            return {
                reply: locale === "tr"
                    ? `Bu ürünü ağdaki başka hiçbir toptancı satmıyor kanka. Tek bizde var herhalde! 👑\n\nBarkod: ${barcode}`
                    : `No other wholesaler in the network has this item. We are the only ones! 👑\n\nBarcode: ${barcode}`,
                success: true,
                data: { barcode, wholesalerMatches: [] },
            };
        }

        // Format results
        const results = wholesalers
            .map(
                (w: any, i: number) =>
                    `${i + 1}. **${w.wholesalerName}** 🏢\n   📦 Stok: ${w.stock} adet\n   💰 Fiyat: ${w.price} ${w.currency}\n   📞 ${w.phone || "İletişim bilgisi yok"}\n   📍 ${w.location || "Konum bilgisi yok"}`,
            )
            .join("\n\n");

        return {
            reply: locale === "tr"
                ? `Ooo buldum kanka! 🎯 Şu toptancılarda var:\n\n${results}\n\n💡 İstersen direkt iletişime geçebilirsin!`
                : `Found it buddy! 🎯 Available at these wholesalers:\n\n${results}\n\n💡 You can contact them directly!`,
            success: true,
            data: { barcode, wholesalerMatches: wholesalers },
        };
    } catch (error) {
        return {
            reply: locale === "tr"
                ? "Hata oluştu kanka, network'te arama yapamadım. 😞"
                : "An error occurred while searching the network. 😞",
            success: false,
            data: { error: error instanceof Error ? error.message : "Unknown error" },
        };
    }
};
