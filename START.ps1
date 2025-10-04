# Monad Parallel Tester - Quick Start Script
# Bu script backend ve frontend'i otomatik olarak başlatır

Write-Host "🚀 Monad Parallel Tester Başlatılıyor..." -ForegroundColor Cyan
Write-Host ""

# Gerekli dosyaların kontrolü
Write-Host "📋 Gerekli dosyalar kontrol ediliyor..." -ForegroundColor Yellow

$requiredFiles = @(
    "backend\.env",
    "frontend\.env.local",
    "frontend\postcss.config.js"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "❌ Eksik: $file" -ForegroundColor Red
    } else {
        Write-Host "✅ Var: $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Eksik dosyalar bulundu!" -ForegroundColor Red
    Write-Host "Lütfen şu dosyaları oluşturun:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        if ($file -like "*\.env*") {
            $example = $file -replace "\.env.*", ".env.example"
            if ($file -eq "frontend\.env.local") {
                $example = "frontend\env.example"
            }
            Write-Host "  Copy-Item $example $file" -ForegroundColor Cyan
        }
    }
    exit 1
}

Write-Host ""
Write-Host "✅ Tüm gerekli dosyalar mevcut!" -ForegroundColor Green
Write-Host ""

# Mevcut node process'lerini durdur
Write-Host "🧹 Eski process'ler temizleniyor..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Eski process'ler durduruldu" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ Temizleme gerekmiyor" -ForegroundColor Green
}

Write-Host ""

# Backend'i başlat
Write-Host "🔧 Backend başlatılıyor..." -ForegroundColor Yellow
$backendPath = Resolve-Path "backend"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 BACKEND SERVER' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 4

# Backend kontrolü
$backendRunning = $false
for ($i = 1; $i -le 3; $i++) {
    $netstat = netstat -an | Select-String ":3001.*LISTENING"
    if ($netstat) {
        Write-Host "✅ Backend başarıyla başlatıldı (http://localhost:3001)" -ForegroundColor Green
        $backendRunning = $true
        break
    }
    Write-Host "⏳ Backend başlatılıyor... ($i/3)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if (-not $backendRunning) {
    Write-Host "❌ Backend başlatılamadı!" -ForegroundColor Red
    Write-Host "Backend terminal penceresini kontrol edin." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Frontend'i başlat
Write-Host "🎨 Frontend başlatılıyor..." -ForegroundColor Yellow
$frontendPath = Resolve-Path "frontend"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🎨 FRONTEND SERVER' -ForegroundColor Magenta; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5

# Frontend kontrolü
$frontendRunning = $false
$frontendPort = 0
for ($i = 1; $i -le 3; $i++) {
    $netstat = netstat -an | Select-String ":517[0-9].*LISTENING"
    if ($netstat) {
        $frontendPort = ($netstat -match ":(\d+)").Matches.Groups[1].Value
        if (-not $frontendPort) {
            $frontendPort = 5173
        }
        Write-Host "✅ Frontend başarıyla başlatıldı (http://localhost:$frontendPort)" -ForegroundColor Green
        $frontendRunning = $true
        break
    }
    Write-Host "⏳ Frontend başlatılıyor... ($i/3)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if (-not $frontendRunning) {
    Write-Host "❌ Frontend başlatılamadı!" -ForegroundColor Red
    Write-Host "Frontend terminal penceresini kontrol edin." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ SİSTEM BAŞARIYLA BAŞLATILDI!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Backend:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "🎨 Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Tarayıcınızda açmak için:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173" -ForegroundColor White
Write-Host ""

# Tarayıcıyı aç
Write-Host "🌐 Tarayıcı açılıyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "💡 İpucu:" -ForegroundColor Cyan
Write-Host "   - Backend ve Frontend terminal pencerelerini açık tutun" -ForegroundColor White
Write-Host "   - Durdurmak için her iki pencerede de Ctrl+C" -ForegroundColor White
Write-Host "   - Logları terminal pencerelerinden takip edebilirsiniz" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Başarıyla başlatıldı! Test etmeye başlayabilirsiniz." -ForegroundColor Green
Write-Host ""

