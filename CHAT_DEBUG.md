# 🔍 Chat Debug Rehberi

Bu dosyayı kullanarak chatbot'un neden cevap vermediğini adım adım bulabilirsin.

## ✅ Mevcut Durum Analizi

### 1. API Configuration
**Dosya:** `BeekodFrontend/src/services/api.ts`
```typescript
baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api'
```

**Frontend istek gönderir:**
```
POST http://localhost:3000/api/chat
```

### 2. Backend Route
**Dosya:** `src/server.ts`
```typescript
app.use("/api/chat", chatRouter);
```

**Backend dinler:**
```
POST /api/chat
```

✅ **URL'ler uyumlu!** Frontend → `/api/chat` → Backend `/api/chat`

---

## 🧪 Debug Adımları

### Adım 1: Network İsteğini Kontrol Et

1. Tarayıcıda **F12** → **Network** tab
2. Chat'e bir mesaj gönder
3. `/chat` veya `/api/chat` isteği var mı?

**Sonuçlar:**

| Durum | Anlamı | Çözüm |
|-------|--------|-------|
| ✅ **200 OK** | Backend cevap veriyor | Adım 2'ye geç |
| ❌ **404 Not Found** | Endpoint yok | Backend route kontrol et |
| ❌ **500 Error** | Backend hata veriyor | Backend console'a bak |
| ❌ **Timeout** | Backend yanıt vermiyor | Backend çalışıyor mu? |
| ❌ **Hiç istek yok** | Frontend çağırmıyor | Adım 3'e geç |

### Adım 2: Backend Response Kontrol Et

Network tab'de `/chat` isteğine tıkla → **Response** tab

**Beklenen:**
```json
{
  "success": true,
  "reply": "Merhaba! Size nasıl yardımcı olabilirim?",
  "data": {},
  "meta": { "locale": "tr" }
}
```

**Eğer farklıysa:**
- `success` var mı?
- `reply` var mı?
- Format doğru mu?

### Adım 3: Console Logları Kontrol Et

**Frontend Console (F12 → Console):**
```
Chat API Response: { success: true, reply: "...", data: {} }
```

**Eğer bu log yoksa:**
- `sendMessage` çağrılmıyor
- `handleSendMessage` çalışmıyor
- Button onClick bozuk

**Eğer log varsa ama mesaj görünmüyorsa:**
- UI render sorunu
- State güncellenmiyor

### Adım 4: Backend Console Kontrol Et

Backend terminalinde şunu görmeli:
```
CHAT REQUEST: { message: "...", action: "...", historyLength: ... }
```

**Eğer bu log yoksa:**
- Backend `/chat` endpoint'ine istek gelmiyor
- Route yanlış configure edilmiş

---

## 🔥 Hızlı Test (30 saniye)

### Test 1: Backend Ping
Backend'de `chatRoutes.ts` dosyasının en başına ekle:

```typescript
router.post("/chat", async (req, res) => {
  console.log("🔥 CHAT ENDPOINT HIT!");
  return res.json({
    success: true,
    reply: "BACKEND ÇALIŞIYOR ✅",
    data: null
  });
});
```

Frontend'ten mesaj gönder.

**Sonuç:**
- ✅ "BACKEND ÇALIŞIYOR" görünüyor → AI/handler sorunu
- ❌ Görünmüyor → Network/endpoint sorunu

### Test 2: Frontend Ping
`ChatWidget.tsx` içinde `handleSendMessage` fonksiyonunun başına ekle:

```typescript
console.log("🔥 SEND MESSAGE CALLED:", textToSend);
```

Chat'e mesaj gönder.

**Sonuç:**
- ✅ Log görünüyor → sendMessage çalışıyor
- ❌ Log yok → Button onClick çalışmıyor

### Test 3: UI Render Test
`handleSendMessage` içinde API çağrısından önce ekle:

```typescript
setChatHistory(prev => [...prev, {
  role: 'ai',
  message: '🔥 UI TEST MESAJI'
}]);
setIsLoading(false);
return; // API çağrısını atla
```

**Sonuç:**
- ✅ "UI TEST MESAJI" görünüyor → UI çalışıyor, API sorunu
- ❌ Görünmüyor → UI render sorunu

---

## 🎯 Olası Sorunlar ve Çözümler

### Sorun 1: CORS Hatası
**Belirti:** Network'te `CORS policy` hatası

**Çözüm:** Backend `server.ts`:
```typescript
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
```

### Sorun 2: Backend Çalışmıyor
**Belirti:** `ERR_CONNECTION_REFUSED`

**Çözüm:**
```bash
cd Beekod
npm run dev
```

Backend `http://localhost:3000` adresinde çalışmalı.

### Sorun 3: Frontend Çalışmıyor
**Belirti:** Sayfa açılmıyor

**Çözüm:**
```bash
cd BeekodFrontend
npm run dev
```

Frontend `http://localhost:5173` adresinde çalışmalı.

### Sorun 4: Empty Reply
**Belirti:** Backend 200 döndürüyor ama `reply: ""`

**Çözüm:** Backend'de AI handler kontrol et:
```typescript
if (!reply || reply.trim() === "") {
  reply = "Üzgünüm, cevap üretemedim.";
}
```

### Sorun 5: History Parsing Error
**Belirti:** Backend 500 hatası, `history.map is not a function`

**Çözüm:** Backend'de:
```typescript
let history = [];
try {
  if (typeof req.body.history === "string") {
    history = JSON.parse(req.body.history);
  } else if (Array.isArray(req.body.history)) {
    history = req.body.history;
  }
} catch (e) {
  console.error("History parse failed:", e);
}
```

---

## 📊 Checklist

- [ ] Backend çalışıyor (`npm run dev`)
- [ ] Frontend çalışıyor (`npm run dev`)
- [ ] Network'te `/api/chat` isteği görünüyor
- [ ] Response 200 OK
- [ ] Response içinde `success: true`
- [ ] Response içinde `reply` var
- [ ] Frontend console'da "Chat API Response" logu var
- [ ] UI'da mesaj görünüyor

---

**Hangi adımda takıldın? Söyle, birlikte çözelim! 🚀**
