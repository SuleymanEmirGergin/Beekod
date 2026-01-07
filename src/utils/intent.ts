// src/utils/intent.ts
export type Intent =
  | "TOP_SELLERS"
  | "CRITICAL_STOCK"
  | "SALES_SUMMARY"
  | "PRICE_ANALYSIS"
  | "BARCODE_LOOKUP"
  | "PRODUCT_SEARCH"
  | "NETWORK_STOCK_QUERY"
  | "UPDATE_PRICE"
  | "UPDATE_STOCK"
  | "BATCH_UPDATE"
  | "SEO_CONTENT"
  | "TRANSLATE"
  | "SEND_MESSAGE"
  | "UNKNOWN";



export function extractBarcode(text: string): string | null {
  const s = (text ?? "").trim();

  // Bee12345 gibi
  const bee = s.match(/\bBee\d+\b/i);
  if (bee) return bee[0];

  // 8-14 haneli barkod gibi (EAN/UPC)
  const digits = s.match(/\b\d{8,14}\b/);
  if (digits) return digits[0];

  return null;
}

export function detectIntent(message: string, action?: string): Intent {
  const m = (message ?? "").toLowerCase();

  // UI butonları varsa body.action ile direkt intent geçmek en sağlamı
  if (action === "TOP_SELLERS") return "TOP_SELLERS";
  if (action === "CRITICAL_STOCK") return "CRITICAL_STOCK";
  if (action === "SALES_SUMMARY") return "SALES_SUMMARY";
  if (action === "PRICE_ANALYSIS") return "PRICE_ANALYSIS";

  if (m.includes("en çok satan") || (m.includes("top") && m.includes("satan"))) return "TOP_SELLERS";
  if (m.includes("kritik stok") || m.includes("stok kritik") || m.includes("stok seviyesi")) return "CRITICAL_STOCK";
  if (m.includes("satış özeti") || m.includes("satış performans") || m.includes("performansımı özetle"))
    return "SALES_SUMMARY";
  // Price Analysis
  if (m.includes("fiyat analizi") || (m.includes("fiyatlar") && m.includes("analiz")) || m.includes("تحليل الأسعار")) return "PRICE_ANALYSIS";

  // Network stock query - "kimde var", "başka kim satıyor", "من عنده"
  if (m.includes("kimde var") || m.includes("başka kim") || m.includes("kim satıyor") || m.includes("من عنده")) {
    return "NETWORK_STOCK_QUERY";
  }

  // Direct price update
  if ((m.includes("fiyat") && (m.includes(" yap") || m.includes("güncelle") || m.includes("değiştir"))) ||
    (m.includes("fiyatını") && /\d+/.test(m)) ||
    m.includes("تحديث السعر")) {
    return "UPDATE_PRICE";
  }

  // Direct stock update
  if ((m.includes("stok") && (m.includes(" yap") || m.includes("güncelle") || m.includes("değiştir"))) ||
    (m.includes("stoğunu") && /\d+/.test(m)) ||
    m.includes("تحديث المخزون")) {
    return "UPDATE_STOCK";
  }

  // Messaging / Request Quote - "mesaj at", "teklif al", "أرسل رسالة"
  if (m.includes("mesaj at") || m.includes("iletişim") || m.includes("teklif al") || m.includes("أرسل رسالة") || m.includes("اطلب عرض")) {
    return "SEND_MESSAGE";
  }

  // Batch operations
  if ((m.includes("tüm") || m.includes("hepsi") || m.includes("toplu") || m.includes("الكل")) &&
    (m.includes("stok") || m.includes("fiyat") || m.includes("güncelle"))) {
    return "BATCH_UPDATE";
  }

  // SEO content generation
  if (m.includes("seo") || (m.includes("açıklama") && m.includes("yaz")) || m.includes("وصف سيو")) {
    return "SEO_CONTENT";
  }

  // Translation
  if (m.includes("çevir") || m.includes("translate") || m.includes("ingilizce") || m.includes("türkçe") || m.includes("عربي") || m.includes("ترجم")) {
    return "TRANSLATE";
  }

  const barcode = extractBarcode(message);
  if (barcode) return "BARCODE_LOOKUP";

  if (barcode) return "BARCODE_LOOKUP";

  // Barkod yoksa çoğu şey ürün araması / genel soru
  // iphone 17 gibi
  if (m.length >= 2) return "PRODUCT_SEARCH";

  return "UNKNOWN";
}
