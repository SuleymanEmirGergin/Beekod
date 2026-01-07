# Beekod E-Ticaret Yönetim Platformu

![Beekod Logo](https://via.placeholder.com/150x50/F5B800/000000?text=BEEKOD)

**Production-Ready E-Ticaret Yönetim ve Otomasyon Platformu**

---

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler

#### 📦 Ürün Yönetimi
- Barkod bazlı ürün takibi
- Stok yönetimi ve uyarılar
- Varyant desteği (renk, beden, vb.)
- Toplu ürün işlemleri
- QR kod oluşturma

#### 🛒 Sipariş Yönetimi
- Sipariş takibi ve durum güncelleme
- Fatura oluşturma
- Kargo entegrasyonu
- Sipariş geçmişi

#### 🏪 Marketplace Entegrasyonları
- **Trendyol**
- **Hepsiburada**
- **N11**
- **Amazon TR**
- Toplu ürün senkronizasyonu
- Fiyat ve stok güncelleme
- Canlı mod / Test modu

#### 🤖 AI Asistan
- Gemini AI ile chatbot
- Doğal dil işleme
- Ürün optimizasyonu
- Satış önerileri
- Günlük özet raporları

#### 📊 Analitik & BI
- Dashboard istatistikleri
- Satış trendleri
- Kar analizi
- Stok tahminleme
- Finansal içgörüler

#### 📱 Sosyal Medya Yönetimi
- Post planlama
- AI ile içerik oluşturma
- Çoklu platform desteği

#### 🎥 Video & Model Designer
- AI ile ürün videoları
- 3D model önizleme
- Otomatik içerik oluşturma

#### ⚡ Performans
- Code splitting (70% bundle reduction)
- Redis caching
- Lazy loading
- Optimized queries

---

## 🛠️ Teknoloji Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL 8.0
- **Cache**: Redis
- **AI**: Google Gemini API
- **Email**: Nodemailer

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **State**: React Query
- **Icons**: Lucide React

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Web Server**: Nginx
- **SSL**: Let's Encrypt ready

---

## 📋 Gereksinimler

- Node.js 18+ 
- MySQL 8.0+
- Redis 7+ (opsiyonel, performans için önerilir)
- npm veya yarn

---

## 🚀 Kurulum

### 1. Repository'yi Klonlayın
```bash
git clone <repository-url>
cd Beekod
```

### 2. Bağımlılıkları Yükleyin
```bash
# Backend
npm install

# Frontend
cd BeekodFrontend
npm install
cd ..
```

### 3. Environment Konfigürasyonu
```bash
# .env dosyasını oluşturun
cp .env.example .env

# .env dosyasını düzenleyin
nano .env
```

**Önemli Environment Variables:**
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=beekod

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Redis (opsiyonel)
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
ADMIN_KEY=your_secure_admin_key
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### 4. Database Setup
```bash
# MySQL'e bağlanın
mysql -u root -p

# Database oluşturun
CREATE DATABASE beekod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Schema'yı import edin
mysql -u root -p beekod < schema.sql
```

### 5. Build
```bash
# Backend build
npm run build

# Frontend build
cd BeekodFrontend
npm run build
cd ..
```

### 6. Başlatma
```bash
# Development
npm run dev

# Production
npm start
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:3000`

---

## 🐳 Docker ile Kurulum

### Quick Start
```bash
# Build ve başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Durdur
docker-compose down
```

### Servisler
- **frontend**: `http://localhost:80`
- **backend**: `http://localhost:3000`
- **mysql**: `localhost:3306`
- **redis**: `localhost:6379`

---

## 📚 API Dokümantasyonu

### Authentication
Tüm API istekleri `Authorization` header'ı gerektirir:
```
Authorization: Bearer YOUR_ADMIN_KEY
```

### Endpoints

#### Products
```
GET    /api/products              # Tüm ürünleri listele
GET    /api/products/:barcode     # Ürün detayı
POST   /api/products              # Yeni ürün ekle
PUT    /api/products/:barcode     # Ürün güncelle
DELETE /api/products/:barcode     # Ürün sil
```

#### Orders
```
GET    /api/orders                # Siparişleri listele
GET    /api/orders/:id            # Sipariş detayı
POST   /api/orders                # Yeni sipariş
PUT    /api/orders/:id            # Sipariş güncelle
```

#### Analytics
```
GET    /api/analytics/dashboard   # Dashboard stats
GET    /api/analytics/sales       # Satış analizi
GET    /api/analytics/profit      # Kar analizi
```

#### Chat
```
POST   /api/chat                  # AI asistan mesaj gönder
GET    /api/chat/history          # Chat geçmişi
```

Detaylı API dokümantasyonu: [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)

---

## 🧪 Test

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📦 Deployment

### Production Checklist

- [ ] `.env` dosyasını production değerleriyle güncelle
- [ ] `ADMIN_KEY`, `JWT_SECRET`, `SESSION_SECRET` güvenli değerler
- [ ] SSL/HTTPS kurulumu
- [ ] Database backup stratejisi
- [ ] Redis production konfigürasyonu
- [ ] Monitoring ve logging
- [ ] Rate limiting ayarları
- [ ] CORS ayarları

### VPS Deployment

Detaylı deployment rehberi: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 🔒 Güvenlik

- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Security headers
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection

---

## 📈 Performans

### Frontend
- Initial Load: ~1.2s
- Bundle Size: 272KB (main chunk)
- Code Splitting: 5 chunks
- Lazy Loading: 20+ screens

### Backend
- API Response: <100ms (cached)
- Database Queries: Optimized with indexes
- Redis Caching: 30s-5min TTL

---

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📝 Lisans

Bu proje [MIT License](LICENSE) altında lisanslanmıştır.

---

## 📞 İletişim

**Beekod Team**  
Email: support@beekod.com  
Website: https://beekod.com

---

## 🙏 Teşekkürler

- Google Gemini AI
- Recharts
- TailwindCSS
- React Community

---

**Made with ❤️ by Beekod Team**
