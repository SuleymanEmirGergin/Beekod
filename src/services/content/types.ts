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

export type ContentBase = {
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

export type SocialOverrides = {
    hashtags?: Partial<Record<Category, Partial<Record<string, string[]>>>>;
    toneHashtags?: Partial<Record<Tone, Partial<Record<string, string[]>>>>;
    toneEmojis?: Partial<Record<Tone, string[]>>;
};

export type SeoOverrides = {
    toneSuffixes?: Partial<Record<Tone, Partial<Record<string, string[]>>>>;
};

export type ContentConfig = {
    social?: SocialOverrides;
    seo?: SeoOverrides;
};
