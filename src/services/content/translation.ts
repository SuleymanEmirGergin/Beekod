import { Locale } from "../../types.js";
import { ContentResult } from "./types.js";

export function buildTranslationContent(text: string, target: "en" | "tr", locale: Locale): ContentResult {
    if (target === "en") {
        return {
            text: locale === "tr" ? `Baslik (EN): ${text}` : `English title: ${text}`,
            category: "general",
            tone: "neutral",
        };
    }
    return {
        text: locale === "tr" ? `Baslik (TR): ${text}` : `Turkish title: ${text}`,
        category: "general",
        tone: "neutral",
    };
}
