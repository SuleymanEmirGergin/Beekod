import { pool } from "../db.js";
import { logger } from "../logger.js";

/**
 * Accessory Filter Service
 * 
 * Ana ürün ve aksesuar ayrımı yapar
 * Aksesuarları otomatik filtreler veya gruplar
 */
export class AccessoryFilterService {
    // Aksesuar anahtar kelimeleri (Türkçe + İngilizce)
    private accessoryKeywords = [
        // Telefon aksesuarları
        "kılıf", "kilif", "case", "cover",
        "koruyucu", "koruma", "protector",
        "cam", "ekran koruyucu", "screen protector", "tempered glass",
        "şarj", "sarj", "charger", "adapter", "adaptör",
        "kablo", "cable", "usb", "lightning", "type-c",
        "kulaklık", "kulaklik", "earphone", "headphone", "earbud",
        "powerbank", "batarya", "battery",
        "tutucu", "stand", "holder", "dock",
        "çanta", "canta", "bag", "pouch",
        "stylus", "kalem", "pen",

        // Genel aksesuarlar
        "aksesuar", "accessory", "accessories",
        "yedek", "parça", "spare", "part",
        "takım", "set", "kit",

        // Montaj/kurulum
        "montaj", "mount", "bracket",
        "vida", "screw", "bolt",
    ];

    // Ana ürün kategorileri
    private mainProductIndicators = [
        "telefon", "phone", "smartphone",
        "tablet", "ipad",
        "laptop", "notebook", "bilgisayar", "computer",
        "tv", "televizyon", "television",
        "monitor", "ekran",
        "yazıcı", "printer",
        "kamera", "camera",
        "konsol", "playstation", "xbox", "nintendo",
        "saat", "watch", "smartwatch",
    ];

    /**
     * Ürünün aksesuar olup olmadığını kontrol et
     */
    isAccessory(productName: string, category?: string): boolean {
        const normalizedName = this.normalizeText(productName);
        const normalizedCategory = category ? this.normalizeText(category) : "";

        // Check for accessory keywords
        for (const keyword of this.accessoryKeywords) {
            if (normalizedName.includes(keyword) || normalizedCategory.includes(keyword)) {
                return true;
            }
        }

        // Check if it's NOT a main product (less reliable)
        const hasMainProductIndicator = this.mainProductIndicators.some(
            indicator => normalizedName.includes(indicator)
        );

        // If no main product indicator and has generic terms, might be accessory
        if (!hasMainProductIndicator) {
            const genericAccessoryPatterns = [
                /için\s*$/,  // "iPhone 15 için" pattern
                /uyumlu$/,   // "uyumlu" at end
                /compatible$/,
                /\d+\s*(adet|pcs|pack)/i,  // quantity packs
            ];

            for (const pattern of genericAccessoryPatterns) {
                if (pattern.test(normalizedName)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Ürün listesini filtrele
     * @param products Ürün listesi
     * @param options Filtreleme seçenekleri
     */
    filterProducts<T extends { name: string; category?: string }>(
        products: T[],
        options: {
            excludeAccessories?: boolean;
            onlyAccessories?: boolean;
            groupByMainProduct?: boolean;
        } = {}
    ): T[] | { main: T[]; accessories: T[] } {
        const { excludeAccessories, onlyAccessories, groupByMainProduct } = options;

        if (groupByMainProduct) {
            const main: T[] = [];
            const accessories: T[] = [];

            for (const product of products) {
                if (this.isAccessory(product.name, product.category)) {
                    accessories.push(product);
                } else {
                    main.push(product);
                }
            }

            return { main, accessories };
        }

        if (onlyAccessories) {
            return products.filter(p => this.isAccessory(p.name, p.category));
        }

        if (excludeAccessories) {
            return products.filter(p => !this.isAccessory(p.name, p.category));
        }

        return products;
    }

    /**
     * Ana ürün için aksesuarları bul
     */
    async findAccessoriesForProduct(barcode: string): Promise<any[]> {
        try {
            // Get main product info
            const [mainRows] = await pool.execute(
                `SELECT name, category FROM products WHERE barcode = ?`,
                [barcode]
            );

            const mainProducts = mainRows as any[];
            if (mainProducts.length === 0) {
                return [];
            }

            const mainProduct = mainProducts[0];
            const mainName = mainProduct.name.toLowerCase();

            // Extract brand/model from main product name
            const keywords = this.extractKeywords(mainName);

            if (keywords.length === 0) {
                return [];
            }

            // Search for matching accessories
            const searchPattern = keywords.map(k => `%${k}%`).join("");

            const [rows] = await pool.execute(
                `SELECT barcode, name, price, stock, category
         FROM products
         WHERE barcode != ?
         AND (${keywords.map(() => "LOWER(name) LIKE ?").join(" OR ")})
         LIMIT 50`,
                [barcode, ...keywords.map(k => `%${k}%`)]
            );

            const products = rows as any[];

            // Filter to only accessories
            return products.filter(p => this.isAccessory(p.name, p.category));

        } catch (error) {
            logger.error("accessoryFilter.findAccessories_failed", { error, barcode });
            return [];
        }
    }

    /**
     * Aksesuar ürünün ana ürününü bul
     */
    async findMainProductForAccessory(barcode: string): Promise<any | null> {
        try {
            // Get accessory product info
            const [accRows] = await pool.execute(
                `SELECT name, category FROM products WHERE barcode = ?`,
                [barcode]
            );

            const accProducts = accRows as any[];
            if (accProducts.length === 0) {
                return null;
            }

            const accessory = accProducts[0];

            if (!this.isAccessory(accessory.name, accessory.category)) {
                return null; // Not an accessory
            }

            // Extract brand/model from accessory name
            const keywords = this.extractKeywords(accessory.name);

            if (keywords.length === 0) {
                return null;
            }

            // Search for matching main products
            const [rows] = await pool.execute(
                `SELECT barcode, name, price, stock, category
         FROM products
         WHERE barcode != ?
         AND (${keywords.map(() => "LOWER(name) LIKE ?").join(" OR ")})
         LIMIT 20`,
                [barcode, ...keywords.map(k => `%${k}%`)]
            );

            const products = rows as any[];

            // Filter to only main products (not accessories)
            const mainProducts = products.filter(p => !this.isAccessory(p.name, p.category));

            return mainProducts[0] || null;

        } catch (error) {
            logger.error("accessoryFilter.findMainProduct_failed", { error, barcode });
            return null;
        }
    }

    /**
     * Normalize text for comparison
     */
    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .replace(/[ğ]/g, "g")
            .replace(/[ü]/g, "u")
            .replace(/[ş]/g, "s")
            .replace(/[ı]/g, "i")
            .replace(/[ö]/g, "o")
            .replace(/[ç]/g, "c")
            .replace(/[İ]/g, "i")
            .trim();
    }

    /**
     * Extract brand/model keywords from product name
     */
    private extractKeywords(name: string): string[] {
        const normalized = this.normalizeText(name);

        // Common brand patterns
        const brandPatterns = [
            /iphone\s*\d+/i,
            /samsung\s*(galaxy\s*)?[a-z]*\s*\d+/i,
            /xiaomi\s*\w+/i,
            /huawei\s*\w+/i,
            /oppo\s*\w+/i,
            /realme\s*\w+/i,
            /macbook\s*(pro|air)?/i,
            /ipad\s*(pro|air|mini)?/i,
            /airpods\s*(pro)?/i,
        ];

        const keywords: string[] = [];

        for (const pattern of brandPatterns) {
            const match = normalized.match(pattern);
            if (match) {
                keywords.push(match[0].trim());
            }
        }

        // Also extract significant words (3+ chars, not common words)
        const commonWords = ["için", "uyumlu", "model", "yeni", "orijinal", "compatible", "case", "kilif"];
        const words = normalized.split(/\s+/);

        for (const word of words) {
            if (word.length >= 3 && !commonWords.includes(word) && !keywords.includes(word)) {
                keywords.push(word);
                if (keywords.length >= 3) break;
            }
        }

        return keywords.slice(0, 3);
    }
}

// Singleton instance
export const accessoryFilterService = new AccessoryFilterService();
