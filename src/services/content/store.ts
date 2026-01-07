import fs from "fs";
import path from "path";
import { config } from "../../config.js";
import { logger } from "../../logger.js";
import { formatCurrency } from "../../i18n.js";
import { Locale } from "../../types.js";
import { Category as ContentCategory, Tone as ContentTone, ContentBase, ContentConfig } from "./types.js";

// Alias internal types to match logic
type ApiCategory = ContentCategory;
type ApiTone = ContentTone;

export const CATEGORY_ALIASES: Record<string, ApiCategory> = {};
export const TONE_ALIASES: Record<string, ApiTone> = {};
export const CATEGORY_KEYWORDS: Record<ApiCategory, string[]> = {} as any;
export const SEO_TEMPLATES: Record<string, Record<string, string[]>> = {};
export const SEO_GENERIC_TEMPLATES: Record<string, string[]> = {};
export const SEO_TONE_SUFFIXES: Record<string, Record<string, string[]>> = {};
export const SOCIAL_TEMPLATES: Record<string, Record<string, string[]>> = {};
export const SOCIAL_CTA: Record<string, string[]> = {};
export const SOCIAL_HASHTAGS: Record<string, Record<string, string[]>> = {};
export const TONE_HASHTAGS: Record<string, Record<string, string[]>> = {};
export const TONE_EMOJIS: Record<string, string[]> = {};

export function fillTemplate(template: string, replacements: Record<string, string>) {
    return template.replace(/{(\w+)}/g, (_, key) => replacements[key] ?? "");
}

function loadJsonFile(relativePath: string) {
    try {
        const filePath = path.resolve(relativePath);
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        logger.error("content.load_json_failed", { path: relativePath, error });
        return null;
    }
}

export function initData() {
    const mappings = loadJsonFile(config.data.templates.mappings);
    if (mappings) {
        Object.assign(CATEGORY_ALIASES, mappings.category_aliases);
        Object.assign(TONE_ALIASES, mappings.tone_aliases);
        Object.assign(CATEGORY_KEYWORDS, mappings.category_keywords);
        Object.assign(SEO_TONE_SUFFIXES, mappings.tone_suffixes);
        Object.assign(SOCIAL_CTA, mappings.social_cta);
        Object.assign(SOCIAL_HASHTAGS, mappings.social_hashtags);
        Object.assign(TONE_HASHTAGS, mappings.tone_hashtags);
        Object.assign(TONE_EMOJIS, mappings.tone_emojis);
    }

    const seo = loadJsonFile(config.data.templates.seo);
    if (seo) {
        for (const [key, value] of Object.entries(seo)) {
            if (key === "generic") {
                Object.assign(SEO_GENERIC_TEMPLATES, value);
            } else {
                SEO_TEMPLATES[key] = value as any;
            }
        }
    }

    const social = loadJsonFile(config.data.templates.social);
    if (social) {
        Object.assign(SOCIAL_TEMPLATES, social);
    }
}

let cachedContentConfig: ContentConfig | null = null;
let cachedContentConfigMtime: number | null = null;

export function loadContentConfig(): ContentConfig {
    try {
        const filePath = path.resolve(config.data.contentConfigPath);
        if (!fs.existsSync(filePath)) return {};
        const stat = fs.statSync(filePath);
        if (cachedContentConfig && cachedContentConfigMtime === stat.mtimeMs) {
            return cachedContentConfig as ContentConfig;
        }
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw) as ContentConfig;
        cachedContentConfig = parsed ?? {};
        cachedContentConfigMtime = stat.mtimeMs;
        return cachedContentConfig;
    } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code && err.code !== "ENOENT") {
            logger.warn("content.config.read_failed", { path: config.data.contentConfigPath, err });
        }
        return {};
    }
}

export function getSocialHashtags(category: ApiCategory, locale: Locale): string[] {
    const configData = loadContentConfig();
    return (
        (configData.social?.hashtags as any)?.[category]?.[locale] ??
        SOCIAL_HASHTAGS[category]?.[locale] ??
        SOCIAL_HASHTAGS[category]?.["en"] ??
        []
    );
}

export function getToneHashtags(tone: ApiTone, locale: Locale): string[] {
    const configData = loadContentConfig();
    return (
        (configData.social?.toneHashtags as any)?.[tone]?.[locale] ??
        TONE_HASHTAGS[tone]?.[locale] ??
        TONE_HASHTAGS[tone]?.["en"] ??
        []
    );
}

export function getToneEmojis(tone: ApiTone): string[] {
    const configData = loadContentConfig();
    return (configData.social?.toneEmojis as any)?.[tone] ?? TONE_EMOJIS[tone] ?? [""];
}

export function getToneSuffixes(tone: ApiTone, locale: Locale): string[] {
    const configData = loadContentConfig();
    return (
        (configData.seo?.toneSuffixes as any)?.[tone]?.[locale] ??
        SEO_TONE_SUFFIXES[tone]?.[locale] ??
        SEO_TONE_SUFFIXES[tone]?.["en"] ??
        []
    );
}

export function normalizeCategory(value: string) {
    return value
        .normalize("NFD")
        .replace(/\u0131/g, "i")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

export function normalizeTone(value: string) {
    return value
        .normalize("NFD")
        .replace(/\u0131/g, "i")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

export function resolveCategory(name: string, hint?: string): ApiCategory {
    if (hint) {
        const key = normalizeCategory(hint);
        if (CATEGORY_ALIASES[key]) {
            return CATEGORY_ALIASES[key];
        }
    }
    const normalizedName = normalizeCategory(name);
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (category === "general") {
            continue;
        }
        for (const keyword of keywords) {
            if (normalizedName.includes(normalizeCategory(keyword))) {
                return category as ApiCategory;
            }
        }
    }
    return "general";
}

export function resolveTone(hint?: string): ApiTone {
    if (!hint) {
        return "neutral";
    }
    const key = normalizeTone(hint);
    return TONE_ALIASES[key] ?? "neutral";
}

export function hashSeed(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) % 100000;
    }
    return hash;
}

export function pickTemplate(templates: string[], seed: string): (name: string, price: string) => string {
    if (!templates || !templates.length) {
        return (name: string) => name;
    }
    const index = hashSeed(seed) % templates.length;
    const templateStr = templates[index];
    return (name: string, price: string) => fillTemplate(templateStr, { name, price });
}

export function pickFromList<T>(items: T[], seed: string): T | null {
    if (!items || !items.length) {
        return null;
    }
    const index = hashSeed(seed) % items.length;
    return items[index] ?? null;
}

export function uniqueTags(tags: string[]) {
    return Array.from(new Set(tags.filter(Boolean)));
}

export function selectTags(tags: string[], seed: string, max: number) {
    const unique = uniqueTags(tags);
    if (unique.length <= max) {
        return unique;
    }
    const start = hashSeed(seed) % unique.length;
    const picked: string[] = [];
    for (let i = 0; i < unique.length && picked.length < max; i += 1) {
        picked.push(unique[(start + i) % unique.length]);
    }
    return picked;
}

export function buildPriceSnippet(base: ContentBase) {
    if (base.price == null || !base.currency) {
        return "";
    }
    return formatCurrency(base.price, base.currency);
}
