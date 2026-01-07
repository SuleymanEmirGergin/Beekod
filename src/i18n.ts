import { Locale } from "./types.js";

type MessageKey =
  | "missing_barcode"
  | "missing_amount"
  | "missing_amount_or_percent"
  | "missing_both"
  | "missing_product_info"
  | "missing_marketplace"
  | "missing_product_name"
  | "missing_price"
  | "missing_stock"
  | "missing_batch_request_id"
  | "product_name_not_found"
  | "product_ambiguous"
  | "percent_not_allowed"
  | "unknown_intent"
  | "not_found"
  | "product_saved"
  | "marketplace_listing_saved"
  | "marketplace_listing_activated"
  | "marketplace_sync_done"
  | "marketplace_listings_missing"
  | "marketplace_price_updated"
  | "marketplace_stock_updated"
  | "marketplace_list_summary"
  | "marketplace_list_empty"
  | "marketplace_configured_list"
  | "marketplace_configured_empty"
  | "marketplace_status_updated"
  | "cargo_company_list"
  | "marketplace_live_mode_not_configured"
  | "marketplace_live_mode_not_supported"
  | "marketplace_live_mode_all_not_supported"
  | "marketplace_live_mode_list_unavailable"
  | "marketplace_live_mode_all_summary"
  | "marketplace_live_mode_request_queued"
  | "marketplace_live_mode_request_failed"
  | "marketplace_batch_request_ready"
  | "marketplace_batch_request_failed"
  | "marketplace_batch_not_supported"
  | "price_updated"
  | "stock_updated"
  | "negative_price"
  | "competitor_empty"
  | "competitor_list"
  | "content_seo_ready"
  | "content_social_ready"
  | "content_translation_ready"
  | "image_upload_required"
  | "image_ready"
  | "image_profile_missing"
  | "image_inspect_info"
  | "image_inspect_ready"
  | "image_inspect_issues"
  | "image_inspect_confirm_fix"
  | "image_inspect_failed"
  | "image_search_missing"
  | "image_search_ready"
  | "image_search_empty"
  | "image_search_failed"
  | "image_search_billing_required"
  | "search_missing_query"
  | "search_ready"
  | "search_empty"
  | "search_config_missing"
  | "search_failed"
  | "search_fallback"
  | "report_sales_summary"
  | "report_sales_empty"
  | "report_top_products"
  | "report_top_empty"
  | "cache_reset_done"
  | "server_error"
  | "pricing_recommend_missing_product"
  | "pricing_recommend_failed"
  | "pricing_recommend_system_error"
  | "sync_pending_not_found"
  | "sync_failed"
  | "sync_cancelled"
  | "sync_local_only"
  | "sync_completed_count"
  | "product_not_found_simple"
  | "product_info_format"
  | "help_message"
  | "batch_price_missing_amount"
  | "batch_price_complete"
  | "batch_price_failed"
  | "batch_stock_missing_amount"
  | "batch_stock_complete"
  | "batch_stock_failed"
  | "batch_errors"
  | "gemini_suggestion_failed"
  | "search_results"
  | "import_missing_url"
  | "import_no_provider_connected"
  | "import_success"
  | "import_failed"
  | "search_selection_invalid";

const messages: Record<Locale, Record<MessageKey, string>> = {
  tr: {
    missing_barcode: "Barkod gerekli. Barkodu yazar mısın?",
    missing_amount: "Miktar gerekli. Örnek: 500",
    missing_amount_or_percent: "Miktar veya yüzde gerekli. Örnek: 50 veya %10",
    missing_both: "Barkod ve miktar gerekli. Örnek: bee252525 barkodlu ürünün fiyatını 500 TL yap",
    missing_product_info: "Barkod veya ürün adı gerekli. Örnek: bee252525 barkodlu ürün için SEO açıklama yaz",
    missing_marketplace: "Hangi pazaryeri? Örnek: Trendyol veya Amazon",
    missing_product_name: "Ürün adı gerekli. Örnek: Ürün: Bee 252525 Bracelet",
    missing_price: "Fiyat gerekli. Örnek: fiyat: 500",
    missing_stock: "Stok gerekli. Örnek: stok: 5",
    missing_batch_request_id: "Batch request id gerekli. Örnek: batch request id: 123",
    product_name_not_found: "Bu ürün adıyla eşleşen kayıt bulamadım.",
    product_ambiguous: "Birden fazla ürün buldum: {{list}}. Lütfen barkodla devam edelim.",
    percent_not_allowed: "Yüzde ile doğrudan ayarlama yapamam. Net bir miktar girer misin?",
    unknown_intent: "Ne yapmak istediğini anlayamadım. Fiyat, stok, rakip fiyat ya da satış raporu deneyebilirsin.",
    not_found: "Üzgünüm, bu ürünü sistemde bulamadım. 😔 İstersen 'internette ara' diyerek web'de bakabilirim!",
    product_saved: "Tamamdır, ürün kaydedildi: {{name}} ({{barcode}}) ✅",
    marketplace_listing_saved: "{{marketplace}} listesini oluşturdum: {{barcode}} 📦",
    marketplace_listing_activated: "{{marketplace}}'de ürün artık yayında: {{barcode}} 🚀",
    marketplace_sync_done: "{{marketplace}} fiyat/stok eşitlendi kanka: {{barcode}} 🔄",
    marketplace_listings_missing: "Bu barkod için pazaryeri listesi bulunamadı.",
    marketplace_price_updated: "{{marketplace}} fiyatı güncellendi: {{barcode}}.",
    marketplace_stock_updated: "{{marketplace}} stoku güncellendi: {{barcode}}.",
    marketplace_list_summary: "{{marketplace}} için {{count}} liste buldum: {{list}}.",
    marketplace_list_empty: "{{marketplace}} için liste bulunamadı.",
    marketplace_configured_list: "Hazir pazaryerleri ({{count}}): {{list}}.",
    marketplace_configured_empty: "Hazir pazaryeri bulunamadi.",
    marketplace_status_updated: "{{marketplace}} ({{scope}}) durumu {{status}} yapıldı.",
    cargo_company_list: "Kargo şirket bilgileri:\n{{list}}",
    marketplace_live_mode_not_configured:
      "Canlı mod açık. {{marketplace}} için eksik ayarlar: {{missing}}. Mock mod için MARKETPLACE_MODE=mock kullan.",
    marketplace_live_mode_not_supported: "Canlı mod açık. {{marketplace}} entegrasyonu henüz bağlanmadı.",
    marketplace_live_mode_all_not_supported:
      "Canlı modda tüm pazaryerleri birlikte güncellenemez. Lütfen tek pazaryeri seç.",
    marketplace_live_mode_list_unavailable: "Canlı modda liste görüntüleme henüz desteklenmiyor.",
    marketplace_live_mode_all_summary:
      "Canlı mod: {{ok}} başarılı, {{failed}} başarısız/atlanmış. Detaylar data alanında.",
    marketplace_live_mode_request_queued: "Canlı mod: {{marketplace}} isteği iletildi ({{action}}).",
    marketplace_live_mode_request_failed: "Canlı mod: {{marketplace}} isteği başarısız. {{reason}}",
    marketplace_batch_request_ready: "Toplu işlem sonucu hazır ({{marketplace}}). {{summary}}",
    marketplace_batch_request_failed: "Toplu işlem sonucu alınmadı ({{marketplace}}). {{reason}}",
    marketplace_batch_not_supported: "Bu pazaryerinde batch sonucu desteklenmiyor: {{marketplace}}.",
    price_updated: "Halledildi! Fiyat {{price}} oldu. 💰",
    stock_updated: "Tamamdır, stok artık {{stock}}. 📦",
    negative_price: "Fiyat 0 altına inemez. Geçerli bir miktar gönder.",
    competitor_empty: "Bu barkod için rakip fiyatı bulamadım.",
    competitor_list: "Rakiplerin fiyatları şöyle kanka: {{list}}. Ortalama: {{average}}. Fiyatı güncelleyelim mi? ⚡",
    content_seo_ready: "Kanka SEO içeriği hazır! ✅\n\n{{text}}",
    content_social_ready: "Sosyal medya postun hazır hocam! 📲\n\n{{text}}",
    content_translation_ready: "Çeviri tamam kanka: {{text}} 🌍",

    image_upload_required: "Bu barkod için yüklenmiş görsel bulamadım. Önce /images/process ile görsel yükle.",
    image_ready: "Görsel hazır: {{url}}",
    image_profile_missing: "Görsel profili bulunamadı. Profili kontrol eder misin?",
    image_inspect_info: "Görsel kontrolü için barkod veya ürün adı gerekli.",
    image_inspect_ready: "Görsel uygun. Skor: {{score}}.",
    image_inspect_issues: "Görsel uygun değil. Eksikler: {{list}}. Skor: {{score}}.",
    image_inspect_confirm_fix:
      'Otomatik düzeltme için "onayla" yaz. Örnek: onayla barkod: {{barcode}} profil: {{profile}}.',
    image_inspect_failed: "Görsel kontrolü başarısız oldu. Sonra tekrar dener misin?",
    image_search_missing: "Görsel arama için barkod veya ürün adı gerekli.",
    image_search_ready: "Görsel arama sonuçları: {{list}}",
    image_search_empty: "Bu görsel için sonuç bulamadım.",
    image_search_failed: "Görsel arama başarısız oldu. Sonra tekrar dener misin?",
    image_search_billing_required: "OCR için billing gerekli. Önce Google Cloud billing açılmalı.",
    search_missing_query: "Arama sorgusu gerekli. Örnek: web'de ara Trendyol satıcı API.",
    search_ready: "Arama sonuçları:\n{{list}}",
    search_empty: "Bu sorgu için sonuç bulamadım: {{query}}.",
    search_config_missing: "Arama yapılandırması eksik (GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX).",
    search_failed: "Arama başarısız oldu. Sonra tekrar dener misin?",
    search_fallback:
      "Farklı bir sorgu dene veya 'webde ara <sorgu>' yaz. Site filtresi için 'site:developers.trendyol.com' ekleyebilirsin.",
    report_sales_summary:
      "{{scope}} satış özeti ({{period}}): {{orders}} sipariş, {{items}} ürün, ciro {{revenue}}. Ortalama sipariş {{average}}. En çok ciro: {{top}}.",
    report_sales_empty: "Bu dönem için satış verisi bulamadım.",
    report_top_products: "{{scope}} en çok satan ürünler ({{period}}): {{list}}.",
    report_top_empty: "Bu dönem için en çok satan ürün bulamadım.",
    cache_reset_done: "Veriler yenilendi. En güncel dosyalar okunacak.",
    server_error: "Bir şey ters gitti. Tekrar dener misin?",
    pricing_recommend_missing_product: "Hangi ürün için fiyat önerisi istiyorsunuz?",
    pricing_recommend_failed: "Fiyat analizi yapılamadı veya yeterli veri bulunamadı.",
    pricing_recommend_system_error: "Sistem hatası.",
    sync_pending_not_found: "Bekleyen senkronizasyon bulunamadı (5 dk).",
    sync_failed: "Senkronizasyon hatası.",
    sync_cancelled: "Tamam, senkronizasyon iptal edildi.",
    sync_local_only: "Tamam, sadece yerel fiyat güncellendi.",
    sync_completed_count:
      "**Senkronizasyon Tamamlandı:**\n\n{{summary}}\n\n✅ {{success}} | ❌ {{failed}} | ⚠️ {{notConfigured}}",
    product_not_found_simple: "Ürün bulunamadı.",
    product_info_format:
      "📦 **{{name}}**\n🔢 Barkod: {{barcode}}\n💰 Fiyat: {{price}}\n📊 Stok: {{stock}}\n📂 Kategori: {{category}}",
    help_message: `**🤖 Kanka Neler Yapabilirim?**\n\n**🛒 Ürün İşleri:**\n- "Kanka 123 barkodlu ürünün fiyatını 100 yap"\n- "iPhone 13 stoğunu 50 artır bakalım"\n- "Şu ürünü ekleyelim"\n\n**🏢 Pazaryerleri:**\n- "Trendyol'a gönder"\n- "Hepsiburada'yı aç"\n- "Hangilerinde varız?"\n\n**🧠 Yapay Zeka:**\n- "iPhone 13 için fiyat ne olsun?"\n- "Bu resim ne ayak?" (görsel atarsan)\n\n**📊 Durumlar:**\n- "Satışlar nasıl?"\n- "Neler satıyor?"\n- "Stok biten var mı?"\n\n**📦 Toplu İşler:**\n- "Hepsine %10 zam yap"\n- "Stokları eşitle"\n\nDetay lazım olursa sor kanka! 🙌`,
    batch_price_missing_amount: "Lütfen artış/azalış miktarını belirtin (örn: %10 veya 50 TL).",
    batch_price_complete:
      "**Toplu Fiyat Güncelleme Tamamlandı** ({{scope}}):\n\n✅ Güncellendi: {{updated}}\n❌ Başarısız: {{failed}}",
    batch_price_failed: "Toplu fiyat güncelleme başarısız.",
    batch_stock_missing_amount: "Lütfen artış/azalış miktarını belirtin (örn: %10 veya 50 adet).",
    batch_stock_complete:
      "**Toplu Stok Güncelleme Tamamlandı** ({{scope}}):\n\n✅ Güncellendi: {{updated}}\n❌ Başarısız: {{failed}}",
    batch_stock_failed: "Toplu stok güncelleme başarısız.",
    batch_errors: "\n\n**Hatalar:**\n{{list}}",
    gemini_suggestion_failed: "Şu an öneri oluşturamadım kanka, sonra tekrar dener misin?",
    search_results: "Bulunan ürünler ({{count}}):\n{{list}}",
    import_missing_url: "Hangi linki import edeyim kanka? Linki yazman lazım.",
    import_no_provider_connected: "Shopify veya WooCommerce bağlı değil. Önce ayarları yapalım.",
    import_success: "Süper! Ürün taslak olarak eklendi: {{name}}\nDüzenlemek için tıkla: {{link}}",
    import_failed: "Import başarısız oldu kanka :( Hata: {{reason}}",
    search_selection_invalid: "Geçersiz seçim kanka. Lütfen listedeki numaralardan birini yaz (1-10).",
  },
  en: {
    missing_barcode: "Barcode is required. Please share the barcode.",
    missing_amount: "Amount is required. Example: 500",
    missing_amount_or_percent: "Amount or percent required. Example: 50 or 10%",
    missing_both: "Barcode and amount are required. Example: set barcode bee252525 price to 500",
    missing_product_info: "Barcode or product name required. Example: write SEO description for barcode bee252525",
    missing_marketplace: "Marketplace is required. Example: Trendyol or Amazon",
    missing_product_name: "Product name is required. Example: product: Bee 252525 Bracelet",
    missing_price: "Price is required. Example: price: 500",
    missing_stock: "Stock is required. Example: stock: 5",
    missing_batch_request_id: "Batch request id is required. Example: batch request id: 123",
    product_name_not_found: "No product found with that name.",
    product_ambiguous: "Multiple products found: {{list}}. Please send the barcode.",
    percent_not_allowed: "Percent values are not allowed for direct set. Please provide an absolute amount.",
    unknown_intent: "I could not understand the request. Try price, stock, competitor lookup, or sales report.",
    not_found: "No product found for this barcode.",
    product_saved: "Product saved: {{name}} ({{barcode}}).",
    marketplace_listing_saved: "{{marketplace}} listing created: {{barcode}}.",
    marketplace_listing_activated: "{{marketplace}} listing activated: {{barcode}}.",
    marketplace_sync_done: "{{marketplace}} synced to product: {{barcode}}.",
    marketplace_listings_missing: "No marketplace listing found for this barcode.",
    marketplace_price_updated: "{{marketplace}} price updated: {{barcode}}.",
    marketplace_stock_updated: "{{marketplace}} stock updated: {{barcode}}.",
    marketplace_list_summary: "{{marketplace}} has {{count}} listings: {{list}}.",
    marketplace_list_empty: "No listings found for {{marketplace}}.",
    marketplace_configured_list: "Configured marketplaces ({{count}}): {{list}}.",
    marketplace_configured_empty: "No configured marketplaces found.",
    marketplace_status_updated: "{{marketplace}} ({{scope}}) status set to {{status}}.",
    cargo_company_list: "Cargo company details:\n{{list}}",
    marketplace_live_mode_not_configured:
      "Live mode is enabled. Missing config for {{marketplace}}: {{missing}}. Use MARKETPLACE_MODE=mock for mock mode.",
    marketplace_live_mode_not_supported: "Live mode is enabled. {{marketplace}} integration is not wired yet.",
    marketplace_live_mode_all_not_supported:
      "Live mode does not support updating all marketplaces at once. Choose a single marketplace.",
    marketplace_live_mode_list_unavailable: "Listing view is not available in live mode yet.",
    marketplace_live_mode_all_summary:
      "Live mode: {{ok}} succeeded, {{failed}} failed/skipped. Details are in the data payload.",
    marketplace_live_mode_request_queued: "Live mode: {{marketplace}} request queued ({{action}}).",
    marketplace_live_mode_request_failed: "Live mode: {{marketplace}} request failed. {{reason}}",
    marketplace_batch_request_ready: "Batch request result is ready ({{marketplace}}). {{summary}}",
    marketplace_batch_request_failed: "Batch request result failed ({{marketplace}}). {{reason}}",
    marketplace_batch_not_supported: "Batch result is not supported for {{marketplace}}.",
    price_updated: "All set, price updated to {{price}}.",
    stock_updated: "All set, stock updated to {{stock}}.",
    negative_price: "Price cannot go below 0. Please send a valid amount.",
    competitor_empty: "No competitor prices found for this barcode.",
    competitor_list: "Competitor prices: {{list}}. Average: {{average}}. Want me to update yours?",
    content_seo_ready: "SEO description is ready: {{text}}",
    content_social_ready: "Social post is ready: {{text}}",
    content_translation_ready: "Translated title: {{text}}",
    image_upload_required: "No uploaded image found for this barcode. Please upload via /images/process.",
    image_ready: "Image ready: {{url}}",
    image_profile_missing: "Image profile not found. Please check the profile name.",
    image_inspect_info: "Image inspection needs a barcode or product name.",
    image_inspect_ready: "Image looks good. Score: {{score}}.",
    image_inspect_issues: "Image has issues: {{list}}. Score: {{score}}.",
    image_inspect_confirm_fix: 'Say "approve" to auto-fix. Example: approve barcode: {{barcode}} profile: {{profile}}.',
    image_inspect_failed: "Image inspection failed. Please try again later.",
    image_search_missing: "Image search needs a barcode or product name.",
    image_search_ready: "Image search results: {{list}}",
    image_search_empty: "No image results found for this request.",
    image_search_failed: "Image search failed. Please try again later.",
    image_search_billing_required: "Billing is required for OCR. Enable Google Cloud billing first.",
    search_missing_query: "Search query is required. Example: search for Trendyol seller API.",
    search_results: "Found products ({{count}}):\n{{list}}",
    search_ready: "Search results:\n{{list}}",
    search_empty: "No results found for: {{query}}.",
    search_config_missing: "Search configuration is missing (GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX).",
    search_failed: "Search failed. Please try again later.",
    search_fallback:
      "Try a different query or say 'web search <query>'. For site filters, add 'site:developers.trendyol.com'.",
    report_sales_summary:
      "{{scope}} sales summary ({{period}}): {{orders}} orders, {{items}} items, revenue {{revenue}}. Avg order {{average}}. Top channel: {{top}}.",
    report_sales_empty: "No sales data found for this period.",
    report_top_products: "{{scope}} top products ({{period}}): {{list}}.",
    report_top_empty: "No top products found for this period.",
    cache_reset_done: "Data cache reset. Latest files will be loaded.",
    server_error: "Something went wrong. Please try again.",
    pricing_recommend_missing_product: "Which product do you want a price recommendation for?",
    pricing_recommend_failed: "Pricing analysis failed or insufficient data found.",
    pricing_recommend_system_error: "System error.",
    sync_pending_not_found: "No pending sync found (5 min).",
    sync_failed: "Sync failed.",
    sync_cancelled: "Okay, sync cancelled.",
    sync_local_only: "Okay, only local price updated.",
    sync_completed_count: "**Sync Completed:**\n\n{{summary}}\n\n✅ {{success}} | ❌ {{failed}} | ⚠️ {{notConfigured}}",
    product_not_found_simple: "Product not found.",
    product_info_format:
      "📦 **{{name}}**\n🔢 Barcode: {{barcode}}\n💰 Price: {{price}}\n📊 Stock: {{stock}}\n📂 Category: {{category}}",
    help_message: `**🤖 What's Up Buddy? Here's how I can help:**\n\n**📦 Inventory:**\n- "Set price to 100 for barcode 123"\n- "Increase stock by 50"\n- "Who else is selling this?" (Network search)\n\n**🚀 Performance:**\n- "How are my sales?"\n- "Top selling products"\n\n**📝 Creative:**\n- "Write SEO description"\n- "Translate to English"\n\n**I sync everything automatically. What are we doing today? 🔥**`,

    batch_price_missing_amount: "Please specify increase/decrease amount (e.g., 10% or 50 TL).",
    batch_price_complete:
      "**Batch Price Update Complete** ({{scope}}):\n\n✅ Updated: {{updated}}\n❌ Failed: {{failed}}",
    batch_price_failed: "Batch price update failed.",
    batch_stock_missing_amount: "Please specify increase/decrease amount (e.g., 10% or 50 units).",
    batch_stock_complete:
      "**Batch Stock Update Complete** ({{scope}}):\n\n✅ Updated: {{updated}}\n❌ Failed: {{failed}}",
    batch_stock_failed: "Batch stock update failed.",
    batch_errors: "\n\n**Errors:**\n{{list}}",
    gemini_suggestion_failed: "I could not generate suggestions at the moment.",
    import_missing_url: "Which link should I import? You need to provide a URL.",
    import_no_provider_connected: "Shopify or WooCommerce is not connected. Let's configure it first.",
    import_success: "Great! Product drafted: {{name}}\nClick to edit: {{link}}",
    import_failed: "Import failed, buddy :( Error: {{reason}}",
    search_selection_invalid: "Invalid selection. Please choose a valid number from the list (1-10).",
  },
  de: {
    missing_barcode: "Barcode erforderlich. Bitte Barcode eingeben.",
    missing_amount: "Betrag erforderlich. Beispiel: 500",
    missing_amount_or_percent: "Betrag oder Prozentsatz erforderlich. Beispiel: 50 oder 10%",
    missing_both: "Barcode und Betrag erforderlich. Beispiel: setze Preis für Barcode bee252525 auf 500",
    missing_product_info:
      "Barcode oder Produktname erforderlich. Beispiel: schreibe SEO-Beschreibung für Barcode bee252525",
    missing_marketplace: "Marktplatz erforderlich. Beispiel: Trendyol oder Amazon",
    missing_product_name: "Produktname erforderlich. Beispiel: Produkt: Bee 252525 Armband",
    missing_price: "Preis erforderlich. Beispiel: preis: 500",
    missing_stock: "Bestand erforderlich. Beispiel: bestand: 5",
    missing_batch_request_id: "Batch-Anfrage-ID erforderlich. Beispiel: batch request id: 123",
    product_name_not_found: "Kein Produkt mit diesem Namen gefunden.",
    product_ambiguous: "Mehrere Produkte gefunden: {{list}}. Bitte senden Sie den Barcode.",
    percent_not_allowed:
      "Prozentwerte sind für direkte Einstellungen nicht zulässig. Bitte geben Sie einen absoluten Betrag an.",
    unknown_intent:
      "Ich habe die Anfrage nicht verstanden. Versuchen Sie Preis, Bestand, Konkurrenzsuche oder Verkaufsbericht.",
    not_found: "Kein Produkt für diesen Barcode gefunden.",
    product_saved: "Produkt gespeichert: {{name}} ({{barcode}}).",
    marketplace_listing_saved: "{{marketplace}}-Listing erstellt: {{barcode}}.",
    marketplace_listing_activated: "{{marketplace}}-Listing aktiviert: {{barcode}}.",
    marketplace_sync_done: "{{marketplace}} synchronisiert mit Produkt: {{barcode}}.",
    marketplace_listings_missing: "Kein Marktplatz-Listing für diesen Barcode gefunden.",
    marketplace_price_updated: "{{marketplace}}-Preis aktualisiert: {{barcode}}.",
    marketplace_stock_updated: "{{marketplace}}-Bestand aktualisiert: {{barcode}}.",
    marketplace_list_summary: "{{marketplace}} hat {{count}} Listings: {{list}}.",
    marketplace_list_empty: "Keine Listings für {{marketplace}} gefunden.",
    marketplace_configured_list: "Configured marketplaces ({{count}}): {{list}}.",
    marketplace_configured_empty: "No configured marketplaces found.",
    marketplace_status_updated: "Status für {{marketplace}} ({{scope}}) auf {{status}} gesetzt.",
    cargo_company_list: "Frachtunternehmen-Details:\n{{list}}",
    marketplace_live_mode_not_configured:
      "Live-Modus aktiviert. Fehlende Konfiguration für {{marketplace}}: {{missing}}. Verwenden Sie MARKETPLACE_MODE=mock für den Mock-Modus.",
    marketplace_live_mode_not_supported: "Live-Modus aktiviert. {{marketplace}}-Integration ist noch nicht verbunden.",
    marketplace_live_mode_all_not_supported:
      "Live-Modus unterstützt keine gleichzeitige Aktualisierung aller Marktplätze. Wählen Sie einen einzelnen Marktplatz.",
    marketplace_live_mode_list_unavailable: "Listing-Ansicht ist im Live-Modus noch nicht verfügbar.",
    marketplace_live_mode_all_summary:
      "Live-Modus: {{ok}} erfolgreich, {{failed}} fehlgeschlagen/übersprungen. Details befinden sich in den Nutzdaten.",
    marketplace_live_mode_request_queued: "Live-Modus: {{marketplace}}-Anfrage in der Warteschlange ({{action}}).",
    marketplace_live_mode_request_failed: "Live-Modus: {{marketplace}}-Anfrage fehlgeschlagen. {{reason}}",
    marketplace_batch_request_ready: "Batch-Anfrage-Ergebnis ist bereit ({{marketplace}}). {{summary}}",
    marketplace_batch_request_failed: "Batch-Anfrage-Ergebnis fehlgeschlagen ({{marketplace}}). {{reason}}",
    marketplace_batch_not_supported: "Batch-Ergebnis wird für {{marketplace}} nicht unterstützt.",
    price_updated: "Alles erledigt, Preis auf {{price}} aktualisiert.",
    stock_updated: "Alles erledigt, Bestand auf {{stock}} aktualisiert.",
    negative_price: "Preis darf nicht unter 0 liegen. Bitte senden Sie einen gültigen Betrag.",
    competitor_empty: "Keine Konkurrenzpreise für diesen Barcode gefunden.",
    competitor_list: "Konkurrenzpreise: {{list}}. Durchschnitt: {{average}}. Soll ich meinen aktualisieren?",
    content_seo_ready: "SEO-Beschreibung ist bereit: {{text}}",
    content_social_ready: "Social-Media-Beitrag ist bereit: {{text}}",
    content_translation_ready: "Übersetzter Titel: {{text}}",
    image_upload_required: "Kein hochgeladenes Bild für diesen Barcode gefunden. Bitte über /images/process hochladen.",
    image_ready: "Bild bereit: {{url}}",
    image_profile_missing: "Bildprofil nicht gefunden. Bitte überprüfen Sie den Profilnamen.",
    image_inspect_info: "Bildprüfung benötigt einen Barcode oder Produktnamen.",
    image_inspect_ready: "Bild sieht gut aus. Punktzahl: {{score}}.",
    image_inspect_issues: "Bild hat Probleme: {{list}}. Punktzahl: {{score}}.",
    image_inspect_confirm_fix:
      'Sagen Sie "bestätigen" zur automatischen Korrektur. Beispiel: bestätigen Barcode: {{barcode}} Profil: {{profile}}.',
    image_inspect_failed: "Bildprüfung fehlgeschlagen. Bitte versuchen Sie es später erneut.",
    image_search_missing: "Bildsuche benötigt einen Barcode oder Produktnamen.",
    image_search_ready: "Bildsuchergebnisse: {{list}}",
    image_search_empty: "Keine Bildergebnisse für diese Anfrage gefunden.",
    image_search_failed: "Bildsuche fehlgeschlagen. Bitte versuchen Sie es später erneut.",
    image_search_billing_required:
      "Für OCR ist eine Abrechnung erforderlich. Aktivieren Sie zuerst die Google Cloud-Abrechnung.",
    search_missing_query: "Suchanfrage erforderlich. Beispiel: suche nach Trendyol Verkäufer API.",
    search_ready: "Suchergebnisse:\n{{list}}",
    search_empty: "Keine Ergebnisse gefunden für: {{query}}.",
    search_config_missing: "Suchkonfiguration fehlt (GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX).",
    search_failed: "Suche fehlgeschlagen. Bitte versuchen Sie es später erneut.",
    search_fallback:
      "Versuchen Sie eine andere Anfrage oder sagen Sie 'Websuche <Anfrage>'. Für Seitenfilter fügen Sie 'site:developers.trendyol.com' hinzu.",
    report_sales_summary:
      "{{scope}} Verkaufszusammenfassung ({{period}}): {{orders}} Bestellungen, {{items}} Artikel, Umsatz {{revenue}}. Durchschn. Bestellung {{average}}. Top-Kanal: {{top}}.",
    report_sales_empty: "Keine Verkaufsdaten für diesen Zeitraum gefunden.",
    report_top_products: "{{scope}} Top-Produkte ({{period}}): {{list}}.",
    report_top_empty: "Keine Top-Produkte für diesen Zeitraum gefunden.",
    cache_reset_done: "Daten-Cache zurückgesetzt. Neueste Dateien werden geladen.",
    server_error: "Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.",
    pricing_recommend_missing_product: "Für welches Produkt möchten Sie eine Preisempfehlung?",
    pricing_recommend_failed: "Preisanalyse fehlgeschlagen oder unzureichende Daten gefunden.",
    pricing_recommend_system_error: "Systemfehler.",
    sync_pending_not_found: "Keine ausstehende Synchronisierung gefunden (5 Min).",
    sync_failed: "Synchronisierung fehlgeschlagen.",
    sync_cancelled: "Okay, Synchronisierung abgebrochen.",
    sync_local_only: "Okay, nur lokaler Preis aktualisiert.",
    sync_completed_count:
      "**Synchronisierung Abgeschlossen:**\n\n{{summary}}\n\n✅ {{success}} | ❌ {{failed}} | ⚠️ {{notConfigured}}",
    product_not_found_simple: "Produkt nicht gefunden.",
    product_info_format:
      "📦 **{{name}}**\n🔢 Barcode: {{barcode}}\n💰 Preis: {{price}}\n📊 Stok: {{stock}}\n📂 Kategorie: {{category}}",
    help_message: `**🤖 Hilfebefehle:**\n\n**Produktmanagement:**\n- "Setze Preis auf 100 für Barcode 123"\n- "Erhöhe Bestand für iPhone 13 um 50"\n\n**Marktplatz:**\n- "Zu Trendyol hinzufügen"\n\n**KI-Funktionen:**\n- "Empfehle Preis für iPhone 13"`,
    batch_price_missing_amount: "Bitte Erhöhungs-/Verringerungsbetrag angeben (z.B. 10% oder 50 TL).",
    batch_price_complete:
      "**Massenpreisaktualisierung abgeschlossen** ({{scope}}):\n\n✅ Aktualisiert: {{updated}}\n❌ Fehlgeschlagen: {{failed}}",
    batch_price_failed: "Massenpreisaktualisierung fehlgeschlagen.",
    batch_stock_missing_amount: "Bitte Erhöhungs-/Verringerungsbetrag angeben (z.B. 10% oder 50 Stück).",
    batch_stock_complete:
      "**Massenbestandsaktualisierung abgeschlossen** ({{scope}}):\n\n✅ Aktualisiert: {{updated}}\n❌ Fehlgeschlagen: {{failed}}",
    batch_stock_failed: "Massenbestandsaktualisierung fehlgeschlagen.",
    batch_errors: "\n\n**Fehler:**\n{{list}}",
    gemini_suggestion_failed: "Ich konnte im Moment keine Vorschläge generieren.",
    search_results: "Gefundene Produkte ({{count}}):\n{{list}}",
    import_missing_url: "Welchen Link soll ich importieren? Sie müssen eine URL angeben.",
    import_no_provider_connected: "Shopify oder WooCommerce ist nicht verbunden.",
    import_success: "Großartig! Produktentwurf erstellt: {{name}}\nZum Bearbeiten klicken: {{link}}",
    import_failed: "Import fehlgeschlagen: {{reason}}",
    search_selection_invalid: "Ungültige Auswahl. Bitte wählen Sie eine Nummer aus der Liste.",
  },
  fr: {
    missing_barcode: "Code-barres requis. Veuillez partager le code-barres.",
    missing_amount: "Montant requis. Exemple : 500",
    missing_amount_or_percent: "Montant ou pourcentage requis. Exemple : 50 ou 10%",
    missing_both: "Code-barres et montant requis. Exemple : mettre prix code-barres bee252525 à 500",
    missing_product_info:
      "Code-barres ou nom du produit requis. Exemple : écrire description SEO pour code-barres bee252525",
    missing_marketplace: "Place de marché requise. Exemple : Trendyol ou Amazon",
    missing_product_name: "Nom du produit requis. Exemple : produit : Bracelet Bee 252525",
    missing_price: "Prix requis. Exemple : prix : 500",
    missing_stock: "Stock requis. Exemple : stock : 5",
    missing_batch_request_id: "ID de demande par lot requis. Exemple : id de demande par lot : 123",
    product_name_not_found: "Aucun produit trouvé avec ce nom.",
    product_ambiguous: "Plusieurs produits trouvés : {{list}}. Veuillez envoyer le code-barres.",
    percent_not_allowed:
      "Les valeurs en pourcentage ne sont pas autorisées pour le réglage direct. Veuillez fournir un montant absolu.",
    unknown_intent: "Je n'ai pas compris la demande. Essayez prix, stock, recherche concurrent ou rapport de ventes.",
    not_found: "Aucun produit trouvé pour ce code-barres.",
    product_saved: "Produit enregistré : {{name}} ({{barcode}}).",
    marketplace_listing_saved: "Annonce {{marketplace}} créée : {{barcode}}.",
    marketplace_listing_activated: "Annonce {{marketplace}} activée : {{barcode}}.",
    marketplace_sync_done: "{{marketplace}} synchronisé avec le produit : {{barcode}}.",
    marketplace_listings_missing: "Aucune annonce de place de marché trouvée pour ce code-barres.",
    marketplace_price_updated: "Prix {{marketplace}} mis à jour : {{barcode}}.",
    marketplace_stock_updated: "Stock {{marketplace}} mis à jour : {{barcode}}.",
    marketplace_list_summary: "{{marketplace}} a {{count}} annonces : {{list}}.",
    marketplace_list_empty: "Aucune annonce trouvée pour {{marketplace}}.",
    marketplace_configured_list: "Configured marketplaces ({{count}}): {{list}}.",
    marketplace_configured_empty: "No configured marketplaces found.",
    marketplace_status_updated: "Statut de {{marketplace}} ({{scope}}) défini sur {{status}}.",
    cargo_company_list: "Détails de la société de transport :\n{{list}}",
    marketplace_live_mode_not_configured:
      "Mode direct activé. Config manquante pour {{marketplace}} : {{missing}}. Utilisez MARKETPLACE_MODE=mock pour le mode simulation.",
    marketplace_live_mode_not_supported:
      "Mode direct activé. L'intégration de {{marketplace}} n'est pas encore connectée.",
    marketplace_live_mode_all_not_supported:
      "Le mode direct ne prend pas en charge la mise à jour simultanée de toutes les places de marché. Choisissez une seule place de marché.",
    marketplace_live_mode_list_unavailable: "La vue de l'annonce n'est pas encore disponible en mode direct.",
    marketplace_live_mode_all_summary:
      "Mode direct : {{ok}} réussi, {{failed}} échoué/ignoré. Les détails sont dans la charge utile des données.",
    marketplace_live_mode_request_queued: "Mode direct : demande {{marketplace}} mise en file d'attente ({{action}}).",
    marketplace_live_mode_request_failed: "Mode direct : demande {{marketplace}} échouée. {{reason}}",
    marketplace_batch_request_ready: "Le résultat de la demande par lot est prêt ({{marketplace}}). {{summary}}",
    marketplace_batch_request_failed: "La demande par lot a échoué ({{marketplace}}). {{reason}}",
    marketplace_batch_not_supported: "Le résultat par lot n'est pas pris en charge pour {{marketplace}}.",
    price_updated: "Tout est réglé, prix mis à jour à {{price}}.",
    stock_updated: "Tout est réglé, stock mis à jour à {{stock}}.",
    negative_price: "Le prix ne peut pas être inférieur à 0. Veuillez envoyer un montant valide.",
    competitor_empty: "Aucun prix concurrent trouvé pour ce code-barres.",
    competitor_list: "Prix concurrents : {{list}}. Moyenne : {{average}}. Voulez-vous que je mette à jour le vôtre ?",
    content_seo_ready: "La description SEO est prête : {{text}}",
    content_social_ready: "La publication sociale est prête : {{text}}",
    content_translation_ready: "Titre traduit : {{text}}",
    image_upload_required:
      "Aucune image téléchargée trouvée pour ce code-barres. Veuillez télécharger via /images/process.",
    image_ready: "Image prête : {{url}}",
    image_profile_missing: "Profil d'image introuvable. Veuillez vérifier le nom du profil.",
    image_inspect_info: "L'inspection de l'image nécessite un code-barres ou un nom de produit.",
    image_inspect_ready: "L'image semble bonne. Score : {{score}}.",
    image_inspect_issues: "L'image a des problèmes : {{list}}. Score : {{score}}.",
    image_inspect_confirm_fix:
      'Dites "approuver" pour corriger automatiquement. Exemple : approuver code-barres : {{barcode}} profil : {{profile}}.',
    image_inspect_failed: "L'inspection de l'image a échoué. Veuillez réessayer plus tard.",
    image_search_missing: "La recherche d'image nécessite un code-barres ou un nom de produit.",
    image_search_ready: "Résultats de recherche d'image : {{list}}",
    image_search_empty: "Aucun résultat d'image trouvé pour cette demande.",
    image_search_failed: "La recherche d'image a échoué. Veuillez réessayer plus tard.",
    image_search_billing_required:
      "La facturation est requise pour l'OCR. Activez d'abord la facturation Google Cloud.",
    search_missing_query: "Requête de recherche requise. Exemple : rechercher API vendeur Trendyol.",
    search_ready: "Résultats de recherche :\n{{list}}",
    search_empty: "Aucun résultat trouvé pour : {{query}}.",
    search_config_missing: "La configuration de recherche est manquante (GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX).",
    search_failed: "La recherche a échoué. Veuillez réessayer plus tard.",
    search_fallback:
      "Essayez une requête différente ou dites 'recherche web <requête>'. Pour les filtres de site, ajoutez 'site:developers.trendyol.com'.",
    report_sales_summary:
      "Résumé des ventes {{scope}} ({{period}}) : {{orders}} commandes, {{items}} articles, revenus {{revenue}}. Commande moy. {{average}}. Meilleur canal : {{top}}.",
    report_sales_empty: "Aucune donnée de vente trouvée pour cette période.",
    report_top_products: "Meilleurs produits {{scope}} ({{period}}) : {{list}}.",
    report_top_empty: "Aucun meilleur produit trouvé pour cette période.",
    cache_reset_done: "Cache de données réinitialisé. Les fichiers les plus récents seront chargés.",
    server_error: "Un problème est survenu. Veuillez réessayer.",
    pricing_recommend_missing_product: "Pour quel produit souhaitez-vous une recommandation de prix ?",
    pricing_recommend_failed: "L'analyse des prix a échoué ou données insuffisantes.",
    pricing_recommend_system_error: "Erreur système.",
    sync_pending_not_found: "Aucune synchronisation en attente trouvée (5 min).",
    sync_failed: "Échec de la synchronisation.",
    sync_cancelled: "D'accord, synchronisation annulée.",
    sync_local_only: "D'accord, seul le prix local a été mis à jour.",
    sync_completed_count:
      "**Synchronisation terminée :**\n\n{{summary}}\n\n✅ {{success}} | ❌ {{failed}} | ⚠️ {{notConfigured}}",
    product_not_found_simple: "Produit non trouvé.",
    product_info_format:
      "📦 **{{name}}**\n🔢 Code-barres : {{barcode}}\n💰 Prix : {{price}}\n📊 Stock : {{stock}}\n📂 Catégorie : {{category}}",
    help_message: `**?? Commandes d'aide :**\n\n**Gestion des produits :**\n- "Mettre prix à 100 pour code-barres 123"\n- "Augmenter stock iPhone 13 de 50"\n\n**Place de marché :**\n- "Ajouter à Trendyol"\n\n**Fonctionnalités IA :**\n- "Recommander prix pour iPhone 13"`,
    batch_price_missing_amount: "Veuillez spécifier le montant d'augmentation/diminution (ex: 10% ou 50 TL).",
    batch_price_complete:
      "**Mise à Jour de Prix en Lot Terminée** ({{scope}}):\n\n✅ Mis à jour: {{updated}}\n❌ Échoué: {{failed}}",
    batch_price_failed: "Échec de la mise à jour de prix en lot.",
    batch_stock_missing_amount: "Veuillez spécifier le montant d'augmentation/diminution (ex: 10% or 50 unités).",
    batch_stock_complete:
      "**Mise à Jour de Stock en Lot Terminée** ({{scope}}):\n\n✅ Mis à jour: {{updated}}\n❌ Échoué: {{failed}}",
    batch_stock_failed: "Échec de la mise à jour de stock en lot.",
    batch_errors: "\n\n**Erreurs:**\n{{list}}",
    gemini_suggestion_failed: "Je n'ai pas pu générer de suggestions pour le moment.",
    search_results: "Produits trouvés ({{count}}) :\n{{list}}",
    import_missing_url: "Quel lien dois-je importer ? Vous devez fournir une URL.",
    import_no_provider_connected: "Shopify ou WooCommerce n'est pas connecté.",
    import_success: "Génial ! Brouillon de produit créé : {{name}}\nCliquez pour modifier : {{link}}",
    import_failed: "Échec de l'importation : {{reason}}",
    search_selection_invalid: "Sélection invalide. Veuillez choisir un numéro dans la liste.",
  },
  es: {
    missing_barcode: "Se requiere código de barras. Por favor comparte el código de barras.",
    missing_amount: "Se requiere cantidad. Ejemplo: 500",
    missing_amount_or_percent: "Cantidad o porcentaje requerido. Ejemplo: 50 o 10%",
    missing_both: "Código de barras y cantidad requeridos. Ejemplo: establecer precio código de barras bee252525 a 500",
    missing_product_info:
      "Código de barras o nombre del producto requerido. Ejemplo: escribir descripción SEO para código bee252525",
    missing_marketplace: "Mercado requerido. Ejemplo: Trendyol o Amazon",
    missing_product_name: "Nombre del producto requerido. Ejemplo: producto: Pulsera Bee 252525",
    missing_price: "Precio requerido. Ejemplo: precio: 500",
    missing_stock: "Stock requerido. Ejemplo: stock: 5",
    missing_batch_request_id: "ID de solicitud por lotes requerido. Ejemplo: id de solicitud por lotes: 123",
    product_name_not_found: "No se encontró ningún producto con ese nombre.",
    product_ambiguous: "Múltiples productos encontrados: {{list}}. Por favor envía el código de barras.",
    percent_not_allowed:
      "No se permiten valores porcentuales para el ajuste directo. Proporciona una cantidad absoluta.",
    unknown_intent:
      "No pude entender la solicitud. Intenta precio, stock, búsqueda de competencia o informe de ventas.",
    not_found: "No se encontró ningún producto para este código de barras.",
    product_saved: "Producto guardado: {{name}} ({{barcode}}).",
    marketplace_listing_saved: "Listado de {{marketplace}} creado: {{barcode}}.",
    marketplace_listing_activated: "Listado de {{marketplace}} activado: {{barcode}}.",
    marketplace_sync_done: "{{marketplace}} sincronizado con el producto: {{barcode}}.",
    marketplace_listings_missing: "No se encontró listado de mercado para este código de barras.",
    marketplace_price_updated: "Precio de {{marketplace}} actualizado: {{barcode}}.",
    marketplace_stock_updated: "Stock de {{marketplace}} actualizado: {{barcode}}.",
    marketplace_list_summary: "{{marketplace}} tiene {{count}} listados: {{list}}.",
    marketplace_list_empty: "No se encontraron listados para {{marketplace}}.",
    marketplace_configured_list: "Configured marketplaces ({{count}}): {{list}}.",
    marketplace_configured_empty: "No configured marketplaces found.",
    marketplace_status_updated: "Estado de {{marketplace}} ({{scope}}) establecido en {{status}}.",
    cargo_company_list: "Detalles de la empresa de carga:\n{{list}}",
    marketplace_live_mode_not_configured:
      "Modo en vivo habilitado. Falta configuración para {{marketplace}}: {{missing}}. Usa MARKETPLACE_MODE=mock para modo simulacro.",
    marketplace_live_mode_not_supported:
      "Modo en vivo habilitado. La integración de {{marketplace}} aún no está conectada.",
    marketplace_live_mode_all_not_supported:
      "El modo en vivo no admite la actualización de todos los mercados a la vez. Elige un solo mercado.",
    marketplace_live_mode_list_unavailable: "La vista de listado aún no está disponible en modo en vivo.",
    marketplace_live_mode_all_summary:
      "Modo en vivo: {{ok}} exitoso, {{failed}} fallido/omitido. Los detalles están en la carga útil de datos.",
    marketplace_live_mode_request_queued: "Modo en vivo: solicitud de {{marketplace}} en cola ({{action}}).",
    marketplace_live_mode_request_failed: "Modo en vivo: solicitud de {{marketplace}} fallida. {{reason}}",
    marketplace_batch_request_ready: "El resultado de la solicitud por lotes está listo ({{marketplace}}). {{summary}}",
    marketplace_batch_request_failed: "La solicitud por lotes falló ({{marketplace}}). {{reason}}",
    marketplace_batch_not_supported: "El resultado por lotes no es compatible con {{marketplace}}.",
    price_updated: "Todo listo, precio actualizado a {{price}}.",
    stock_updated: "Todo listo, stock actualizado a {{stock}}.",
    negative_price: "El precio no puede ser inferior a 0. Por favor envía una cantidad válida.",
    competitor_empty: "No se encontraron precios de la competencia para este código de barras.",
    competitor_list: "Precios de la competencia: {{list}}. Promedio: {{average}}. ¿Quieres que actualice el tuyo?",
    content_seo_ready: "La descripción SEO está lista: {{text}}",
    content_social_ready: "La publicación social está lista: {{text}}",
    content_translation_ready: "Título traducido: {{text}}",
    image_upload_required: "No se encontró imagen subida para este código de barras. Sube vía /images/process.",
    image_ready: "Imagen lista: {{url}}",
    image_profile_missing: "Perfil de imagen no encontrado. Por favor verifica el nombre del perfil.",
    image_inspect_info: "La inspección de imagen necesita un código de barras o nombre de producto.",
    image_inspect_ready: "La imagen se ve bien. Puntuación: {{score}}.",
    image_inspect_issues: "La imagen tiene problemas: {{list}}. Puntuación: {{score}}.",
    image_inspect_confirm_fix:
      'Di "aprobar" para corrección automática. Ejemplo: aprobar código de barras: {{barcode}} perfil: {{profile}}.',
    image_inspect_failed: "La inspección de imagen falló. Por favor inténtalo de nuevo más tarde.",
    image_search_missing: "La búsqueda de imagen necesita un código de barras o nombre de producto.",
    image_search_ready: "Resultados de búsqueda de imagen: {{list}}",
    image_search_empty: "No se encontraron resultados de imagen para esta solicitud.",
    image_search_failed: "La búsqueda de imagen falló. Por favor inténtalo de nuevo más tarde.",
    image_search_billing_required: "Se requiere facturación para OCR. Habilita la facturación de Google Cloud primero.",
    search_missing_query: "Consulta de búsqueda requerida. Ejemplo: buscar API de vendedor Trendyol.",
    search_ready: "Resultados de búsqueda:\n{{list}}",
    search_empty: "No se encontraron resultados para: {{query}}.",
    search_config_missing: "Falta configuración de búsqueda (GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX).",
    search_failed: "La búsqueda falló. Por favor inténtalo de nuevo más tarde.",
    search_fallback:
      "Intenta una consulta diferente o di 'búsqueda web <consulta>'. Para filtros de sitio, agrega 'site:developers.trendyol.com'.",
    report_sales_summary:
      "Resumen de ventas {{scope}} ({{period}}): {{orders}} pedidos, {{items}} artículos, ingresos {{revenue}}. Pedido prom. {{average}}. Mejor canal: {{top}}.",
    report_sales_empty: "No se encontraron datos de ventas para este período.",
    report_top_products: "Productos principales {{scope}} ({{period}}): {{list}}.",
    report_top_empty: "No se encontraron productos principales para este período.",
    cache_reset_done: "Caché de datos restablecido. Se cargarán los archivos más recientes.",
    server_error: "Algo salió mal. Por favor inténtalo de nuevo.",
    pricing_recommend_missing_product: "¿Para qué producto quieres una recomendación de precio?",
    pricing_recommend_failed: "Análisis de precios fallido o datos insuficientes.",
    pricing_recommend_system_error: "Error del sistema.",
    sync_pending_not_found: "No se encontró sincronización pendiente (5 min).",
    sync_failed: "Sincronización fallida.",
    sync_cancelled: "Vale, sincronización cancelada.",
    sync_local_only: "Vale, solo precio local actualizado.",
    sync_completed_count:
      "**Sincronización Completada:**\n\n{{summary}}\n\n✅ {{success}} | ❌ {{failed}} | ⚠️ {{notConfigured}}",
    product_not_found_simple: "Producto no encontrado.",
    product_info_format:
      "📦 **{{name}}**\n🔢 Código de barras: {{barcode}}\n💰 Precio: {{price}}\n📊 Stock: {{stock}}\n📂 Categoría: {{category}}",
    help_message: `**🤖 ¿Qué pasa, amigo? Así es como puedo ayudarte:**\n\n**📦 Inventario:**\n- "Pon el precio a 100 para el código 123"\n- "Sube el stock en 50"\n- "¿Quién más vende esto?" (Búsqueda en red)\n\n**🚀 Rendimiento:**\n- "¿Cómo van las ventas?"\n- "Productos más vendidos"\n\n**📝 Creativo:**\n- "Escribe descripción SEO"\n- "Traducir al inglés"\n\n**Sincronizo todo automáticamente. ¿Qué hacemos hoy? 🔥**`,


    batch_price_missing_amount: "Por favor especifica la cantidad de aumento/disminución (ej: 10% o 50 TL).",
    batch_price_complete:
      "**Actualización de Precio por Lotes Completa** ({{scope}}):\n\n✅ Actualizado: {{updated}}\n❌ Fallido: {{failed}}",
    batch_price_failed: "Actualización de precio por lotes fallida.",
    batch_stock_missing_amount: "Por favor especifica la cantidad de aumento/disminución (ej: 10% o 50 unidades).",
    batch_stock_complete:
      "**Actualización de Stock por Lotes Completa** ({{scope}}):\n\n✅ Actualizado: {{updated}}\n❌ Fallido: {{failed}}",
    batch_stock_failed: "Actualización de stock por lotes fallida.",
    batch_errors: "\n\n**Errores:**\n{{list}}",
    gemini_suggestion_failed: "No pude generar sugerencias en este momento.",
    search_results: "Productos encontrados ({{count}}):\n{{list}}",
    import_missing_url: "¿Qué enlace debo importar? Debes proporcionar una URL.",
    import_no_provider_connected: "Shopify o WooCommerce no está conectado.",
    import_success: "¡Genial! Borrador de producto creado: {{name}}\nClic para editar: {{link}}",
    import_failed: "Importación fallida: {{reason}}",
    search_selection_invalid: "Selección inválida. Por favor elige un número de la lista.",
  },
  ar: {
    missing_barcode: "الباركود مطلوب. هل يمكنك كتابة الباركود؟",
    missing_amount: "الكمية مطلوبة. مثال: 500",
    missing_amount_or_percent: "المبلغ أو النسبة المئوية مطلوبة. مثال: 50 أو 10%",
    missing_both: "الباركود والكمية مطلوبان. مثال: اجعل سعر المنتج ذو الباركود bee252525 هو 500 ريال",
    missing_product_info: "الباركود أو اسم المنتج مطلوب. مثال: اكتب وصف سيو للمنتج ذو الباركود bee252525",
    missing_marketplace: "أي سوق؟ مثال: ترينديول أو أمازون",
    missing_product_name: "اسم المنتج مطلوب. مثال: المنتج: سوار Bee 252525",
    missing_price: "السعر مطلوب. مثال: السعر: 500",
    missing_stock: "المخزون مطلوب. مثال: المخزون: 5",
    missing_batch_request_id: "رقم طلب الدفعة مطلوب. مثال: رقم طلب الدفعة: 123",
    product_name_not_found: "لم أجد أي سجل يطابق اسم هذا المنتج.",
    product_ambiguous: "وجدت أكثر من منتج: {{list}}. يرجى المتابعة بالباركود.",
    percent_not_allowed: "لا يمكنني الضبط بالنسبة المئوية مباشرة. هل يمكنك إدخال مبلغ محدد؟",
    unknown_intent: "لم أفهم ما تريد القيام به. يمكنك تجربة السعر، المخزون، سعر المنافس أو تقرير المبيعات.",
    not_found: "لم أجد منتجاً بهذا الباركود يا صديقي، هل أنت متأكد؟ 🤔",
    product_saved: "تم الحفظ، تم تسجيل المنتج: {{name}} ({{barcode}}) ✅",
    marketplace_listing_saved: "تم إنشاء قائمة {{marketplace}}: {{barcode}} 📦",
    marketplace_listing_activated: "المنتج الآن مباشر على {{marketplace}}: {{barcode}} 🚀",
    marketplace_sync_done: "تم مزامنة السعر/المخزون على {{marketplace}} يا صديقي: {{barcode}} 🔄",
    marketplace_listings_missing: "لم يتم العثور على قائمة سوق لهذا الباركود.",
    marketplace_price_updated: "تم تحديث السعر على {{marketplace}}: {{barcode}}.",
    marketplace_stock_updated: "تم تحديث المخزون على {{marketplace}}: {{barcode}}.",
    marketplace_list_summary: "وجدت {{count}} قائمة لـ {{marketplace}}: {{list}}.",
    marketplace_list_empty: "لم يتم العثور على قوائم لـ {{marketplace}}.",
    marketplace_configured_list: "الأسواق الجاهزة ({{count}}): {{list}}.",
    marketplace_configured_empty: "لم يتم العثور على أسواق جاهزة.",
    marketplace_status_updated: "تم تغيير حالة {{marketplace}} ({{scope}}) إلى {{status}}.",
    cargo_company_list: "معلومات شركات الشحن:\n{{list}}",
    marketplace_live_mode_not_configured:
      "الوضع المباشر مفعل. الإعدادات المفقودة لـ {{marketplace}}: {{missing}}.",
    marketplace_live_mode_not_supported: "الوضع المباشر مفعل. تكامل {{marketplace}} غير متصل بعد.",
    marketplace_live_mode_all_not_supported:
      "لا يمكن تحديث جميع الأسواق معاً في الوضع المباشر. يرجى اختيار سوق واحد.",
    marketplace_live_mode_list_unavailable: "عرض القائمة غير مدعوم في الوضع المباشر بعد.",
    marketplace_live_mode_all_summary:
      "الوضع المباشر: {{ok}} نجاح، {{failed}} فشل/تخطي. التفاصيل في حقل البيانات.",
    marketplace_live_mode_request_queued: "الوضع المباشر: تم إرسال طلب {{marketplace}} ({{action}}).",
    marketplace_live_mode_request_failed: "الوضع المباشر: فشل طلب {{marketplace}}. {{reason}}",
    marketplace_batch_request_ready: "نتيجة العملية الجماعية جاهزة ({{marketplace}}). {{summary}}",
    marketplace_batch_request_failed: "لم يتم استلام نتيجة العملية الجماعية ({{marketplace}}). {{reason}}",
    marketplace_batch_not_supported: "نتائج العمليات الجماعية غير مدعومة في هذا السوق: {{marketplace}}.",
    price_updated: "تم الأمر! السعر أصبح {{price}}. 💰",
    stock_updated: "تم، المخزون الآن {{stock}}. 📦",
    negative_price: "لا يمكن أن يكون السعر أقل من 0. يرجى إرسال مبلغ صالح.",
    competitor_empty: "لم أجد أسعار منافسين لهذا الباركود.",
    competitor_list: "أسعار المنافسين كالتالي يا صديقي: {{list}}. المتوسط: {{average}}. هل نحدث السعر؟ ⚡",
    content_seo_ready: "وصف سيو جاهز: {{text}}",
    content_social_ready: "منشور التواصل الاجتماعي جاهز: {{text}}",
    content_translation_ready: "العنوان المترجم: {{text}}",
    image_upload_required: "لم أجد صورة مرفوعة لهذا الباركود. يرجى رفع صورة أولاً.",
    image_ready: "الصورة جاهزة: {{url}}",
    image_profile_missing: "لم يتم العثور على ملف تعريف الصورة.",
    image_inspect_info: "الباركود أو اسم المنتج مطلوب لفحص الصورة.",
    image_inspect_ready: "الصورة تبدو جيدة. التقييم: {{score}}.",
    image_inspect_issues: "الصورة بها مشاكل: {{list}}. التقييم: {{score}}.",
    image_inspect_confirm_fix:
      'قل "موافقة" للإصلاح التلقائي. مثال: موافقة باركود: {{barcode}} ملف: {{profile}}.',
    image_inspect_failed: "فشل فحص الصورة. يرجى المحاولة لاحقاً.",
    image_search_missing: "الباركود أو اسم المنتج مطلوب للبحث عن الصور.",
    image_search_ready: "نتائج البحث عن الصور: {{list}}",
    image_search_empty: "لم يتم العثور على نتائج صور لهذا الطلب.",
    image_search_failed: "فشل البحث عن الصور. يرجى المحاولة لاحقاً.",
    image_search_billing_required: "الفواتير مطلوبة لـ OCR. يرجى تفعيل فواتير Google Cloud أولاً.",
    search_missing_query: "مطلوب استعلام للبحث. مثال: ابحث عن واجهة برمجة تطبيقات بائع ترينديول.",
    search_ready: "نتائج البحث:\n{{list}}",
    search_empty: "لم يتم العثور على نتائج لـ: {{query}}.",
    search_config_missing: "إعدادات البحث مفقودة (GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX).",
    search_failed: "فشل البحث. يرجى المحاولة لاحقاً.",
    search_fallback:
      "حاول باستعلام مختلف أو قل 'بحث ويب <استعلام>'. للفلاتر، أضف 'site:developers.trendyol.com'.",
    report_sales_summary:
      "ملخص المبيعات {{scope}} ({{period}}): {{orders}} طلبات، {{items}} قطع، الإيرادات {{revenue}}. متوسط الطلب {{average}}. أفضل قناة: {{top}}.",
    report_sales_empty: "لم يتم العثور على بيانات مبيعات لهذه الفترة.",
    report_top_products: "أهم المنتجات {{scope}} ({{period}}): {{list}}.",
    report_top_empty: "لم يتم العثور على أهم المنتجات لهذه الفترة.",
    cache_reset_done: "تم إعادة ضبط ذاكرة التخزين المؤقت. سيتم تحميل أحدث الملفات.",
    server_error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    pricing_recommend_missing_product: "لأي منتج تريد توصية سعر؟",
    pricing_recommend_failed: "فشل تحليل السعر أو البيانات غير كافية.",
    pricing_recommend_system_error: "خطأ في النظام.",
    sync_pending_not_found: "لم يتم العثور على مزامنة معلقة (5 دقائق).",
    sync_failed: "فشلت المزامنة.",
    sync_cancelled: "حسناً، تم إلغاء المزامنة.",
    sync_local_only: "حسناً، تم تحديث السعر المحلي فقط.",
    sync_completed_count:
      "**اكتملت المزامنة:**\n\n{{summary}}\n\n✅ {{success}} | ❌ {{failed}} | ⚠️ {{notConfigured}}",
    product_not_found_simple: "المنتج غير موجود.",
    product_info_format:
      "📦 **{{name}}**\n🔢 الباركود: {{barcode}}\n💰 السعر: {{price}}\n📊 المخزون: {{stock}}\n📂 الفئة: {{category}}",
    help_message: `**🤖 أهلاً يا صديقي! إليك كيف يمكنني مساعدتك:**\n\n**📦 المنتجات:**\n- "اجعل السعر 100 للباركود 123"\n- "زيادة المخزون بمقدار 50"\n- "من لديه هذا المنتج؟" (البحث في الشبكة)\n\n**🚀 مبيعات:**\n- "كيف هي المبيعات؟"\n- "أهم المنتجات مبيعاً"\n\n**📝 ذكاء اصطناعي:**\n- "اكتب وصف سيو"\n- "ترجم إلى العربية"\n\n**أنا أقوم بمزامنة كل شيء تلقائياً. ماذا سنفعل اليوم؟ 🔥**`,

    batch_price_missing_amount: "يرجى تحديد مقدار الزيادة/النقص (مثال: 10% أو 50 ريال).",
    batch_price_complete:
      "**اكتمل تحديث السعر الجماعي** ({{scope}}):\n\n✅ تم التحديث: {{updated}}\n❌ فشل: {{failed}}",
    batch_price_failed: "فشل تحديث السعر الجماعي.",
    batch_stock_missing_amount: "يرجى تحديد مقدار الزيادة/النقص (مثال: 10% أو 50 قطعة).",
    batch_stock_complete:
      "**اكتمل تحديث المخزون الجماعي** ({{scope}}):\n\n✅ تم التحديث: {{updated}}\n❌ فشل: {{failed}}",
    batch_stock_failed: "فشل تحديث المخزون الجماعي.",
    batch_errors: "\n\n**الأخطاء:**\n{{list}}",
    gemini_suggestion_failed: "لم أتمكن من إنشاء اقتراحات في الوقت الحالي.",
    search_results: "المنتجات الموجودة ({{count}}):\n{{list}}",
    import_missing_url: "أي رابط يجب أن أستورده؟",
    import_no_provider_connected: "Shopify أو WooCommerce غير متصل.",
    import_success: "رائع! تم إنشاء مسودة المنتج: {{name}}\nانقر للتحرير: {{link}}",
    import_failed: "فشل الاستيراد: {{reason}}",
    search_selection_invalid: "تحديد غير صالح. يرجى اختيار رقم من القائمة.",
  },
};


export function t(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}) {
  const template = messages[locale][key] ?? messages.en[key];
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? ""));
}

export function formatCurrency(amount: number | string, currency: string) {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const value = safe.toFixed(2);
  if (currency === "TRY") {
    return `${value} TL`;
  }
  return `${value} ${currency}`;
}
