import { MarketplaceName } from "../marketplaces/types.js";

// ============================================================
// INTENT TAXONOMY (PROMPTtaki şemaya göre)
// ============================================================

/**
 * BEEKOD Mode Intents - Mağaza operasyonları
 */
export type BeekodIntent =
    | "price_query"           // Fiyat sorgula
    | "price_update"          // Fiyat güncelle
    | "stock_query"           // Stok sorgula
    | "stock_update"          // Stok güncelle
    | "stock_alert"           // Stok uyarı ayarla
    | "order_query"           // Sipariş sorgula
    | "sales_report"          // Satış raporu
    | "marketplace_sync"      // Pazaryeri senkronizasyon
    | "marketplace_publish"   // Ürün yayınla
    | "product_search"        // Ürün ara (6 pazaryerinde)
    | "product_import"        // Ürün mağazaya ekle
    | "listing_update"        // Listing güncelle
    | "batch_operation"       // Toplu işlem
    | "analytics_query";      // Analitik sorgusu

/**
 * TOPTANCI Mode Intents - Toptancı ağı operasyonları
 */
export type ToptanciIntent =
    | "wholesaler_search"     // Ürün ara (toptancı ağında)
    | "stock_holders_query"   // Kimde var?
    | "send_message"          // Platform içi mesaj gönder
    | "request_quote"         // Fiyat teklifi iste
    | "view_messages"         // Mesajları görüntüle
    | "share_phone";          // Telefon paylaş (özel onay gerektirir)

export type ChatIntent = BeekodIntent | ToptanciIntent;

// ============================================================
// CHAT MODES
// ============================================================

export type ChatMode = "BEEKOD" | "TOPTANCI";

// ============================================================
// ENTITY EXTRACTION
// ============================================================

export interface ChatEntity {
    barcode?: string;
    productName?: string;
    price?: number;
    stock?: number;
    marketplace?: MarketplaceName;
    dateRange?: {
        start: string;
        end: string;
    };
    quantity?: number;
    threshold?: number;
    // Toptancı-specific
    wholesalerId?: number;
    requestedQty?: number;
    phoneNumber?: string;
    // Search-specific refinement
    queryProductType?: "MAIN_PRODUCT" | "ACCESSORY" | "PARTS" | "UNKNOWN";
    queryIntent?: "BUY" | "RESEARCH" | "COMPARISON" | "SUPPORT";
}

// ============================================================
// INTENT DETECTION RESULT
// ============================================================

export interface IntentDetectionResult {
    intent: ChatIntent;
    mode: ChatMode;
    entities: ChatEntity;
    confidence: number;
    requiresConfirmation: boolean;
    confirmationType?: "destructive" | "privacy";
}

// ============================================================
// CHAT MESSAGE
// ============================================================

export interface ChatMessage {
    id?: number;
    sessionId: string;
    role: "user" | "assistant" | "system";
    content: string;
    metadata?: {
        intent?: ChatIntent;
        entities?: ChatEntity;
        confirmationCode?: string;
        productCards?: ProductCard[];
        marketplaceComparison?: MarketplaceComparisonCard[];
        wholesalerList?: WholesalerStockHolder[];
    };
    createdAt?: Date;
}

// ============================================================
// SESSION
// ============================================================

export interface ChatSession {
    id: string;
    userId?: string;
    title?: string;
    mode?: ChatMode;
    isActive: boolean;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface ChatResponse {
    message: string;
    intent?: ChatIntent;
    data?: unknown;
    productCards?: ProductCard[];
    marketplaceComparison?: MarketplaceComparisonCard[];
    wholesalerList?: WholesalerStockHolder[];
    requiresConfirmation?: boolean;
    confirmationCode?: string;
    confirmationType?: "destructive" | "privacy";
}

// ============================================================
// PRODUCT CARD (Arama sonuçları için)
// ============================================================

export interface ProductCard {
    barcode?: string;
    name: string;
    price: number;
    currency: string;
    stock?: number;
    imageUrl?: string;
    image?: string; // Frontend ChatWidget compatibility
    marketplace?: MarketplaceName;
    url?: string;
    canImport?: boolean; // Mağazama Ekle butonu
}

// ============================================================
// MARKETPLACE COMPARISON CARD
// ============================================================

export interface MarketplaceComparisonCard {
    marketplace: MarketplaceName;
    price: number;
    stock: number;
    currency: string;
    available: boolean;
    url?: string;
}

// ============================================================
// WHOLESALER STOCK HOLDER (Toptancı Ağı)
// ============================================================

export interface WholesalerStockHolder {
    wholesalerId: number;
    displayName: string;        // "Toptancı #A12"
    availability: "VAR" | "YOK";
    stockQuantity?: number;     // Sadece kendi hesabı ise göster
    city?: string;
    canMessage: boolean;
}

// ============================================================
// CONFIRMATION SYSTEM
// ============================================================

export interface PendingConfirmation {
    id: string;
    sessionId: string;
    userId?: string;
    type: "destructive" | "privacy";
    code: string;  // 4 haneli rastgele
    action: string;
    payload: Record<string, unknown>;
    expiresAt: Date;
    createdAt: Date;
}

// ============================================================
// AUDIT LOG
// ============================================================

export interface AuditLog {
    userId?: string;
    sessionId: string;
    action: string;
    entity: string;  // "product", "stock", "price", "message", etc.
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
    metadata?: Record<string, unknown>;
    timestamp: Date;  // Europe/Istanbul
    ipAddress?: string;
}

// ============================================================
// HANDLER RESULT
// ============================================================

export interface HandlerResult {
    success: boolean;
    message: string;
    data?: unknown;
    productCards?: ProductCard[];
    marketplaceComparison?: MarketplaceComparisonCard[];
    wholesalerList?: WholesalerStockHolder[];
    requiresConfirmation?: boolean;
    confirmationType?: "destructive" | "privacy";
}
