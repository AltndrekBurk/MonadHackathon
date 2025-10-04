# 📖 KULLANIM KILAVUZU - Monad Parallel Tester

**Güncellenme:** 04 Ekim 2025  
**Hedef Kitle:** Monad geliştiricileri ve DApp kullanıcıları

---

## 🎯 HIZLI BAŞLANGIÇ

### **Adım 1: Projeyi Başlat**

```bash
cd monad-parallel-tester-framework

# Windows (PowerShell)
.\START.ps1

# Manuel
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### **Adım 2: Tarayıcıyı Aç**

```
http://localhost:5173
```

### **Adım 3: MetaMask Bağlan**

1. **"Connect MetaMask"** butonuna tıkla
2. MetaMask pop-up'ını onayla
3. Cüzdan adresin görünecek: `0x1234...5678`

### **Adım 4: Network Ayarı (İlk Kez)**

MetaMask'te **Monad Testnet** ekle:

```
Network Name: Monad Testnet
RPC URL: https://monad-testnet.g.alchemy.com/v2/YOUR_KEY
Chain ID: 10143
Currency: MON
Explorer: https://testnet.monadexplorer.com
```

### **Adım 5: Test Fon Al**

Monad Testnet faucet'ten MON al:
```
https://monad-faucet.example.com (örnek)
```

### **Adım 6: İlk Testi Çalıştır**

1. **Contract Address**: `0x77807CE01Fc861E8Be27b9aBfCC721F3c74f1a40` (default)
2. **Function**: `globalInc` veya `shardedInc`
3. **TX Count**: 30
4. **"Run Test"** butonuna tıkla
5. MetaMask TX'leri onayla (30 kez)
6. Sonuçları gör!

---

## 🦊 METAMASK MODE (DApp)

### **Ne İşe Yarar?**

- Kullanıcı kendi cüzdanıyla test yapar
- TX'ler kullanıcı tarafından imzalanır
- Merkezi backend'e ihtiyaç yok
- Tam decentralized

### **Kullanım**

#### **1. Bağlan**

```
1. "Connect MetaMask" → Tıkla
2. MetaMask pop-up → Onayla
3. Adresin görünsün: 0x1234...5678 ✅
```

#### **2. Mod Seç**

```
🦊 MetaMask Mode [Seçili]
🤖 Bot Mode
```

#### **3. Contract Ayarla**

```
Contract Address: 0x77807CE01Fc861E8Be27b9aBfCC721F3c74f1a40
Function: 
  ○ globalInc (Hotspot - yavaş)
  ○ shardedInc (Parallel - hızlı)
TX Count: 30
```

#### **4. Testi Çalıştır**

```
1. "Run Test" → Tıkla
2. MetaMask pop-up'ları → Hepsini onayla
   (Her TX için 1 onay = 30 onay)
3. Real-time sonuçları izle:
   • Completed: 15/30
   • Success: 14
   • Failed: 1
   • Current Latency: 1250ms
```

#### **5. Sonuçları Kaydet**

Test tamamlandıktan sonra:

```
1. Sonuçları gör:
   ✅ Success Rate: 93%
   ⏱️ Avg Latency: 1200ms
   ⚡ P95 Latency: 1800ms
   ⛽ Avg Gas: 45,000
   🎯 Parallel Score: 77/100

2. "Save Results to Blockchain" → Tıkla
3. MetaMask TX onayla
4. ✅ Başarı mesajı:
   "Test results saved to blockchain!
    Test ID: 0xabc123...
    Block: 12345678"
```

#### **6. On-Chain Stats Gör**

Contract address girdikten sonra otomatik yüklenir:

```
📊 On-Chain Statistics
   Total Tests: 15
   Avg Score: 75
   Best Score: 92
   Worst Score: 58
   
   📊 Data from blockchain
```

---

## 🤖 BOT MODE (Backend)

### **Ne İşe Yarar?**

- Backend bot'ları oluşturur ve test yapar
- Kullanıcı TX onaylamak zorunda değil
- Hızlı ve otomatik
- Test/demo amaçlı

### **Kullanım**

#### **1. Mod Seç**

```
🦊 MetaMask Mode
🤖 Bot Mode [Seçili]
```

#### **2. Parametreleri Ayarla**

```
Contract Address: 0x77807CE01Fc861E8Be27b9aBfCC721F3c74f1a40
Function: globalInc / shardedInc
Bot Count: 30 (bot sayısı)
Burst Size: 30 (her bot'tan TX sayısı)
```

#### **3. Testi Çalıştır**

```
1. "Run Test" → Tıkla
2. Backend:
   → 30 bot oluşturur
   → Bot'ları sequential fonlar (nonce fix)
   → Test'i başlatır
3. WebSocket ile real-time güncellemeler
4. Sonuçları gör
```

#### **4. Deploy Yeni Contract**

```
1. "Deploy New Contracts" → Tıkla
2. Backend:
   → ParallelProbe compile eder
   → Deploy eder
   → Address döner
3. ✅ "Contracts deployed!
      ParallelProbe: 0x...
      View on explorer: https://..."
```

---

## 📊 TEST SONUÇLARI YORUMLAMA

### **Metrikler**

#### **1. Success Rate** ✅

```
Success Rate = (Başarılı TX / Toplam TX) * 100
```

- **95-100%**: Mükemmel
- **85-94%**: İyi
- **70-84%**: Orta
- **<70%**: Kötü (RPC problemi veya gas sorunu)

#### **2. Average Latency** ⏱️

```
Avg Latency = Ortalama TX süresi (ms)
```

- **<500ms**: Çok Hızlı 🚀
- **500-1500ms**: Hızlı ⚡
- **1500-3000ms**: Orta 🐢
- **>3000ms**: Yavaş 🐌

#### **3. P95 Latency** ⚡

```
P95 Latency = TX'lerin %95'inin altında kalan süre
```

- Outlier'ları görmezden gelir
- Gerçek performansı daha iyi gösterir

#### **4. Average Gas** ⛽

```
Avg Gas = Ortalama gas kullanımı
```

- **globalInc**: ~43,000-45,000 gas
- **shardedInc**: ~45,000-47,000 gas

#### **5. Parallel Score** 🎯

```
Score = (successRate * 0.4) + (latencyScore * 0.3) + (gasScore * 0.3)
```

**Yorumlama:**

- **90-100**: 🌟 Excellent - Tam paralelleştirme
  - Hotspot yok
  - State conflict yok
  - Monad parallel EVM'den tam faydalanıyor

- **70-89**: ⚡ Good - İyi paralelleştirme
  - Minimal conflict
  - Çoğu TX paralel çalışıyor
  - İyileştirme için alan var

- **50-69**: 🐢 Moderate - Orta paralelleştirme
  - Bazı hotspot'lar var
  - TX'ler kısmen serial
  - Kod optimizasyonu gerekli

- **<50**: 🔴 Poor - Zayıf paralelleştirme
  - Büyük hotspot
  - Çoğu TX serial çalışıyor
  - Shared state çok fazla
  - Kod refactor gerekli!

### **globalInc vs shardedInc Karşılaştırma**

#### **globalInc (Hotspot)**

```solidity
function globalInc(bytes32 tag) external {
  globalCounter++;  // Shared state!
}
```

**Beklenen Sonuçlar:**
```
Success Rate: 90-95%
Avg Latency: 2000-3000ms (yavaş)
Parallel Score: 40-60 (düşük)
```

**Neden Yavaş?**
- Tüm TX'ler aynı state'e yazıyor
- Monad conflict tespit ediyor
- TX'ler sırayla çalışıyor (serial)

#### **shardedInc (Parallel)**

```solidity
function shardedInc(bytes32 tag) external {
  shardedCounter[tag]++;  // Unique state!
}
```

**Beklenen Sonuçlar:**
```
Success Rate: 95-100%
Avg Latency: 500-1000ms (hızlı)
Parallel Score: 80-95 (yüksek)
```

**Neden Hızlı?**
- Her TX farklı state'e yazıyor
- Conflict yok
- TX'ler paralel çalışıyor
- Monad optimization tam aktif

---

## 🔍 ON-CHAIN DATA

### **Contract Stats Görüntüle**

```javascript
// Otomatik yüklenir (contract address girdikten sonra)
On-Chain Statistics:
  Total Tests: 15    → Bu contract'a kaç test yapıldı
  Avg Score: 75      → Ortalama parallel score
  Best Score: 92     → En iyi test skoru
  Worst Score: 58    → En kötü test skoru
```

### **Kendi Testlerini Gör**

```javascript
// Frontend'te (yakında)
My Tests:
  1. ParallelProbe - shardedInc - Score: 92 - 2 hours ago
  2. ParallelProbe - globalInc - Score: 55 - 5 hours ago
  3. MyContract - transfer - Score: 78 - 1 day ago
```

### **Explorer'da İncele**

```
Test Result TX:
https://testnet.monadexplorer.com/tx/0xabc123...

Contract:
https://testnet.monadexplorer.com/address/0x7292D3...
```

---

## 🎨 UI REHBERİ

### **Header**

```
🚀 Monad Parallel Execution Tester
Test your smart contracts for parallel execution performance

[Server Online] [0x1234...5678]

[🦊 MetaMask Mode] [🤖 Bot Mode]
```

### **Contract Input Panel**

```
Contract Address
┌─────────────────────────────────────┐
│ 0x77807CE01Fc861E8Be27b9aBfCC721F3c│
└─────────────────────────────────────┘

Test Function
○ globalInc (Hotspot Test)
● shardedInc (Parallel Test)

[MetaMask Mode]
TX Count: 30

[Bot Mode]
Bot Count: 30
Burst Size: 30

[Deploy New Contracts] [▶ Run Test]
```

### **Real-Time Chart**

```
Real-time Performance
┌────────────────────────────────────┐
│    Success ━━━━━━━━━━━━━━━ 28     │
│    Failed  ━━━━ 2                  │
│    Latency ━━━━━━━━━━━ 1200ms     │
└────────────────────────────────────┘
```

### **Test Results**

```
Test Results
┌─────────────────────────────────────┐
│ ✅ Success Rate: 93%               │
│ ⏱️  Avg Latency: 1200ms             │
│ ⚡ P95 Latency: 1800ms             │
│ ⛽ Avg Gas: 45,000                 │
│ 🎯 Parallel Score: 77/100          │
│                                     │
│ Sent: 30 | Success: 28 | Failed: 2│
└─────────────────────────────────────┘
```

### **On-Chain Stats**

```
On-Chain Statistics
┌─────────────────────────────────────┐
│   15          75                    │
│ Total Tests  Avg Score              │
│                                     │
│   92          58                    │
│ Best Score   Worst Score            │
│                                     │
│ 📊 Data from blockchain            │
└─────────────────────────────────────┘
```

### **Save Button**

```
┌─────────────────────────────────────┐
│ [💾 Save Results to Blockchain]    │
│                                     │
│ Store your test results permanently│
│ on Monad blockchain                 │
└─────────────────────────────────────┘
```

---

## 🐛 SORUN GIDERME

### **MetaMask Bağlanmıyor**

**Sorun:** "Connect MetaMask" butonu çalışmıyor

**Çözüm:**
```
1. MetaMask extension yüklü mü kontrol et
2. Browser console aç (F12)
3. window.ethereum var mı kontrol et
4. MetaMask'i unlock et
```

### **Wrong Network**

**Sorun:** "Please switch to Monad Testnet"

**Çözüm:**
```
1. MetaMask'i aç
2. Network dropdown → "Add Network"
3. Manuel ekle:
   - Name: Monad Testnet
   - RPC: https://monad-testnet.g.alchemy.com/v2/...
   - Chain ID: 10143
   - Currency: MON
```

### **Insufficient Funds**

**Sorun:** "insufficient funds for intrinsic transaction cost"

**Çözüm:**
```
1. Monad testnet faucet'ten MON al
2. Cüzdanında yeterli bakiye olduğunu kontrol et
3. Gas limit'i düşür
```

### **TX Başarısız**

**Sorun:** Test results: Success Rate < 70%

**Çözüm:**
```
1. RPC URL çalışıyor mu kontrol et
2. Gas limit yeterli mi kontrol et
3. Contract address doğru mu kontrol et
4. TX count'u azalt (30 → 10)
```

### **On-Chain Stats Görünmüyor**

**Sorun:** Stats kartı boş

**Çözüm:**
```
1. Contract address doğru mu?
2. Bu contract'a daha önce test yapıldı mı?
3. Provider bağlı mı? (MetaMask connected)
4. Console log'ları kontrol et
```

### **Save Başarısız**

**Sorun:** "Failed to save to blockchain"

**Çözüm:**
```
1. MetaMask bağlı mı?
2. Test sonucu var mı?
3. Cüzdanda gas için yeterli MON var mı?
4. TX'i onayla (reject etme)
```

---

## 💡 İPUÇLARI & BEST PRACTICES

### **Test İpuçları**

#### **1. Küçük Başla**

```
İlk test: TX Count = 10
Başarılı olursa: TX Count = 30, 50, 100
```

#### **2. Fonksiyonları Karşılaştır**

```
1. globalInc ile test yap → Score: 55
2. shardedInc ile test yap → Score: 92
3. Farkı gör → 37 puan iyileşme!
```

#### **3. Gas Limit Ayarla**

```javascript
// Düşük gas
const tx = await contract.globalInc(tag, {
  gasLimit: 50000  // Başarısız olabilir
})

// Yeterli gas
const tx = await contract.globalInc(tag, {
  gasLimit: 100000  // Güvenli
})
```

#### **4. Sonuçları Kaydet**

```
Her önemli testi blockchain'e kaydet!
- Geçmişi takip edebilirsin
- İyileşmeyi görebilirsin
- Stats otomatik güncellenir
```

### **Geliştirme İpuçları**

#### **1. Hotspot Tespit Et**

```solidity
// ❌ Hotspot (Yavaş)
uint256 public counter;
function increment() external {
  counter++;  // Hepsi aynı state
}

// ✅ No Hotspot (Hızlı)
mapping(address => uint256) public counters;
function increment() external {
  counters[msg.sender]++;  // Farklı state
}
```

#### **2. State Shard'la**

```solidity
// ❌ Global balance (Hotspot)
uint256 public totalBalance;

// ✅ User balances (Sharded)
mapping(address => uint256) public balances;
```

#### **3. Read-Heavy Operations**

```solidity
// Okuma paraleldir, yazma değil
function getBalance(address user) external view returns (uint256) {
  return balances[user];  // Conflict yok
}
```

#### **4. Batch Operations**

```solidity
// TX sayısını azalt
function batchTransfer(
  address[] calldata recipients, 
  uint256[] calldata amounts
) external {
  for (uint i = 0; i < recipients.length; i++) {
    _transfer(msg.sender, recipients[i], amounts[i]);
  }
}
```

---

## 📚 ÖRNEK SENARYOLAR

### **Senaryo 1: NFT Mint Testi**

```javascript
// 1. Contract deploy et (örnek NFT)
contract MyNFT {
  uint256 public totalSupply;
  mapping(uint256 => address) public owners;
  
  function mint() external {
    uint256 tokenId = totalSupply++;
    owners[tokenId] = msg.sender;
  }
}

// 2. Test yap
Contract: 0xNFT...
Function: mint
TX Count: 50

// 3. Sonuç
Success Rate: 88%
Parallel Score: 62 (Orta)
// totalSupply hotspot oluşturuyor!

// 4. İyileştir
function mint() external {
  uint256 tokenId = keccak256(abi.encode(msg.sender, block.timestamp));
  owners[tokenId] = msg.sender;
  // totalSupply kaldırıldı!
}

// 5. Tekrar test
Parallel Score: 89 (İyi) ✅
```

### **Senaryo 2: Token Transfer**

```solidity
// Token kontrat
contract MyToken {
  mapping(address => uint256) public balances;
  
  function transfer(address to, uint256 amount) external {
    balances[msg.sender] -= amount;
    balances[to] += amount;
  }
}

// Test
TX Count: 30 (Hepsi farklı alıcılar)

// Sonuç
Parallel Score: 85 ✅
// Farklı addresses → Paralelleşir
```

### **Senaryo 3: Auction Bid**

```solidity
// Auction
contract Auction {
  uint256 public highestBid;
  address public highestBidder;
  
  function bid() external payable {
    require(msg.value > highestBid);
    highestBid = msg.value;
    highestBidder = msg.sender;
  }
}

// Test
TX Count: 20

// Sonuç
Parallel Score: 35 ❌
// highestBid/highestBidder hotspot!

// İyileştirme?
// Auction için serial mantıklı (highest bid sırayla belirlenir)
// Farklı auction'lar → Paralel
```

---

## 🚀 İLERİ KULLANIM

### **Custom Contract Testi**

```javascript
// 1. Kendi kontratını deploy et
// 2. Contract address'i kopyala
// 3. Frontend'e yapıştır
// 4. Function seç
// 5. Test et!
```

### **API Entegrasyonu**

```javascript
// Backend API kullan
const response = await fetch('http://localhost:3001/api/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractAddress: '0x...',
    functionName: 'globalInc',
    botsCount: 30,
    burstSize: 30
  })
})

// WebSocket ile sonuçları al
const ws = new WebSocket('ws://localhost:3001')
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'result') {
    console.log('Test completed:', data.data)
  }
}
```

### **Batch Testing**

```javascript
// Birden fazla contract test et
const contracts = [
  '0xContract1...',
  '0xContract2...',
  '0xContract3...'
]

for (const address of contracts) {
  await runTest(address, 'functionName', 30)
  await delay(5000)  // Wait between tests
}
```

---

## 📞 DESTEK

**Sorular?**
- GitHub Issues: [link]
- Discord: [link]
- Dokümantasyon: `/docs`

**Raporlar:**
- Bug: GitHub Issues
- Feature Request: GitHub Discussions

---

**Son Güncelleme:** 04 Ekim 2025  
**Versiyon:** 2.0 (Full DApp)

**Keyifli testler! 🚀**

