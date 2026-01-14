# Beekod Workers - Asenkron İşlem Mimarisi

Bu klasör, ağır AI işlemlerini asenkron olarak işleyen worker'ları içerir.

## 🏗️ Mimari

```
┌──────────┐      ┌───────────┐      ┌───────────┐
│  Client  │─────→│  API      │─────→│  Redis    │
│          │      │  (Backend)│      │  Queue    │
└──────────┘      └───────────┘      └───────────┘
                                            ↓
                                     ┌───────────┐
                                     │  Workers  │
                                     │  (Ayrı    │
                                     │  Process) │
                                     └───────────┘
```

## 📁 Worker'lar

### 1. `videoWorker.ts` - Video Generation Worker
- Video oluşturma işlemlerini işler
- Gemini AI, Replicate, Pexels entegrasyonu
- Concurrency: 1 (aynı anda 1 video)
- Timeout: 120 saniye

### 2. `aiModelWorker.ts` - AI Model Worker
- Virtual Try-On işlemleri
- Fal.ai ve Replicate entegrasyonu
- Concurrency: 2 (aynı anda 2 işlem)
- Timeout: 90 saniye

## 🚀 Kullanım

### Development (Local)

**Tek worker başlat:**
```bash
# Video worker
npm run dev:worker:video

# AI Model worker
npm run dev:worker:ai-model
```

**Tüm worker'ları başlat:**
```bash
npm run worker:all
```

### Production (Docker)

Worker'lar otomatik olarak başlar:
```bash
docker-compose up -d video-worker ai-model-worker
```

Sadece worker'ları yeniden başlat:
```bash
docker-compose restart video-worker ai-model-worker
```

Worker loglarını izle:
```bash
docker-compose logs -f video-worker ai-model-worker
```

## 📊 Queue Endpoint'leri

### Video Generation

**Job oluştur:**
```bash
POST /api/video/queue/generate
{
  "productId": "12345",
  "prompt": "Professional product showcase",
  "duration": 30
}

# Response:
{
  "success": true,
  "jobId": "abc123",
  "status": "queued"
}
```

**Job durumu kontrol et:**
```bash
GET /api/video/queue/status/abc123

# Response:
{
  "success": true,
  "status": "completed",
  "progress": 100,
  "result": {
    "videoUrl": "https://...",
    "thumbnailUrl": "https://..."
  }
}
```

**Queue istatistikleri:**
```bash
GET /api/video/queue/stats

# Response:
{
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3
  }
}
```

### Virtual Try-On

**Job oluştur:**
```bash
POST /api/ai-model/queue/virtual-try-on
{
  "productId": "12345",
  "modelType": "latin_female",
  "category": "upper_body"
}
```

**Job durumu:**
```bash
GET /api/ai-model/queue/status/:jobId
```

## 🔧 Konfigürasyon

### Environment Variables

```bash
# Redis (Zorunlu)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Worker Concurrency
VIDEO_WORKER_CONCURRENCY=1
AI_WORKER_CONCURRENCY=2

# AI Services
GEMINI_API_KEY=xxx
GOOGLE_AI_API_KEY=xxx
FAL_KEY=xxx
REPLICATE_API_TOKEN=xxx
```

### Docker Resource Limits

```yaml
video-worker:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G

ai-model-worker:
  deploy:
    resources:
      limits:
        cpus: '1.5'
        memory: 1.5G
```

## 📈 Monitoring

### Queue Stats

```bash
# Redis CLI
redis-cli
> KEYS bull:video-generation:*
> LLEN bull:video-generation:waiting
> LLEN bull:video-generation:active
```

### Worker Logs

```bash
# Docker
docker logs beekod-video-worker
docker logs beekod-ai-model-worker

# Local
# Loglar stdout'a yazılır
```

## 🐛 Troubleshooting

### Worker başlamıyor

1. Redis bağlantısını kontrol et:
```bash
redis-cli -h localhost -p 6379 -a your_password ping
```

2. Environment variables kontrol et:
```bash
echo $REDIS_PASSWORD
echo $GEMINI_API_KEY
```

### Job stuck (takılı kaldı)

1. Job'ı manuel kontrol et:
```bash
GET /api/video/queue/status/:jobId
```

2. Job'ı iptal et:
```bash
DELETE /api/video/queue/cancel/:jobId
```

3. Worker'ı restart et:
```bash
docker-compose restart video-worker
```

### Memory leak şüphesi

1. Container stats kontrol et:
```bash
docker stats beekod-video-worker
```

2. Worker'ı restart et (graceful shutdown):
```bash
docker-compose restart video-worker
```

## 🔄 Job Retry Logic

- **Attempts**: 3 (video için 2)
- **Backoff**: Exponential (2s, 4s, 8s)
- **Timeout**: 90-120 saniye
- **Failed jobs**: 7 gün saklanır
- **Completed jobs**: 24 saat saklanır

## 🚦 Rate Limiting

- **Video Worker**: Max 10 video/dakika
- **AI Model Worker**: Max 20 işlem/dakika

## 📝 Best Practices

1. **Always check job status** before retrying
2. **Use queue for all heavy operations** (>5 saniye)
3. **Monitor queue stats** regularly
4. **Set appropriate timeouts** for your use case
5. **Scale workers horizontally** (replicas) for high load

## 🎯 Next Steps

- [ ] BullMQ Dashboard ekle (monitoring UI)
- [ ] Webhook support (job tamamlandığında callback)
- [ ] Priority queues (urgent jobs)
- [ ] Scheduled jobs (cron-like)
- [ ] Dead letter queue (failed jobs analysis)
