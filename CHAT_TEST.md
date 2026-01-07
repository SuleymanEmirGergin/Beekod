# Chat Endpoint Test Script

## Test 1: Basit Mesaj (Windows PowerShell)
```powershell
$body = @{
    message = "Merhaba"
    sessionId = "test-session-123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/chat" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"; "x-admin-key"="Threem123"} `
    -Body $body
```

## Test 2: Basit Mesaj (curl - Git Bash veya WSL)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "x-admin-key: Threem123" \
  -d '{"message":"Merhaba","sessionId":"test-123"}'
```

## Test 3: Action ile (TOP_SELLERS)
```powershell
$body = @{
    action = "TOP_SELLERS"
    sessionId = "test-session-123"
    limit = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/chat" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"; "x-admin-key"="Threem123"} `
    -Body $body
```

## Test 4: History ile
```powershell
$body = @{
    message = "Devam et"
    sessionId = "test-session-123"
    history = @(
        @{ role = "user"; message = "Merhaba" },
        @{ role = "ai"; reply = "Merhaba! Nasıl yardımcı olabilirim?" }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/chat" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"; "x-admin-key"="Threem123"} `
    -Body $body
```

## Beklenen Yanıt Formatı
```json
{
  "success": true,
  "reply": "Merhaba! Size nasıl yardımcı olabilirim?",
  "data": {},
  "meta": {
    "locale": "tr"
  }
}
```

## DEBUG_FAKE_AI Modunu Açmak
`src/routes/chatRoutes.ts` dosyasında:
```typescript
const DEBUG_FAKE_AI = true; // false yerine true yap
```

Bu modda backend gerçek AI çağrısı yapmadan test yanıtı döndürür.

## Hata Durumunda Beklenen Yanıt
```json
{
  "success": false,
  "reply": "Hata mesajı",
  "data": null,
  "error": "ERROR_CODE"
}
```
