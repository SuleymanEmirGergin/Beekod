import { Locale } from "../../types.js";
import { ContentBase, ContentResult } from "./types.js";
import {
    buildPriceSnippet,
    getSocialHashtags,
    getToneEmojis,
    getToneHashtags,
    hashSeed,
    pickFromList,
    pickTemplate,
    resolveCategory,
    resolveTone,
    selectTags,
    SOCIAL_CTA,
    SOCIAL_TEMPLATES,
} from "./store.js";

export function buildSocialContent(base: ContentBase, locale: Locale): ContentResult {
    const price = buildPriceSnippet(base);
    const priceLine = price ? ` ${price}.` : "";
    const category = resolveCategory(base.name, base.categoryHint);
    const tone = resolveTone(base.toneHint);

    const templates = SOCIAL_TEMPLATES[category]?.[locale] || SOCIAL_TEMPLATES[category]?.["en"] || [];
    const template = pickTemplate(templates, `${category}:${locale}:${tone}:${base.name}:social`);
    const emoji = pickFromList(getToneEmojis(tone), `${category}:${locale}:${tone}:${base.name}:emoji`);
    const cta = pickFromList(
        SOCIAL_CTA[locale] || SOCIAL_CTA["en"] || [],
        `${category}:${locale}:${tone}:${base.name}:cta`,
    );
    const includeCta = hashSeed(`${category}:${locale}:${tone}:${base.name}:cta:show`) % 2 === 0;

    const categoryTags = getSocialHashtags(category, locale);
    const toneTags = getToneHashtags(tone, locale);
    const tags = selectTags([...categoryTags, ...toneTags], `${category}:${locale}:${tone}:${base.name}:tags`, 4).join(
        " ",
    );

    const parts = [template(base.name, priceLine)];
    if (emoji) {
        parts.push(emoji);
    }
    if (cta && includeCta) {
        parts.push(cta);
    }
    if (tags) {
        parts.push(tags);
    }
    return {
        text: parts.join(" "),
        category,
        tone,
    };
}
