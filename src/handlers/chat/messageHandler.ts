import { IntentHandler } from "./types.js";
import { extractBarcode } from "../../utils/intent.js";
import { getProductByBarcode } from "../../services/productService.js";

/**
 * Message Handler
 * Handles "Mesaj at", "Teklif al" commands for wholesalers
 */
export const messageHandler: IntentHandler = async (parsed, context) => {
    const { message, locale } = context;

    // Try to find if a wholesaler name or ID is mentioned
    const wholesalerMatch = message.match(/["']?([^"']+)["']?\s+(?:toptancısına|ismli toptancıya|firmasına)/i);
    const wholesalerName = wholesalerMatch ? wholesalerMatch[1] : null;

    try {
        // If we have a product context, we might be asking for a quote for that product
        const barcode = parsed.barcode || extractBarcode(message);
        let productInfo = "";

        if (barcode) {
            const product = await getProductByBarcode(barcode);
            if (product) {
                productInfo = `\n📦 **Ürün:** ${product.name} (${barcode})`;
            }
        }

        if (!wholesalerName) {
            return {
                reply: locale === "tr"
                    ? `Kanka hangi toptancıya mesaj atalım? 🤔\n\nÖrnek: "Lunays Toptan'a mesaj at" veya "Birinci satıcıdan teklif al"`
                    : `Buddy, which wholesaler should I message? 🤔\n\nExample: "Message Lunays Wholesaler" or "Get a quote from the first seller"`,
                success: false,
            };
        }

        // Simulate sending a message / opening a chat
        // In a real system, this would trigger an API call to a messaging service
        return {
            reply: locale === "tr"
                ? `Tamamdır kanka! 💌 **${wholesalerName}** isimli toptancıya teklif talebini iletiyorum.${productInfo}\n\n✅ Mesajın başarıyla kuyruğa alındı. Toptancı dönüş yaptığında sana bildirim atacağım! 🚀`
                : `Done buddy! 💌 I'm sending your quote request to **${wholesalerName}**.${productInfo}\n\n✅ Your message has been successfully queued. I'll notify you when the wholesaler responds! 🚀`,
            success: true,
            data: { wholesalerName, barcode, action: "send_message" },
        };
    } catch (error) {
        return {
            reply: locale === "tr"
                ? "Mesaj gönderirken bir aksilik çıktı kanka. 😞"
                : "Something went wrong while sending the message buddy. 😞",
            success: false,
            data: { error: error instanceof Error ? error.message : "Unknown error" },
        };
    }
};
