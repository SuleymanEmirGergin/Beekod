# API Contract

## Envelopes

### Success
```json
{
  "data": { ... },
  "traceId": "req-1234567890"
}
```
Header: `x-trace-id: req-1234567890`

### Error
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": "Dev details (if enabled)"
  },
  "traceId": "req-1234567890"
}
```

## Endpoints

### 1. Search Products
`GET /api/search?q=query`

**Response:** `SearchResponse`
```json
{
  "data": [
    {
      "marketplace": "Trendyol",
      "title": "Product Title",
      "price": 100,
      "currency": "TRY",
      "url": "...",
      "imageUrl": "...",
      "stock": 10
    }
  ],
  "traceId": "..."
}
```

### 2. Import Preview
`POST /api/product-import/preview`

**Request:**
```json
{ "url": "https://..." }
```

**Response:** `ImportPreviewResponse`
```json
{
  "data": {
    "title": "...",
    "categorySuggestion": { "id": "...", "name": "...", "confidence": 0.9 },
    "attributes": { "Color": "Red" },
    "needsManualMapping": false
  },
  "traceId": "..."
}
```

### 3. Import Submit
`POST /api/product-import/import`

**Request:** `ImportSubmitRequest`
```json
{
  "sourceUrl": "...",
  "providerId": "shopify",
  "title": "Override Title",
  "category": "Override Category",
  "attributes": { "Color": "Blue" }
}
```

**Response:** `ImportSubmitResponse`
```json
{
  "data": {
    "product": { "localId": "...", "name": "...", "provider": "shopify" },
    "editUrl": "..."
  },
  "traceId": "..."
}
```

### 4. Bulk Update (Inventory)
`POST /api/inventory/bulk-update`

**Request:** `ProductUpdateRequest`
```json
{
  "barcode": "123",
  "price": 150,
  "version": 5 // REQUIRED
}
```

**Status Codes:**
- 200: Enqueued
- 409: Version Conflict (`error.code: VERSION_CONFLICT`)
- 400: Validation Error
