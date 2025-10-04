# 🚀 Monad Parallel Tester - DApp Kullanım Kılavuzu

## 📖 İçindekiler

1. [DApp Nedir?](#dapp-nedir)
2. [Sistem Nasıl Çalışır?](#sistem-nasıl-çalışır)
3. [Metrik Hesaplamaları](#metrik-hesaplamaları)
4. [Kullanım Adımları](#kullanım-adımları)
5. [Smart Contract Fonksiyonları](#smart-contract-fonksiyonları)
6. [Test Senaryoları](#test-senaryoları)
7. [Hata Ayıklama](#hata-ayıklama)

---

## 🎯 DApp Nedir?

**Monad Parallel Tester**, Monad blockchain'deki smart contract'ların **paralel execution** performansını test eden **tam merkeziyetsiz** bir uygulamadır.

### Özellikler:

- ✅ **MetaMask Entegrasyonu**: Kendi cüzdanınızla test yapın
- ✅ **On-Chain Kayıt**: Tüm test sonuçları blockchain'de saklanır
- ✅ **Şeffaf İstatistikler**: Herkes herkesin test sonuçlarını görebilir
- ✅ **Real-Time Monitoring**: Testleri canlı izleyin
- ✅ **Contract Analytics**: Kontrat bazlı performans karşılaştırması

---

## 🔄 Sistem Nasıl Çalışır?

### Adım 1: MetaMask Bağlantısı
```
Kullanıcı → MetaMask → Monad Testnet
```

### Adım 2: Test Parametrelerini Ayarla
- **Contract Address**: Test edilecek kontrat
- **Function Name**: `globalInc` (hotspot) veya `shardedInc` (parallel)
- **TX Count**: Kaç işlem gönderilecek (örn: 30)

### Adım 3: Test Başlat
Frontend, paralel olarak birden fazla transaction gönderir:

```javascript
for (let i = 0; i < txCount; i++) {
  const tag = randomBytes32()
  const tx = await contract.globalInc(tag, { gasLimit: 100000 })
  promises.push(tx.wait())
}
```

### Adım 4: Metrikleri Hesapla
Her transaction için:
- ⏱️ **Latency**: Gönderim → Onay süresi (ms)
- ⛽ **Gas**: Kullanılan gas miktarı
- ✅ **Success/Fail**: Transaction durumu

### Adım 5: Blockchain'e Kaydet
```javascript
const testId = keccak256(userAddress, contractAddress, timestamp)
await testResultStorage.storeTestResult(testId, result)
```

### Adım 6: Sonuçları Görüntüle
- Frontend blockchain'den son testleri okur
- Event'leri dinleyerek real-time güncelleme yapar
- Grafikler ve istatistikler gösterir

---

## 📊 Metrik Hesaplamaları

### 1️⃣ Success Rate (Başarı Oranı)

```javascript
successRate = (successfulTX / totalTX) * 100
```

**Örnek:**
- Gönderilen: 30 TX
- Başarılı: 28 TX
- Başarısız: 2 TX
- **Success Rate = (28 / 30) * 100 = 93.33%**

**Yorumlama:**
- **95-100%**: Mükemmel ✅
- **85-94%**: İyi ⚡
- **70-84%**: Orta ⚠️
- **<70%**: Zayıf (çakışma veya hata var) ❌

---

### 2️⃣ Average Latency (Ortalama Gecikme)

```javascript
avgLatency = sum(allLatencies) / txCount
```

**Hesaplama:**
```javascript
// Her TX için latency hesapla
const startTime = Date.now()
await tx.wait()
const latency = Date.now() - startTime  // ms

// Ortalama al
const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
```

**Örnek:**
```
TX latencies: [1200ms, 1150ms, 1300ms, 1180ms, 1220ms]
avgLatency = (1200 + 1150 + 1300 + 1180 + 1220) / 5 = 1210ms
```

**Yorumlama:**
- **<1000ms**: Hızlı ✅
- **1000-2000ms**: Normal ⚡
- **2000-5000ms**: Yavaş ⚠️
- **>5000ms**: Çok yavaş (network veya çakışma) ❌

---

### 3️⃣ P95 Latency (95. Yüzdelik Gecikme)

```javascript
p95Latency = sortedLatencies[Math.floor(0.95 * count)]
```

**Ne demek?**
TX'lerin %95'i bu sürede tamamlanıyor.

**Hesaplama:**
```javascript
// Latency'leri sırala
const sorted = latencies.sort((a, b) => a - b)

// 95. yüzdeliği bul
const index = Math.floor(0.95 * sorted.length)
const p95 = sorted[index]
```

**Örnek:**
```
20 TX latency (sorted):
[1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450,
 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900, 2000]

P95 index = floor(0.95 * 20) = 19
P95 latency = 1900ms
```

**Yorumlama:**
- P95 düşük → Tutarlı performans ✅
- P95 yüksek → Bazı TX'ler çok yavaş ❌

---

### 4️⃣ Average Gas (Ortalama Gas)

```javascript
avgGas = sum(gasUsed) / successfulTxCount
```

**Örnek:**
```
TX 1: 45,000 gas
TX 2: 46,000 gas
TX 3: 45,500 gas
TX 4: Failed (gas sayılmaz)
TX 5: 45,800 gas

avgGas = (45000 + 46000 + 45500 + 45800) / 4 = 45,575
```

**Yorumlama:**
- **<50,000**: Verimli ✅
- **50,000-100,000**: Normal ⚡
- **>100,000**: Pahalı (optimization gerekli) ⚠️

---

### 5️⃣ Parallel Score (Paralel Performans Skoru)

**Formül:**
```javascript
parallelScore = 
  (successRate * 0.4) +        // %40 ağırlık
  (latencyScore * 0.3) +       // %30 ağırlık
  (gasScore * 0.3)             // %30 ağırlık
```

**Komponent Skorlar:**

```javascript
// 1. Latency Score (düşük latency = yüksek skor)
latencyScore = Math.max(0, 100 - (avgLatency / 50))

// Örnek:
// avgLatency = 1000ms → score = 100 - (1000/50) = 100 - 20 = 80
// avgLatency = 2500ms → score = 100 - (2500/50) = 100 - 50 = 50
// avgLatency = 5000ms → score = 100 - (5000/50) = 100 - 100 = 0

// 2. Gas Score (düşük gas = yüksek skor)
gasScore = Math.max(0, 100 - (avgGas / 1000))

// Örnek:
// avgGas = 45,000 → score = 100 - (45000/1000) = 100 - 45 = 55
// avgGas = 80,000 → score = 100 - (80000/1000) = 100 - 80 = 20
// avgGas = 150,000 → score = 100 - (150000/1000) = 0 (capped)
```

**Tam Örnek:**

```javascript
// Test Sonuçları:
successRate = 95%
avgLatency = 1200ms
avgGas = 46,000

// Komponent Skorları:
latencyScore = 100 - (1200/50) = 100 - 24 = 76
gasScore = 100 - (46000/1000) = 100 - 46 = 54

// Final Skor:
parallelScore = (95 * 0.4) + (76 * 0.3) + (54 * 0.3)
              = 38 + 22.8 + 16.2
              = 77
```

**Skor Yorumlama:**

| Skor | Seviye | Açıklama |
|------|--------|----------|
| **90-100** | 🏆 **Excellent** | Mükemmel paralel execution. Çok az çakışma, yüksek throughput. |
| **80-89** | 🎯 **Very Good** | Çok iyi performans. Minor optimizasyonlarla 90+ olabilir. |
| **70-79** | ✅ **Good** | İyi paralel execution. Kabul edilebilir performans. |
| **60-69** | ⚡ **Fair** | Orta seviye. Bazı çakışmalar var, optimization önerilir. |
| **50-59** | ⚠️ **Below Average** | Ortalamanın altında. Ciddi çakışmalar mevcut. |
| **40-49** | 🟠 **Poor** | Zayıf performans. Kontrat redesign gerekebilir. |
| **0-39** | ❌ **Very Poor** | Çok zayıf. Kontrat paralel execution için uygun değil. |

---

## 🎮 Kullanım Adımları

### Adım 1: MetaMask Kurulumu

1. [MetaMask](https://metamask.io/) indir ve kur
2. Cüzdan oluştur veya import et
3. Monad Testnet'i ekle:

```javascript
Network Name: Monad Testnet
RPC URL: https://monad-testnet.g.alchemy.com/v2/YOUR_KEY
Chain ID: 10143
Currency Symbol: MON
Block Explorer: https://testnet.monadexplorer.com
```

### Adım 2: Testnet MON Al

1. [Monad Faucet](https://faucet.monad.xyz) git
2. Wallet adresini yapıştır
3. "Request Tokens" butonuna bas
4. ~5-10 MON al

### Adım 3: DApp'e Bağlan

1. http://localhost:5173 aç
2. "Connect Wallet" butonuna bas
3. MetaMask'ta "Connect" onayla
4. Bağlantı başarılı ✅

### Adım 4: Kontrat Testi

```javascript
// 1. Test için kontrat deploy et (veya mevcut bir kontrat kullan)
Deploy Address: 0x734FC75623CDB57703EC31BaaAC180651436264B

// 2. Test parametrelerini gir
Contract Address: 0x734FC75623CDB57703EC31BaaAC180651436264B
Function: globalInc
TX Count: 30

// 3. "Start Test" butonuna bas
// 4. Her TX için MetaMask onayı ver (veya auto-approve)
// 5. Test tamamlanana kadar bekle
// 6. Sonuçları görüntüle
```

### Adım 5: Sonuçları Kaydet

```javascript
// Testten memnun kaldıysan blockchain'e kaydet
// "Save to Blockchain" butonuna bas
// TestResultStorage kontratına yazılır (gas ücretiyle)
```

---

## 📜 Smart Contract Fonksiyonları

### TestResultStorage Kontratı

**Adres:** `0xf462CfFDe23C483dc0228283C574f6c16605873e`

#### 1. Test Kaydet
```solidity
function storeTestResult(
    bytes32 testId,
    TestResult memory result
) external
```

**Kullanım:**
```javascript
const testId = ethers.utils.keccak256(
  ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'uint256'],
    [userAddress, contractAddress, timestamp]
  )
)

const result = {
  contractAddress: '0x...',
  functionName: 'globalInc',
  sent: 30,
  success: 28,
  failed: 2,
  avgLatency: 1200,
  p95Latency: 1800,
  avgGas: 45000,
  successRate: 93,
  parallelScore: 77,
  timestamp: Date.now(),
  tester: userAddress
}

await testResultStorage.storeTestResult(testId, result)
```

#### 2. Test Oku
```solidity
function getTestResult(bytes32 testId) 
    external view returns (TestResult memory)
```

```javascript
const result = await testResultStorage.getTestResult(testId)
console.log('Score:', result.parallelScore)
```

#### 3. Kullanıcı Testleri
```solidity
function getTesterTests(address tester) 
    external view returns (bytes32[] memory)
```

```javascript
const myTests = await testResultStorage.getTesterTests(userAddress)
console.log('My tests:', myTests.length)
```

#### 4. Kontrat Testleri
```solidity
function getContractTests(address contractAddress) 
    external view returns (bytes32[] memory)
```

```javascript
const tests = await testResultStorage.getContractTests(contractAddress)
// Bu kontrat için yapılan tüm testler
```

#### 5. Kontrat İstatistikleri
```solidity
function getContractStats(address contractAddress) 
    external view returns (ContractStats memory)
```

```javascript
const stats = await testResultStorage.getContractStats(contractAddress)
/*
{
  testCount: 15,
  totalScore: 1125,
  avgScore: 75,
  bestScore: 92,
  worstScore: 58
}
*/
```

#### 6. Son Testler
```solidity
function getLatestTests(uint256 count) 
    external view returns (TestResult[] memory)
```

```javascript
const latest = await testResultStorage.getLatestTests(10)
// En son 10 test
```

#### 7. En İyi Testler
```solidity
function getTopTests(uint256 count) 
    external view returns (TestResult[] memory)
```

```javascript
const top = await testResultStorage.getTopTests(5)
// En yüksek skorlu 5 test
```

---

## 🧪 Test Senaryoları

### Senaryo 1: Hotspot Test (globalInc)

**Amaç:** Tüm TX'lerin çakıştığı worst-case senaryosu

```solidity
// ParallelProbe.sol
uint256 public globalCounter;  // Tüm TX'ler bunu değiştirir

function globalInc(bytes32 tag) external {
    globalCounter += 1;  // ⚠️ Hotspot
    userCounter[msg.sender] += 1;
}
```

**Beklenen Sonuçlar:**
- Success Rate: Yüksek (95-100%)
- Avg Latency: Yüksek (1500-3000ms) çünkü TX'ler sırayla işleniyor
- Parallel Score: Düşük (40-60) çünkü paralellik yok

**Test:**
```javascript
// 30 TX gönder
for (let i = 0; i < 30; i++) {
  await contract.globalInc(randomTag())
}

// Beklenen: Düşük paralel skor
```

---

### Senaryo 2: Parallel Test (shardedInc)

**Amaç:** Her TX bağımsız, tam paralellik

```solidity
// ParallelProbe.sol
mapping(address => uint256) public userCounter;  // Her user bağımsız

function shardedInc(bytes32 tag) external {
    userCounter[msg.sender] += 1;  // ✅ Paralel
}
```

**Beklenen Sonuçlar:**
- Success Rate: Yüksek (95-100%)
- Avg Latency: Düşük (800-1200ms) çünkü TX'ler paralel işleniyor
- Parallel Score: Yüksek (80-95) çünkü tam paralellik var

**Test:**
```javascript
// Farklı adreslerden 30 TX gönder
for (let i = 0; i < 30; i++) {
  const wallet = wallets[i % wallets.length]
  await contract.connect(wallet).shardedInc(randomTag())
}

// Beklenen: Yüksek paralel skor
```

---

### Senaryo 3: Karşılaştırma

```javascript
// 1. Hotspot test
const hotspotResult = await runTest(contractAddress, 'globalInc', 30)
console.log('Hotspot Score:', hotspotResult.parallelScore)  // ~50

// 2. Parallel test  
const parallelResult = await runTest(contractAddress, 'shardedInc', 30)
console.log('Parallel Score:', parallelResult.parallelScore)  // ~85

// 3. Karşılaştır
const improvement = parallelResult.parallelScore - hotspotResult.parallelScore
console.log('Improvement:', improvement)  // ~35 puan

// 4. Blockchain'e kaydet
await testResultStorage.storeTestResult(testId1, hotspotResult)
await testResultStorage.storeTestResult(testId2, parallelResult)
```

---

## 🐛 Hata Ayıklama

### Hata 1: MetaMask Bağlanmıyor

**Belirti:**
```
Error: MetaMask not detected
```

**Çözüm:**
```javascript
// 1. MetaMask kurulu mu?
if (typeof window.ethereum === 'undefined') {
  alert('Please install MetaMask')
  return
}

// 2. Monad Testnet seçili mi?
const chainId = await window.ethereum.request({ method: 'eth_chainId' })
if (chainId !== '0x27A7') {  // 10143 = 0x27A7
  alert('Please switch to Monad Testnet')
  return
}
```

---

### Hata 2: Insufficient Funds

**Belirti:**
```
Error: insufficient funds for gas * price + value
```

**Çözüm:**
```javascript
// 1. Bakiyeni kontrol et
const balance = await provider.getBalance(userAddress)
console.log('Balance:', ethers.utils.formatEther(balance), 'MON')

// 2. Faucet'ten MON al
// https://faucet.monad.xyz

// 3. Gas limit düşür
const tx = await contract.globalInc(tag, { gasLimit: 80000 })
```

---

### Hata 3: TX Timeout

**Belirti:**
```
Error: timeout of 60000ms exceeded
```

**Çözüm:**
```javascript
// 1. Timeout süresini artır
const tx = await contract.globalInc(tag)
await tx.wait({ timeout: 120000 })  // 2 dakika

// 2. Confirmations azalt
await tx.wait(1)  // 1 confirmation yeter
```

---

### Hata 4: Contract Not Found

**Belirti:**
```
Error: contract not deployed at address
```

**Çözüm:**
```javascript
// 1. Adresi kontrol et
const code = await provider.getCode(contractAddress)
if (code === '0x') {
  console.error('No contract at this address')
}

// 2. Doğru network'te mi?
const network = await provider.getNetwork()
console.log('Network:', network.name)
```

---

## 📊 Best Practices

### 1. Test Öncesi Kontroller

```javascript
async function preTestChecks() {
  // 1. Cüzdan bağlı mı?
  if (!signer) throw new Error('Connect wallet first')
  
  // 2. Yeterli bakiye var mı?
  const balance = await provider.getBalance(userAddress)
  const minBalance = ethers.utils.parseEther('0.1')
  if (balance.lt(minBalance)) {
    throw new Error('Insufficient balance')
  }
  
  // 3. Kontrat geçerli mi?
  const code = await provider.getCode(contractAddress)
  if (code === '0x') {
    throw new Error('Invalid contract address')
  }
  
  // 4. Parametreler geçerli mi?
  if (txCount < 1 || txCount > 100) {
    throw new Error('TX count must be 1-100')
  }
}
```

### 2. Error Handling

```javascript
try {
  const result = await runTest(params)
  await testResultStorage.storeTestResult(testId, result)
} catch (error) {
  if (error.code === 4001) {
    // User rejected
    console.log('User cancelled transaction')
  } else if (error.code === -32603) {
    // Internal error
    console.error('RPC error:', error.message)
  } else {
    console.error('Unknown error:', error)
  }
}
```

### 3. Gas Optimization

```javascript
// Batch TX'leri paralelde gönder (daha hızlı)
const promises = []
for (let i = 0; i < txCount; i++) {
  const promise = contract.globalInc(randomTag(), {
    gasLimit: 100000,
    maxPriorityFeePerGas: ethers.utils.parseUnits('1', 'gwei')
  })
  promises.push(promise)
}

// Tümünü bekle
const txs = await Promise.allSettled(promises)
```

---

## 📈 İleri Seviye Kullanım

### Custom Contract Test

```javascript
// Kendi kontratınızı test edin
const customABI = [
  'function myParallelFunction(uint256 id) external'
]

const contract = new ethers.Contract(address, customABI, signer)

// Test et
for (let i = 0; i < 30; i++) {
  await contract.myParallelFunction(i)
}
```

### Event Monitoring

```javascript
// Real-time event dinle
testResultStorage.on('TestResultStored', (testId, tester, contract, score) => {
  console.log(`New test: ${tester} scored ${score} on ${contract}`)
  
  // UI'ı güncelle
  refreshLeaderboard()
})
```

### Batch Data Fetching

```javascript
// Çok sayıda test verisi çek
async function fetchAllTests() {
  const totalTests = await testResultStorage.getTotalTests()
  
  // Batch'ler halinde çek (gas tasarrufu)
  const batchSize = 100
  const allTests = []
  
  for (let i = 0; i < totalTests; i += batchSize) {
    const batch = await testResultStorage.getTestResults(i, batchSize)
    allTests.push(...batch)
  }
  
  return allTests
}
```

---

## 🎓 Sonuç

Bu DApp ile:
- ✅ Kontratlarınızın paralel performansını ölçün
- ✅ Sonuçları blockchain'de saklayın
- ✅ Diğer kontratlarla karşılaştırın
- ✅ Optimization fırsatlarını keşfedin

**Happy Testing! 🚀**

---

**Son Güncelleme:** 04 Ekim 2025  
**Versiyon:** 2.0 (DApp)  
**Lisans:** MIT

