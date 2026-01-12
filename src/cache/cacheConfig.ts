/**
 * Redis Cache Configuration & Strategy
 * 
 * Bu dosya cache stratejilerini ve TTL değerlerini merkezi olarak yönetir.
 */

export const CacheConfig = {
    // Default TTL (saniye)
    defaultTTL: Number(process.env.CACHE_DEFAULT_TTL_SECONDS ?? 60),

    // Cache stratejileri ve TTL değerleri
    strategies: {
        // Sık değişen veriler - kısa TTL
        realtime: {
            ttl: 30, // 30 saniye
            description: 'Anlık veriler (stok durumu, aktif siparişler)',
        },

        // Orta sıklıkta değişen veriler
        standard: {
            ttl: 300, // 5 dakika
            description: 'Standart veriler (ürün listesi, kategori bilgileri)',
        },

        // Nadir değişen veriler - uzun TTL
        static: {
            ttl: 3600, // 1 saat
            description: 'Statik veriler (konfigürasyon, sabit listeler)',
        },

        // Analitik veriler - günlük güncelleme
        analytics: {
            ttl: 86400, // 24 saat
            description: 'Analitik ve raporlama verileri',
        },

        // Session verileri
        session: {
            ttl: 1800, // 30 dakika
            description: 'Oturum verileri',
        },
    },

    // Cache key prefixleri
    prefixes: {
        product: 'product',
        products: 'products',
        order: 'order',
        orders: 'orders',
        user: 'user',
        session: 'session',
        analytics: 'analytics',
        dashboard: 'dashboard',
        search: 'search',
    },
};

/**
 * Cache key builder
 */
export function buildCacheKey(prefix: keyof typeof CacheConfig.prefixes, ...parts: string[]): string {
    return [CacheConfig.prefixes[prefix], ...parts].join(':');
}

/**
 * Strategy-based TTL getter
 */
export function getTTL(strategy: keyof typeof CacheConfig.strategies): number {
    return CacheConfig.strategies[strategy]?.ttl ?? CacheConfig.defaultTTL;
}

/**
 * Cache key patterns for invalidation
 */
export const InvalidationPatterns = {
    // Ürün güncellendiğinde
    productUpdated: (barcode: string) => [
        buildCacheKey('product', barcode),
        buildCacheKey('products', '*'),
        buildCacheKey('search', '*'),
    ],

    // Sipariş oluşturulduğunda
    orderCreated: () => [
        buildCacheKey('orders', '*'),
        buildCacheKey('analytics', '*'),
        buildCacheKey('dashboard', '*'),
    ],

    // Stok güncellendiğinde
    stockUpdated: (barcode: string) => [
        buildCacheKey('product', barcode),
        buildCacheKey('analytics', 'inventory', '*'),
    ],
};
