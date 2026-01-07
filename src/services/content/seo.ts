import { Locale } from "../../types.js";
import { ContentBase, ContentResult } from "./types.js";
import {
    buildPriceSnippet,
    getToneSuffixes,
    pickFromList,
    pickTemplate,
    resolveCategory,
    resolveTone,
    SEO_GENERIC_TEMPLATES,
    SEO_TEMPLATES,
} from "./store.js";

export function buildSeoContent(base: ContentBase, locale: Locale): ContentResult {
    const price = buildPriceSnippet(base);
    const priceLine = price ? ` ${locale === "tr" ? "Fiyat" : "Price"}: ${price}.` : "";
    const category = resolveCategory(base.name, base.categoryHint);
    const tone = resolveTone(base.toneHint);

    const categoryTemplates = SEO_TEMPLATES[category]?.[locale] || SEO_TEMPLATES[category]?.["en"] || [];
    const genericTemplates = SEO_GENERIC_TEMPLATES[locale] || SEO_GENERIC_TEMPLATES["en"] || [];
    const templates = [...categoryTemplates, ...genericTemplates];

    const template = pickTemplate(templates, `${category}:${locale}:${tone}:${base.name}`);
    const toneOptions = getToneSuffixes(tone, locale);
    const toneSuffix = pickFromList(toneOptions, `${category}:${locale}:${tone}:${base.name}:tone`);
    const suffixText = toneSuffix ? ` ${toneSuffix}` : "";
    return {
        text: `${template(base.name, priceLine)}${suffixText}`,
        category,
        tone,
    };
}
