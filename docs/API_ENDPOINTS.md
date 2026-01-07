# Beekod API Endpoint Dokümantasyonu

Bu doküman Faz 9-11'de eklenen tüm yeni API endpoint'lerini içerir.

## Faz 9: AI & Repricer

### AI Ürün Optimizasyonu
```http
POST /api/marketplace/ai/optimize-content
Authorization: Bearer {ADMIN_KEY}
Content-Type: application/json

Request Body:
{
  "title": "Ürün Başlığı",
  "description": "Ürün açıklaması"
}

Response:
{
  "optimizedTitle": "AI ile optimize edilmiş başlık",
  "optimizedDescription": "AI ile optimize edilmiş açıklama",
  "keywords": ["anahtar", "kelime", "listesi"]
}
```

### Repricer Konfigürasyonu
```http
POST /api/marketplace/repricer/config
Authorization: Bearer {ADMIN_KEY}
Content-Type: application/json

Request Body:
{
  "barcode": "1234567890",
  "minPrice": 100,
  "maxPrice": 500,
  "targetPosition": "lowest" | "competitive"
}

Response:
{
  "success": true
}
```

### Repricer Manuel Tetikleme
```http
POST /api/marketplace/repricer/run
Authorization: Bearer {ADMIN_KEY}

Response:
{
  "success": true,
  "message": "Repricer cycle triggered successfully"
}
```

### Repricer Konfigürasyon Getirme
```http
GET /api/marketplace/repricer/config/:barcode
Authorization: Bearer {ADMIN_KEY}

Response:
{
  "barcode": "1234567890",
  "minPrice": 100,
  "maxPrice": 500,
  "targetPosition": "lowest"
}
```

---

## Faz 10: Kargo & Bildirimler

### Kargo Barkodu Oluşturma
```http
POST /api/orders/:id/shipping-label
Authorization: Bearer {ADMIN_KEY}
Content-Type: application/json

Request Body:
{
  "provider": "Yurtici" | "Aras" | "MNG"
}

Response:
{
  "success": true,
  "order": { /* Updated order object */ },
  "shipping": {
    "provider": "Yurtici",
    "trackingNumber": "YU123456789",
    "labelUrl": "https://api.beekod.com/v1/shipping/labels/YU123456789.pdf"
  }
}
```

### Bildirim Ayarları Kaydetme
```http
POST /api/notifications/settings
Authorization: Bearer {ADMIN_KEY}
Content-Type: application/json

Request Body:
{
  "channel": "email" | "webhook" | "in_app",
  "eventType": "low_stock" | "new_order" | "shipping_update",
  "enabled": true,
  "config": {
    "to": "admin@beekod.com" // for email
    // or
    "url": "https://webhook.site/..." // for webhook
  }
}

Response:
{
  "success": true
}
```

---

## Faz 11: İleri Seviye Analitik

### En Karlı Ürünler
```http
GET /api/analytics/top-profitable?limit=10&days=30
Authorization: Bearer {ADMIN_KEY}

Response:
{
  "status": "ok",
  "products": [
    {
      "barcode": "1234567890",
      "name": "Ürün Adı",
      "category": "Kategori",
      "totalSold": 150,
      "totalRevenue": 15000,
      "totalCost": 9000,
      "totalProfit": 6000,
      "profitMargin": 40.0
    }
  ]
}
```

### Kar Özeti
```http
GET /api/analytics/profit-summary?days=30
Authorization: Bearer {ADMIN_KEY}

Response:
{
  "status": "ok",
  "summary": {
    "totalRevenue": 245600,
    "totalCost": 168400,
    "totalProfit": 77200,
    "profitMargin": 31.4
  }
}
```

### Satış Trendleri
```http
GET /api/analytics/sales-trends?days=30
Authorization: Bearer {ADMIN_KEY}

Response:
{
  "status": "ok",
  "trends": [
    {
      "date": "2026-01-01",
      "orderCount": 45,
      "revenue": 12500
    }
  ]
}
```

### En Çok Satanlar
```http
GET /api/analytics/top-sellers?limit=10
Authorization: Bearer {ADMIN_KEY}

Response:
{
  "status": "ok",
  "products": [
    {
      "barcode": "1234567890",
      "name": "Ürün Adı",
      "totalSales": 150,
      "revenue": 15000,
      "stock": 50
    }
  ]
}
```

### Pazaryeri Performansı
```http
GET /api/analytics/marketplace-performance
Authorization: Bearer {ADMIN_KEY}

Response:
{
  "status": "ok",
  "performance": [
    {
      "marketplace": "Trendyol",
      "orderCount": 120,
      "revenue": 45000
    }
  ]
}
```

---

## Genel Notlar

### Authentication
Tüm endpoint'ler `requireAdminKey` middleware'i ile korunmaktadır. İsteklerde `Authorization: Bearer {ADMIN_KEY}` header'ı gönderilmelidir.

### Error Handling
Hata durumlarında standart format:
```json
{
  "error": "error_code",
  "message": "Hata açıklaması (opsiyonel)"
}
```

### Rate Limiting
API endpoint'leri rate limiting'e tabidir. Detaylar için `rate_limits` tablosuna bakınız.

---

## Test Örnekleri

### cURL ile Test
```bash
# AI Optimizasyon
curl -X POST http://localhost:3000/api/marketplace/ai/optimize-content \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Ürün","description":"Test açıklama"}'

# Kargo Barkodu
curl -X POST http://localhost:3000/api/orders/ORDER123/shipping-label \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider":"Yurtici"}'

# Kar Özeti
curl -X GET "http://localhost:3000/api/analytics/profit-summary?days=30" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY"
```
