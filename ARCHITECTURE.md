# 🏗️ Monad Parallel Tester - DApp Architecture

## 📋 Genel Bakış

Bu proje, Monad blockchain'inde kontratların paralel execution performansını test eden **tam merkeziyetsiz** bir DApp'tir.

## 🔄 Mimari - ÖNCESİ vs SONRASI

### ❌ ESKİ (Merkezi) Mimari:

```
User → Frontend → Backend (Node.js)
                     ↓
                  1. Bot'ları oluştur
                  2. Test et
                  3. Hesapla (off-chain)
                     ↓
                  Frontend ← Sonuçlar
```

**Sorunlar:**
- Backend'e bağımlı
- Sonuçlar merkezi sunucuda hesaplanıyor
- Kullanıcı kendi cüzdanını kullanamıyor
- Veriler blockchain'de saklanmıyor

### ✅ YENİ (Merkeziyetsiz) DApp Mimarisi:

```
User (MetaMask) → Frontend → Smart Contract
                                 ↓
                    1. Kontrata test başlat
                    2. Paralel tx'ler gönder
                    3. Sonuçları on-chain kaydet (TestResultStorage)
                                 ↓
                    Frontend ← Zincirden oku (event'ler + view fonksiyonları)
```

**Avantajlar:**
- ✅ Tam merkeziyetsiz
- ✅ Kullanıcı kendi cüzdanını kullanır
- ✅ Tüm veriler blockchain'de
- ✅ Backend opsiyonel (sadece RPC proxy)
- ✅ Şeffaf ve doğrulanabilir

## 🎯 Yeni Akış

### 1. Kullanıcı Bağlantısı
```javascript
// MetaMask bağlantısı
await window.ethereum.request({ method: 'eth_requestAccounts' })
```

### 2. Test Başlatma

Kullanıcı:
- Kontrat adresini girer
- Test parametrelerini seçer (fonksiyon, tx sayısı)
- "Start Test" butonuna basar

Frontend:
```javascript
// Test kontratı ile etkileşim
const contract = new ethers.Contract(address, ABI, signer)

// Paralel tx'ler gönder
const promises = []
for (let i = 0; i < count; i++) {
  const tag = generateRandomTag()
  const tx = contract.globalInc(tag) // veya shardedInc
  promises.push(tx)
}

// Tüm tx'leri bekle ve metrikleri hesapla
const results = await Promise.allSettled(promises)
```

### 3. Metrik Hesaplama (Frontend)

```javascript
// Her tx için:
- Başarı/Başarısızlık
- Latency (gönderim → onay süresi)
- Gas kullanımı
- Timestamp

// Toplam metrikler:
- Success rate: (successful / total) * 100
- Average latency: sum(latencies) / count
- P95 latency: 95. percentile
- Average gas: sum(gas) / successful_count
- Parallel score: hesaplama formülü
```

### 4. On-Chain Kayıt

```solidity
// TestResultStorage kontratına yaz
struct TestResult {
    address contractAddress;
    string functionName;
    uint256 sent;
    uint256 success;
    uint256 failed;
    uint256 avgLatency;
    uint256 p95Latency;
    uint256 avgGas;
    uint256 successRate;
    uint256 parallelScore;
    uint256 timestamp;
    address tester;
}

testResultStorage.storeTestResult(testId, result)
```

### 5. Veri Okuma

```javascript
// Blockchain'den geçmiş testleri oku
const myTests = await testResultStorage.getTesterTests(userAddress)
const testResult = await testResultStorage.getTestResult(testId)
const stats = await testResultStorage.getTestStats()
```

## 📊 Metrik Hesaplamaları

### 1. Success Rate (Başarı Oranı)
```
successRate = (successfulTx / totalTx) * 100
```
- 0-100 arası yüzde değeri
- 100% = Tüm tx'ler başarılı
- Düşük değer = Çakışma veya hata

### 2. Average Latency (Ortalama Gecikme)
```
avgLatency = sum(allLatencies) / txCount
```
- Milisaniye cinsinden
- TX gönderiminden onaya kadar geçen süre
- Düşük değer = Hızlı işlem

### 3. P95 Latency (95. Percentile)
```
p95Latency = sortedLatencies[floor(0.95 * count)]
```
- İşlemlerin %95'inin tamamlanma süresi
- Worst-case performans göstergesi

### 4. Average Gas
```
avgGas = sum(gasUsed) / successfulTxCount
```
- Sadece başarılı tx'ler için
- Wei cinsinden

### 5. Parallel Score (Paralel Performans Skoru)
```javascript
parallelScore = 
  (successRate * 0.4) +           // %40 ağırlık: başarı oranı
  (latencyScore * 0.3) +          // %30 ağırlık: hız
  (gasScore * 0.3)                // %30 ağırlık: verimlilik

// Latency score: Düşük latency = yüksek skor
latencyScore = max(0, 100 - (avgLatency / 50))

// Gas score: Düşük gas = yüksek skor  
gasScore = max(0, 100 - (avgGas / 1000))
```

**Skor Yorumlama:**
- **80-100**: Mükemmel paralel performans
- **60-79**: İyi performans
- **40-59**: Orta performans
- **0-39**: Zayıf performans (çakışma var)

## 🔐 Güvenlik

### Frontend Doğrulamaları:
- Kontrat adresi format kontrolü
- Test parametrelerinin limitleri
- MetaMask bağlantı kontrolü
- Yeterli bakiye kontrolü

### Smart Contract Güvenliği:
- Reentrancy koruması yok (gerekli değil)
- Access control yok (herkes test edebilir)
- Gas optimization ✅

## 💾 Veri Yapısı

### On-Chain Storage:

```solidity
// Test sonuçları
mapping(bytes32 => TestResult) public testResults

// Test ID'leri
bytes32[] public testIds

// Kullanıcı testleri
mapping(address => bytes32[]) public testerTests
```

### Frontend State:

```javascript
{
  // Bağlantı
  account: '0x...',
  provider: ethers.providers.Web3Provider,
  signer: ethers.Signer,
  
  // Test parametreleri
  contractAddress: '0x...',
  functionName: 'globalInc',
  txCount: 30,
  
  // Test durumu
  isRunning: false,
  progress: { sent: 0, confirmed: 0, failed: 0 },
  
  // Sonuçlar
  currentTest: TestResult,
  testHistory: TestResult[],
  
  // İstatistikler
  totalTests: 0,
  avgScore: 0,
  bestScore: 0,
  worstScore: 0
}
```

## 🔄 Event'ler

### ParallelProbe Events:
```solidity
event Hit(
    address indexed sender,
    bytes32 tag,
    uint256 globalValue,
    uint256 userValue
)
```

### TestResultStorage Events:
```solidity
event TestResultStored(
    bytes32 indexed testId,
    address indexed tester,
    address indexed contractAddress,
    uint256 parallelScore
)
```

Frontend event listener:
```javascript
testResultStorage.on('TestResultStored', (testId, tester, contract, score) => {
  if (tester === userAddress) {
    // Yeni test kaydedildi, UI'ı güncelle
    refreshTestHistory()
  }
})
```

## 📈 Performans Optimizasyonları

### 1. Batch Reading
```javascript
// Tek tek okumak yerine:
❌ for (let id of ids) await getTestResult(id)

// Batch okuma:
✅ const results = await testResultStorage.getTestResults(0, 100)
```

### 2. Event Filtering
```javascript
// Sadece kullanıcının testlerini dinle
const filter = testResultStorage.filters.TestResultStored(null, userAddress)
const events = await testResultStorage.queryFilter(filter)
```

### 3. Local Caching
```javascript
// İndexedDB veya localStorage kullan
const cache = {
  tests: Map<testId, TestResult>,
  lastUpdate: timestamp
}
```

## 🎨 UI/UX Akışı

### 1. Landing Page
- MetaMask bağlantı butonu
- Proje açıklaması
- Canlı istatistikler (zincirden)

### 2. Test Dashboard
- Kontrat adresi girişi
- Fonksiyon seçimi (globalInc/shardedInc)
- TX sayısı slider
- "Start Test" butonu
- Real-time progress bar

### 3. Results View
- Metrik kartları (success rate, latency, gas, score)
- Latency grafiği (her tx'in latency'si)
- Success/Fail dağılımı
- "Save to Blockchain" butonu

### 4. History View
- Kullanıcının geçmiş testleri (tablo)
- Filtreleme (tarih, kontrat, fonksiyon)
- Export (CSV/JSON)

### 5. Leaderboard (Opsiyonel)
- En yüksek skorlar
- En test yapan kullanıcılar
- En test edilen kontratlar

## 🌐 Network Configuration

### Monad Testnet:
```javascript
{
  chainId: '0x???', // Monad testnet chain ID
  chainName: 'Monad Testnet',
  rpcUrls: ['https://monad-testnet.g.alchemy.com/v2/...'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18
  }
}
```

### MetaMask Network Ekleme:
```javascript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [networkConfig]
})
```

## 📦 Deployment

### 1. Smart Contracts
```bash
# Backend'den deploy (bir kez)
cd backend
npm run deploy

# Kontrat adresleri .env'e kaydet
PROBE_ADDRESS=0x...
RESULT_STORAGE_ADDRESS=0x...
```

### 2. Frontend
```bash
cd frontend
npm run build

# Vercel/Netlify/IPFS'e deploy
vercel deploy
# veya
fleek deploy
```

### 3. Konfigürasyon
```javascript
// frontend/src/config.js
export const CONTRACTS = {
  PROBE: '0x734FC75623CDB57703EC31BaaAC180651436264B',
  RESULT_STORAGE: '0xf462CfFDe23C483dc0228283C574f6c16605873e'
}

export const NETWORK = {
  CHAIN_ID: 10143, // Monad testnet
  RPC_URL: 'https://monad-testnet.g.alchemy.com/v2/...'
}
```

## 🔍 Test Senaryoları

### 1. Hotspot Test (globalInc)
```javascript
// Tüm tx'ler global counter'ı değiştirir
// Beklenen: Düşük paralel skor, yüksek latency
```

### 2. Parallel Test (shardedInc)
```javascript
// Her tx sadece kendi user counter'ını değiştirir
// Beklenen: Yüksek paralel skor, düşük latency
```

### 3. Karşılaştırma
```javascript
// Aynı kontrata her iki fonksiyon için test yap
// Paralel skor farkı = Paralel execution kazancı
```

## 🎯 Başarı Kriterleri

✅ **İyi Paralel Kontrat:**
- shardedInc skoru > 80
- globalInc vs shardedInc farkı > 30
- Success rate > 95%

❌ **Zayıf Paralel Kontrat:**
- shardedInc skoru < 60
- globalInc ve shardedInc skorları benzer
- Yüksek failed tx oranı

## 🚀 Gelecek İyileştirmeler

1. **Custom Kontrat Testi:**
   - Kullanıcı kendi ABI'sini yükleyebilir
   - Farklı fonksiyonları test edebilir

2. **Gas Profiling:**
   - Hangi storage slot'lara erişildiği
   - Conflict analizi

3. **Visualization:**
   - Transaction dependency graph
   - Parallelization heatmap

4. **Benchmarking:**
   - Kontratları kategorilere göre karşılaştır
   - Industry standards

5. **Social Features:**
   - Test sonuçlarını paylaşma
   - Leaderboard
   - Badges/Achievements

---

**Son Güncelleme:** 04 Ekim 2025
**Versiyon:** 2.0 (DApp)

