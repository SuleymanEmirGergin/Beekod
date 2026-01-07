# Beekod Platform Deployment Guide 🚀

Bu rehber, Beekod platformunu bir VPS (Virtual Private Server) üzerine sıfırdan kurmak veya güncellemek için gerekli adımları içerir.

## 📋 Ön Gereksinimler

- **Ubuntu 22.04 LTS** (veya benzeri Linux dağıtımı)
- **2GB RAM** (önerilen 4GB)
- **2 CPU**
- **20GB Disk Alanı**
- **Domain Adı** (örn: beekod.com)

## 🛠️ 1. Sunucu Hazırlığı

Sunucunuza SSH ile bağlanın ve sistemi güncelleyin:

```bash
ssh root@your-server-ip

# Sistemi güncelle
apt update && apt upgrade -y

# Gerekli araçları kur
apt install -y curl git unzip ufw
```

### Docker Kurulumu
Docker ve Docker Compose'u kurun:

```bash
# Docker repo ekle
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose plugin kur
apt install -y docker-compose-plugin

# Docker servisini başlat
systemctl start docker
systemctl enable docker
```

### Firewall Ayarları
Temel güvenlik duvarı ayarlarını yapın:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 🏗️ 2. Proje Kurulumu

Projeyi sunucuya kopyalayın veya Git üzerinden çekin:

```bash
# Git ile (Önerilen)
git clone https://github.com/your-repo/beekod.git
cd beekod

# Veya yerel dosyaları sunucuya kopyalayın (Local terminalden)
# scp -r ./beekod root@your-server-ip:/opt/beekod
```

## ⚙️ 3. Konfigürasyon

Production ortamı için `.env` dosyasını hazırlayın:

```bash
# Örnek dosyadan kopyala
cp .env.example .env

# Düzenle
nano .env
```

**Dikkat Edilmesi Gereken Kritik Değişkenler:**
- `NODE_ENV=production`
- `ADMIN_KEY`: Güçlü bir şifre belirleyin (örn: `openssl rand -hex 32`)
- `DB_PASSWORD`: Veritabanı şifresini değiştirin
- `JWT_SECRET`: Güçlü bir secret belirleyin

## 🚀 4. Başlatma (Docker)

Uygulamayı Docker ile ayağa kaldırın:

```bash
# Build ve Start
docker compose up -d --build

# Logları izle
docker compose logs -f
```

## 🔒 5. SSL Kurulumu (NGINX & Certbot)

Uygulama şu an `http://your-server-ip` üzerinde çalışıyor. HTTPS (SSL) için Nginx ve Certbot kullanın.

```bash
# Nginx ve Certbot kur
apt install -y nginx certbot python3-certbot-nginx

# Nginx ayarı oluştur
nano /etc/nginx/sites-available/beekod
```

`beekod` dosyasına ekleyin:
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80; # Frontend container port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000; # Backend container port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktif edin ve SSL sertifikası alın:
```bash
ln -s /etc/nginx/sites-available/beekod /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# SSL Sertifikası al (Otomatik konfigürasyon)
certbot --nginx -d your-domain.com
```

## 🔄 Güncelleme

Yeni kodları deploy etmek için:

```bash
# Kodları çek
git pull

# Yeniden başlat (Rebuild ile)
docker compose up -d --build
```

## 🧪 Sorun Giderme

**Logları Kontrol Etme:**
```bash
docker compose logs backend
docker compose logs frontend --tail 100
```

**Veritabanına Bağlanma:**
```bash
docker compose exec db mysql -u root -p
```

**Resource Kullanımı:**
```bash
docker stats
```
