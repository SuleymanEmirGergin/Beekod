import fs from "fs";
import path from "path";
import { config } from "../config.js";
import { formatCurrency } from "../i18n.js";
import { logger } from "../logger.js";
import { Locale } from "../types.js";

export type Category =
  | "general"
  | "jewelry"
  | "fashion"
  | "electronics"
  | "home"
  | "beauty"
  | "baby"
  | "sports"
  | "outdoor"
  | "pet"
  | "kitchen"
  | "office"
  | "gaming";

export type Tone = "neutral" | "premium" | "casual" | "energetic" | "playful" | "friendly" | "technical" | "bold";

type ContentBase = {
  name: string;
  price?: number;
  currency?: string;
  categoryHint?: string;
  toneHint?: string;
};

export type ContentResult = {
  text: string;
  category: Category;
  tone: Tone;
};

type SocialOverrides = {
  hashtags?: Partial<Record<Category, Partial<Record<Locale, string[]>>>>;
  toneHashtags?: Partial<Record<Tone, Partial<Record<Locale, string[]>>>>;
  toneEmojis?: Partial<Record<Tone, string[]>>;
};

type SeoOverrides = {
  toneSuffixes?: Partial<Record<Tone, Partial<Record<Locale, string[]>>>>;
};

type ContentConfig = {
  social?: SocialOverrides;
  seo?: SeoOverrides;
};

const CATEGORY_ALIASES: Record<string, Category> = {};
const TONE_ALIASES: Record<string, Tone> = {};
const CATEGORY_KEYWORDS: Record<Category, string[]> = {} as any;
const SEO_TEMPLATES: Record<string, Record<string, string[]>> = {};
const SEO_GENERIC_TEMPLATES: Record<string, string[]> = {};
const SEO_TONE_SUFFIXES: Record<string, Record<string, string[]>> = {};
const SOCIAL_TEMPLATES: Record<string, Record<string, string[]>> = {};
const SOCIAL_CTA: Record<string, string[]> = {};
const SOCIAL_HASHTAGS: Record<string, Record<string, string[]>> = {};
const TONE_HASHTAGS: Record<string, Record<string, string[]>> = {};
const TONE_EMOJIS: Record<string, string[]> = {};

function fillTemplate(template: string, replacements: Record<string, string>) {
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

function initData() {
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

initData();

let cachedContentConfig: ContentConfig | null = null;
let cachedContentConfigMtime: number | null = null;

function loadContentConfig(): ContentConfig {
  try {
    const filePath = path.resolve(config.data.contentConfigPath);
    if (!fs.existsSync(filePath)) return {};
    const stat = fs.statSync(filePath);
    if (cachedContentConfig && cachedContentConfigMtime === stat.mtimeMs) {
      return cachedContentConfig;
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

function getSocialHashtags(category: Category, locale: Locale): string[] {
  const configData = loadContentConfig();
  return (
    configData.social?.hashtags?.[category]?.[locale] ??
    SOCIAL_HASHTAGS[category]?.[locale] ??
    SOCIAL_HASHTAGS[category]?.["en"] ??
    []
  );
}

function getToneHashtags(tone: Tone, locale: Locale): string[] {
  const configData = loadContentConfig();
  return (
    configData.social?.toneHashtags?.[tone]?.[locale] ??
    TONE_HASHTAGS[tone]?.[locale] ??
    TONE_HASHTAGS[tone]?.["en"] ??
    []
  );
}

function getToneEmojis(tone: Tone): string[] {
  const configData = loadContentConfig();
  return configData.social?.toneEmojis?.[tone] ?? TONE_EMOJIS[tone] ?? [""];
}

function getToneSuffixes(tone: Tone, locale: Locale): string[] {
  const configData = loadContentConfig();
  return (
    (configData.seo?.toneSuffixes as any)?.[tone]?.[locale] ??
    SEO_TONE_SUFFIXES[tone]?.[locale] ??
    SEO_TONE_SUFFIXES[tone]?.["en"] ??
    []
  );
}

function normalizeCategory(value: string) {
  return value
    .normalize("NFD")
    .replace(/\u0131/g, "i")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeTone(value: string) {
  return value
    .normalize("NFD")
    .replace(/\u0131/g, "i")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function resolveCategory(name: string, hint?: string): Category {
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
        return category as Category;
      }
    }
  }
  return "general";
}

function resolveTone(hint?: string): Tone {
  if (!hint) {
    return "neutral";
  }
  const key = normalizeTone(hint);
  return TONE_ALIASES[key] ?? "neutral";
}

function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}

function pickTemplate(templates: string[], seed: string): (name: string, price: string) => string {
  if (!templates || !templates.length) {
    return (name: string) => name;
  }
  const index = hashSeed(seed) % templates.length;
  const templateStr = templates[index];
  return (name: string, price: string) => fillTemplate(templateStr, { name, price });
}

function pickFromList<T>(items: T[], seed: string): T | null {
  if (!items || !items.length) {
    return null;
  }
  const index = hashSeed(seed) % items.length;
  return items[index] ?? null;
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.filter(Boolean)));
}

function selectTags(tags: string[], seed: string, max: number) {
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

function buildPriceSnippet(base: ContentBase) {
  if (base.price == null || !base.currency) {
    return "";
  }
  return formatCurrency(base.price, base.currency);
}

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
