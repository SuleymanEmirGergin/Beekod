
// Map external attribute keys to internal standardized keys
// Keys are normalized (lowercase, trimmed) for matching
export const ATTRIBUTE_MAPPINGS: Record<string, string> = {
    // Hafıza / Depolama
    "dahili hafiza": "Hafıza",
    "dahili depolama": "Hafıza",
    "depolama": "Hafıza",
    "hafiza": "Hafıza",
    "memory": "Hafıza",
    "rom": "Hafıza",
    "kapasite": "Hafıza",
    "depolama kapasitesi": "Hafıza",
    "storage": "Hafıza",

    // RAM
    "ram kapasitesi": "RAM",
    "ram": "RAM",
    "bellek": "RAM",
    "system memory": "RAM",

    // Renk
    "renk": "Renk",
    "color": "Renk",
    "urun rengi": "Renk",

    // Ekran
    "ekran boyutu": "Ekran Boyutu",
    "ekran": "Ekran Boyutu",
    "screen size": "Ekran Boyutu",
    "display": "Ekran Boyutu",
    "ekran olcusu": "Ekran Boyutu",

    // Batarya
    "pil gucu": "Pil Gücü",
    "pil gücü": "Pil Gücü",
    "batarya": "Pil Gücü",
    "pil gucu (mah)": "Pil Gücü",
    "battery": "Pil Gücü",
    "pil kapasitesi": "Pil Gücü",
    "batarya kapasitesi": "Pil Gücü",

    // Kamera
    "kamera cozunurlugu": "Kamera",
    "kamera çözünürlüğü": "Kamera",
    "on kamera": "Ön Kamera",
    "arka kamera": "Kamera",
    "arka kamera cozunurlugu": "Kamera",
    "camera": "Kamera",

    // İşletim Sistemi
    "isletim sistemi": "İşletim Sistemi",
    "os": "İşletim Sistemi",
    "operating system": "İşletim Sistemi",

    // İşlemci
    "islemci": "İşlemci",
    "processor": "İşlemci",
    "cpu": "İşlemci",
    "cip": "İşlemci",
    "islemci tipi": "İşlemci",

    // Garanti
    "garanti suresi": "Garanti Süresi",
    "garanti": "Garanti Süresi",
    "warranty": "Garanti Süresi",
    "garanti tipi": "Garanti Tipi",

    // Boyut
    "boyut": "Boyut",
    "ebat": "Boyut",
    "size": "Boyut",
    "dimensions": "Boyut",

    // Model
    "model": "Model",
    "cep telefonu modeli": "Model",
    "telefon modeli": "Model",
    "urun modeli": "Model",

    // Şarj
    "sarj girisi": "Şarj Girişi",
    "sarj tipi": "Şarj Girişi",
    "charging port": "Şarj Girişi",

    // Marka
    "marka": "Marka",
    "brand": "Marka",

    // Malzeme
    "malzeme": "Malzeme",
    "materyal": "Malzeme",
    "material": "Malzeme"
};

// Define available attributes per category to render dynamic forms
export const CATEGORY_SCHEMAS: Record<string, string[]> = {
    "Cep Telefonu": ["Renk", "Hafıza", "RAM", "Ekran Boyutu", "Pil Gücü", "Kamera", "İşletim Sistemi", "Garanti Tipi"],
    "Telefon": ["Renk", "Hafıza", "RAM", "Ekran Boyutu", "Pil Gücü", "Kamera", "İşletim Sistemi", "Garanti Tipi"], // Added alias
    "Bilgisayar": ["Renk", "İşlemci", "RAM", "SSD Kapasitesi", "Ekran Kartı", "Ekran Boyutu", "İşletim Sistemi"],
    "Tablet": ["Renk", "Hafıza", "RAM", "Ekran Boyutu", "Bağlantı Tipi"],
    "Kulaklık": ["Renk", "Bağlantı Tipi", "Mikrofon", "Gürültü Önleme"],
    "Saat": ["Renk", "Kordon Materyali", "Kasa Çapı", "Suya Dayanıklılık"],
    "Genel": ["Renk", "Malzeme", "Boyut", "Garanti Süresi"],
    "default": ["Renk", "Malzeme", "Boyut", "Garanti Süresi"]
};

// Helper to normalize keys for matching
function normalizeKey(key: string): string {
    return key
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9 ]/g, '')
        .trim();
}

/**
 * Maps raw attributes from external source to internal standardized keys
 */
export function mapExternalAttributes(externalAttrs: Record<string, string>): Record<string, string> {
    const mapped: Record<string, string> = {};

    Object.entries(externalAttrs).forEach(([key, value]) => {
        const normKey = normalizeKey(key);
        const internalKey = ATTRIBUTE_MAPPINGS[normKey];

        if (internalKey) {
            mapped[internalKey] = value;
        } else {
            // Keep original key if no mapping found (preserve data)
            // Capitalize first letter for better UI
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            mapped[formattedKey] = value;
        }
    });

    return mapped;
}

/**
 * Generates a rich HTML description from source description + mapped attributes
 */
export function buildRichDescription(
    originalDescription: string,
    attributes: Record<string, string>
): string {
    let desc = originalDescription || "";

    const attrEntries = Object.entries(attributes);
    if (attrEntries.length > 0) {
        desc += "\n\n<h3>Öne Çıkan Özellikler</h3>\n<ul>";
        attrEntries.forEach(([key, val]) => {
            desc += `\n  <li><strong>${key}:</strong> ${val}</li>`;
        });
        desc += "\n</ul>";
    }

    return desc;
}

/**
 * Normalizes attribute values for dropdown matching
 * Example: "256 GB" → "256gb", "8 GB RAM" → "8gb"
 */
export function normalizeValueForDropdown(value: string): string {
    return value
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/gb$/i, 'gb')
        .replace(/mb$/i, 'mb')
        .replace(/tb$/i, 'tb')
        .replace(/mah$/i, 'mah')
        .replace(/inch$/i, 'inch')
        .replace(/["'"]/g, '')
        .replace(/,/g, '.')
        .trim();
}

/**
 * Finds matching dropdown option from prefill value
 * Handles cases like "256 GB" matching "256GB" or "256 GB"
 */
export function findMatchingOption(
    prefillValue: string,
    options: string[]
): string | undefined {
    const normalizedPrefill = normalizeValueForDropdown(prefillValue);

    // Exact match after normalization
    const exactMatch = options.find(opt =>
        normalizeValueForDropdown(opt) === normalizedPrefill
    );
    if (exactMatch) return exactMatch;

    // Contains match (for partial values)
    const containsMatch = options.find(opt =>
        normalizeValueForDropdown(opt).includes(normalizedPrefill) ||
        normalizedPrefill.includes(normalizeValueForDropdown(opt))
    );
    if (containsMatch) return containsMatch;

    // Numeric extraction match (e.g., "256" matches "256 GB")
    const numericValue = prefillValue.replace(/[^0-9.]/g, '');
    if (numericValue) {
        const numericMatch = options.find(opt =>
            opt.replace(/[^0-9.]/g, '') === numericValue
        );
        if (numericMatch) return numericMatch;
    }

    return undefined;
}
