# 🔧 Troubleshooting Guide - Monad Parallel Tester

## ✅ Çözülen Sorunlar (04 Ekim 2025)

### 1. Frontend Yüklenmiyor Sorunu

**Problem:** Frontend sayfası tarayıcıda açılmıyor veya boş ekran gösteriyor.

**Tespit Edilen Sorunlar:**
1. ❌ `postcss.config.js` dosyası eksikti (Tailwind CSS için gerekli)
2. ❌ `.env.local` dosyası eksikti (environment variables için gerekli)
3. ❌ Çoklu node process'leri çalışıyordu (port çakışması)

**Çözümler:**
1. ✅ `postcss.config.js` oluşturuldu:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

2. ✅ `.env.local` dosyası oluşturuldu (env.example'dan kopyalandı):
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

3. ✅ Tüm node process'leri temizlendi ve doğru sırayla yeniden başlatıldı

## 🚀 Doğru Başlatma Sırası

### 1. Backend'i Başlat
```powershell
cd C:\Users\Burak\Desktop\mm\monad-parallel-tester-framework\backend
npm run dev
```
Backend şu adreste çalışacak: `http://localhost:3001`

### 2. Frontend'i Başlat
```powershell
cd C:\Users\Burak\Desktop\mm\monad-parallel-tester-framework\frontend
npm run dev
```
Frontend şu adreste çalışacak: `http://localhost:5173`

### 3. Tarayıcıda Aç
```
http://localhost:5173
```

## 🔍 Kontrol Komutları

### Port Kontrolleri
```powershell
# Backend kontrolü (3001 portunda çalışmalı)
netstat -an | findstr ":3001"

# Frontend kontrolü (5173 portunda çalışmalı)
netstat -an | findstr ":5173"
```

### API Sağlık Kontrolü
```powershell
# Backend sağlık kontrolü
curl http://localhost:3001/api/health

# Başarılı yanıt:
# {"success":true,"status":"online","network":"https://monad-testnet..."}
```

### Frontend Kontrolü
```powershell
# Frontend HTML kontrolü
curl http://localhost:5173

# Başarılı yanıt: HTML içeriği gelmelidir
```

## 🐛 Yaygın Sorunlar ve Çözümler

### Problem: "Port already in use"
**Çözüm:**
```powershell
# Tüm node process'lerini durdur
Stop-Process -Name "node" -Force

# 2 saniye bekle
Start-Sleep -Seconds 2

# Servisleri tekrar başlat
```

### Problem: Frontend boş ekran gösteriyor
**Çözüm:**
1. `.env.local` dosyasının var olduğunu kontrol et
2. `postcss.config.js` dosyasının var olduğunu kontrol et
3. Browser console'da hata olup olmadığını kontrol et (F12)
4. Frontend'i yeniden başlat

### Problem: "Cannot connect to backend"
**Çözüm:**
1. Backend'in çalıştığını kontrol et: `netstat -an | findstr ":3001"`
2. `.env` dosyasında RPC URL ve private key'in doğru olduğunu kontrol et
3. Backend loglarını kontrol et

### Problem: WebSocket bağlanamıyor
**Çözüm:**
1. Backend ve frontend'in aynı makınada çalıştığını kontrol et
2. `.env.local` dosyasında `VITE_WS_URL=ws://localhost:3001` olduğunu kontrol et
3. Firewall'un 3001 ve 5173 portlarını engellemediğini kontrol et

## 📋 Sistem Gereksinimleri Kontrolü

### Node.js Versiyon Kontrolü
```powershell
node --version  # v18.0.0 veya üzeri olmalı
npm --version   # v9.0.0 veya üzeri olmalı
```

### Bağımlılıkların Yüklü Olduğunu Kontrol Et
```powershell
# Backend bağımlılıkları
cd backend
npm list ethers express ws

# Frontend bağımlılıkları
cd ../frontend
npm list react react-dom vite
```

## 🔄 Tam Sistem Reset

Eğer hiçbir şey çalışmıyorsa, tam reset yapın:

```powershell
# 1. Tüm node process'lerini durdur
Stop-Process -Name "node" -Force

# 2. node_modules'ları temizle (opsiyonel)
cd C:\Users\Burak\Desktop\mm\monad-parallel-tester-framework
Remove-Item -Recurse -Force backend/node_modules
Remove-Item -Recurse -Force frontend/node_modules

# 3. Bağımlılıkları yeniden yükle
cd backend
npm install
cd ../frontend
npm install

# 4. Gerekli dosyaların var olduğunu kontrol et
# - backend/.env
# - frontend/.env.local
# - frontend/postcss.config.js

# 5. Servisleri başlat
cd backend
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev"
Start-Sleep -Seconds 3
cd ../frontend
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev"
```

## 🌐 Network Ayarları

### Localhost vs 127.0.0.1
Her ikisi de aynı anlama gelir, ama bazı durumlarda birisi diğerinden daha iyi çalışabilir:

```bash
# .env.local dosyasında alternatif:
VITE_API_URL=http://127.0.0.1:3001
VITE_WS_URL=ws://127.0.0.1:3001
```

### IPv4 vs IPv6
Eğer bağlantı sorunları yaşıyorsanız:

```powershell
# IPv4'ü zorla
netsh interface ipv4 show interface
```

## 📊 Sistem Durumu Kontrolü

Şu komutla tüm sistemi kontrol edebilirsiniz:

```powershell
# Çalışan port'ları göster
netstat -an | findstr "3001 5173"

# Node process'lerini göster
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Backend health check
curl http://localhost:3001/api/health

# Frontend check
curl http://localhost:5173
```

## ✅ Başarılı Sistem Durumu

Sistem doğru çalışıyorsa:
- ✅ Backend port 3001'de LISTENING durumunda
- ✅ Frontend port 5173'de LISTENING durumunda
- ✅ `curl http://localhost:3001/api/health` başarılı JSON response döner
- ✅ `curl http://localhost:5173` HTML içeriği döner
- ✅ Browser'da http://localhost:5173 açıldığında Monad Parallel Execution Tester arayüzü görünür
- ✅ Sağ üstte "Connected to server" yeşil yazısı var

## 🆘 Hala Çalışmıyorsa

1. Browser console'u açın (F12) ve hataları kontrol edin
2. Backend terminal loglarını kontrol edin
3. Frontend terminal loglarını kontrol edin
4. `.env` ve `.env.local` dosyalarını kontrol edin
5. Firewall/Antivirus ayarlarını kontrol edin
6. Node.js versiyonunu kontrol edin

## 📞 Debug Modu

Daha detaylı loglar için:

```powershell
# Backend debug mode
$env:DEBUG="*"
npm run dev

# Frontend development mode (zaten verbose)
npm run dev
```

---

**Son Güncelleme:** 04 Ekim 2025
**Durum:** ✅ Tüm sorunlar çözüldü, sistem çalışıyor

