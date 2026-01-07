export const BRAND_ALIASES: Record<string, string[]> = {
    "Apple": ["apple", "iphone", "i phone", "ıphone", "iph"],
    "Samsung": ["samsung", "galaxy"],
    "Xiaomi": ["xiaomi", "redmi", "mi"],
    "Huawei": ["huawei"],
    "Oppo": ["oppo"],
    "Vivo": ["vivo"],
    "Realme": ["realme"],
};

export const SERIES_ALIASES: Record<string, string[]> = {
    "Pro Max": ["promax", "pro max", "pro-max", "pro max."],
    "Pro": ["pro"],
    "Plus": ["plus"],
    "Mini": ["mini"],
    "Ultra": ["ultra"],
};

export const GUARANTEE_ALIASES = {
    turkiye: ["türkiye garantili", "apple türkiye", "tr garantili", "resmi distribütör", "distribütör garantili"],
    ithalatci: ["ithalatçı garantili", "ithalatci", "delta", "kvk", "genpa"],
};

export const COLOR_ALIASES: Record<string, string[]> = {
    "Ada Çayı": ["ada çayı", "adaçayı", "sage", "sage green", "sauge"],
    "Siyah": ["siyah", "black", "midnight", "gece yarısı", "space grey", "uzay grisi"],
    "Mavi": ["mavi", "blue", "koyu mavi", "deep blue", "sierra mavi"],
    "Beyaz": ["beyaz", "white", "starlight", "yıldız ışığı"],
    "Altın": ["altın", "gold"],
    "Gümüş": ["gümüş", "silver"],
    "Pembe": ["pembe", "pink"],
};

export const STOPWORDS_TR = [
    "en", "ucuz", "fiyat", "fiyatı", "kaç", "tl", "ne", "kadar", "satın", "al", "alınır",
    "kampanya", "indirim", "taksit", "sepette", "kargo", "bedava"
];

export const STORAGE_REGEX = /\b(64|128|256|512)\s?gb\b|\b1\s?tb\b|\b1024\s?gb\b/i;
export const IPHONE_MODEL_REGEX = /\biphone\s?(\d{1,3})\b/i;
export const SERIES_REGEX = /\b(pro\s?max|pro|max|plus|mini|ultra)\b/i;
export const PRICE_INTENT_REGEX = /\b(fiyat|kaç\s?tl|ne\s?kadar|ucuz|indirim|kampanya)\b/i;

export const SITE_DOMAINS: Record<string, string> = {
    "trendyol": "trendyol.com",
    "n11": "n11.com",
    "hepsiburada": "hepsiburada.com",
    "ciceksepeti": "ciceksepeti.com",
    "pttavm": "pttavm.com",
    "pazarama": "pazarama.com"
};
