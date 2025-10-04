# 🏗️ SISTEM MİMARİSİ - Monad Parallel Tester

**Güncellenme:** 04 Ekim 2025  
**Durum:** ✅ Tam Entegre DApp

---

## 📊 GENEL MİMARİ

```
┌─────────────────────────────────────────────────────────────────┐
│                        KULLANICI (USER)                          │
│                                                                   │
│                    ┌──────────────────┐                         │
│                    │    MetaMask      │                         │
│                    │   (Ethereum      │                         │
│                    │    Provider)     │                         │
│                    └────────┬─────────┘                         │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  App.jsx   │  │  Hooks     │  │  Utils     │                │
│  │            │  │            │  │            │                │
│  │ • UI State │  │ useMetaMask│  │ api.js     │                │
│  │ • Routing  │  │ useWebSock │  │ blockchain │                │
│  └────┬───────┘  └────┬───────┘  └────┬───────┘                │
│       │               │               │                         │
│       └───────────────┴───────────────┘                         │
└────────────────┬──────────────────┬────────────────────────────┘
                 │                  │
         ┌───────┴────────┐  ┌──────┴──────────────┐
         │                │  │                     │
         ↓                ↓  ↓                     ↓
┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   BACKEND      │  │   BLOCKCHAIN     │  │   SMART          │
│   (Node.js)    │  │   (Monad RPC)    │  │   CONTRACTS      │
│                │  │                  │  │                  │
│ • Bot Creator  │  │ • Provider       │  │ ParallelProbe    │
│ • Test Runner  │  │ • Read/Write     │  │ TestResult       │
│ • WebSocket    │  │ • Events         │  │   Storage        │
└────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🔄 VERİ AKIŞI

### 1. 🦊 METAMASK MODE (DApp Modu)

**Kullanıcı Test Çalıştırır:**

```
1. User clicks "Connect MetaMask"
   └→ Frontend: useMetaMask.connect()
      └→ window.ethereum.request({ method: 'eth_requestAccounts' })
         └→ MetaMask: Prompt açılır
            └→ User: Onaylar
               └→ Frontend: account, signer alır

2. User enters Contract Address
   └→ Frontend: setContractAddress(address)
      └→ blockchain.getContractStats(provider, address)
         └→ Blockchain: TestResultStorage.getContractStats() çağrılır
            └→ Returns: { testCount, avgScore, bestScore, worstScore }
               └→ Frontend: On-Chain Stats güncellenir

3. User clicks "Run Test"
   └→ Frontend: handleRunTestWithMetaMask()
      └→ blockchain.runParallelTest(signer, address, function, txCount)
         └→ For each TX:
            └→ contract[functionName](tag, { gasLimit })
               └→ MetaMask: TX approval prompt
                  └→ User: Onaylar
                     └→ Blockchain: TX madende
                        └→ Receipt: wait() ile dönüş
                           └→ Frontend: Metrik hesaplama
                              └→ UI: Real-time update

4. Test completes
   └→ Frontend: Test results gösterilir
      └→ User clicks "Save to Blockchain"
         └→ Frontend: handleSaveToBlockchain()
            └→ blockchain.saveTestToBlockchain(signer, results)
               └→ Contract: TestResultStorage.storeTestResult()
                  └→ MetaMask: TX approval
                     └→ Blockchain: Sonuçlar kaydedilir
                        └→ Event: TestCompleted emit
                           └→ Frontend: Success mesajı
```

**Veri Akış Özeti:**
```
User → MetaMask → Frontend → Blockchain → Smart Contract
                     ↓                           ↓
                  Metrics                    Storage
                     ↓                           ↓
                    UI  ←──── Read Stats ────────┘
```

---

### 2. 🤖 BOT MODE (Backend Modu)

**Backend Test Çalıştırır:**

```
1. User clicks "Run Test" (Bot Mode)
   └→ Frontend: handleRunTest()
      └→ api.runTest({ contractAddress, functionName, botsCount, burstSize })
         └→ HTTP POST: /api/test
            └→ Backend: server/index.js
               └→ TestService.executeTest()
                  
2. Backend: Bot Creation
   └→ TestService.createBots(count, fundWei)
      └→ For each bot:
         └→ Wallet.createRandom()
            └→ masterWallet.sendTransaction({ to: bot, value: fundWei })
               ⏱️ Delay 100ms (nonce fix)
               └→ Blockchain: Bot funded

3. Backend: Test Execution
   └→ TestService.runTestWithBots(bots, contract, function, burstSize)
      └→ For each bot:
         └→ bot.sendTransaction(contract[function](tag))
            └→ Blockchain: TX madende
               └→ WebSocket: Progress update
                  └→ Frontend: Real-time chart güncellenir

4. Backend: Metric Calculation
   └→ TestService.calculateMetrics(results)
      └→ { successRate, avgLatency, p95Latency, avgGas, parallelScore }
         └→ WebSocket: Result event
            └→ Frontend: Test Results gösterilir
```

**Veri Akış Özeti:**
```
User → Frontend → Backend → Bots → Blockchain
         ↑           ↓
      WebSocket   Metrics
         ↑           ↓
      Real-time   Results
```

---

## 🧩 BILEŞENLER

### **FRONTEND** (`frontend/`)

#### **1. Components**

**App.jsx** (Ana Komponent)
```javascript
- State Management
  • contractAddress, functionName, txCount
  • testResults, realTimeData
  • useMetaMaskMode (toggle)
  • onChainStats

- Hooks
  • useMetaMask() → { account, signer, provider, connect }
  • useWebSocket() → { lastMessage, sendMessage, isConnected }

- Functions
  • handleRunTestWithMetaMask() → MetaMask ile test
  • handleRunTest() → Backend ile test
  • handleSaveToBlockchain() → Sonuçları kaydet
  • loadOnChainStats() → Blockchain'den stats oku
```

**ContractInput.jsx**
```javascript
Props:
  - contractAddress, setContractAddress
  - functionName, setFunctionName
  - txCount, setTxCount
  - onRunTest (mode'a göre: MetaMask veya Backend)
  - isRunning, isDeploying
```

**TestResults.jsx**
```javascript
Props:
  - results: {
      sent, success, failed,
      avgLatency, p95Latency,
      avgGas, successRate, parallelScore
    }

Display:
  - Success Rate, Latency, Gas, Parallel Score
```

**RealTimeChart.jsx**
```javascript
Props:
  - data: [ { time, completed, success, failed, latency } ]

Library: Recharts
Chart: LineChart (Success vs Failed vs Latency)
```

#### **2. Hooks**

**useMetaMask.js**
```javascript
Returns:
  - account: string (0x...)
  - signer: ethers.Signer
  - provider: ethers.Provider
  - isConnected: boolean
  - connect: function
  - isConnecting: boolean
  - error: string

Implementation:
  1. Check window.ethereum
  2. Request accounts (eth_requestAccounts)
  3. Create BrowserProvider + Signer
  4. Listen account/chain changes
```

**useWebSocket.js**
```javascript
Returns:
  - lastMessage: MessageEvent
  - sendMessage: function
  - isConnected: boolean

Events:
  - 'progress': { completed, success, failed, currentLatency }
  - 'result': { data: testResults }
  - 'error': { message }
```

#### **3. Utils**

**blockchain.js**
```javascript
Functions:
  • runParallelTest(signer, address, function, txCount, onProgress)
    → Sends TX'ler, collects results, calculates metrics
    
  • saveTestToBlockchain(signer, testResult)
    → Calls TestResultStorage.storeTestResult()
    
  • getContractStats(provider, contractAddress)
    → Returns { testCount, avgScore, bestScore, worstScore }
    
  • getUserTests(provider, userAddress)
    → Returns testId array
    
  • getLatestTests(provider, count)
    → Returns latest test results

Helpers:
  • calculateP95(values)
  • calculateParallelScore(successRate, avgLatency, avgGas)
  • generateRandomTag()
  • formatAddress(address)
```

**api.js**
```javascript
Functions:
  • runTest({ contractAddress, functionName, botsCount, burstSize })
    → POST /api/test
    
  • deployContracts()
    → POST /api/deploy
```

#### **4. Config**

**config.js**
```javascript
export const CONTRACTS = {
  PARALLEL_PROBE: '0x77807CE01Fc861E8Be27b9aBfCC721F3c74f1a40',
  TEST_RESULT_STORAGE: '0x7292D3AE85DebfA706B417299Bcc5F935bb84aFC'
}

export const NETWORK = {
  CHAIN_ID: 10143,
  NAME: 'Monad Testnet',
  RPC_URL: 'https://monad-testnet.g.alchemy.com/v2/...',
  EXPLORER_URL: 'https://testnet.monadexplorer.com'
}

export const ABIS = {
  PARALLEL_PROBE: [...],
  TEST_RESULT_STORAGE: [...]
}
```

---

### **BACKEND** (`backend/`)

#### **1. Server**

**server/index.js**
```javascript
Express Server:
  - Port: 3001
  - CORS enabled
  - WebSocket enabled (ws://)

Routes:
  POST /api/test
    → Body: { contractAddress, functionName, botsCount, burstSize }
    → Calls: TestService.executeTest()
    → Returns: Test starts, results via WebSocket
    
  POST /api/deploy
    → Compiles & deploys contracts
    → Returns: { probeAddress, resultAddress, explorerUrls }

WebSocket:
  - Broadcasts: progress, result, error events
```

#### **2. Services**

**TestService.js**
```javascript
class TestService {
  constructor(provider, masterWallet)
  
  async createBots(count, fundWei)
    → Creates random wallets
    → Funds SEQUENTIALLY (nonce fix)
    → Delay 100ms between TX (rate limit fix)
    
  async runTestWithBots(bots, contract, functionName, burstSize)
    → Bots send TX in parallel
    → Collects latency, gas, success/fail
    
  async calculateMetrics(results)
    → avgLatency, p95Latency, avgGas
    → successRate, parallelScore
    
  async executeTest(params, ws)
    → Full test flow:
      1. Create bots
      2. Run test
      3. Calculate metrics
      4. Send results via WebSocket
}
```

**ContractService.js**
```javascript
class ContractService {
  compile(solidityPath, contractName)
    → Uses solc compiler
    → Returns { abi, bytecode }
    
  async deploy(wallet, bytecode, abi, args)
    → Deploys to blockchain
    → Returns contract instance
}
```

**WebSocketService.js**
```javascript
class WebSocketService {
  broadcast(ws, type, data)
    → Sends JSON message
    
  Types:
    - 'progress'
    - 'result'
    - 'error'
    - 'test_started'
}
```

---

### **BLOCKCHAIN** (Monad Testnet)

#### **Smart Contracts**

**ParallelProbe.sol**
```solidity
// Test kontratı
contract ParallelProbe {
  uint256 public globalCounter;  // Hotspot (shared state)
  mapping(bytes32 => uint256) public shardedCounter;  // Parallel
  
  function globalInc(bytes32 tag) external {
    globalCounter++;  // Contention oluşur
  }
  
  function shardedInc(bytes32 tag) external {
    shardedCounter[tag]++;  // Paralelleşir
  }
}
```

**TestResultStorage.sol**
```solidity
// Sonuç kayıt kontratı
contract TestResultStorage {
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
  
  struct ContractStats {
    uint256 testCount;
    uint256 totalScore;
    uint256 avgScore;
    uint256 bestScore;
    uint256 worstScore;
  }
  
  mapping(bytes32 => TestResult) public tests;
  mapping(address => ContractStats) public contractStats;
  
  function storeTestResult(bytes32 testId, TestResult memory result) external
  function getContractStats(address contractAddress) external view returns (ContractStats)
  function getLatestTests(uint256 count) external view returns (TestResult[])
}
```

---

## 🔐 GÜVENLİK & BEST PRACTICES

### **1. Frontend Security**

```javascript
// ✅ Contract address validation
if (!ethers.isAddress(contractAddress)) {
  throw new Error('Invalid contract address')
}

// ✅ Gas limit protection
const tx = await contract.globalInc(tag, {
  gasLimit: 100000  // Max limit
})

// ✅ Error handling
try {
  await tx.wait()
} catch (error) {
  // User rejected or TX failed
  console.error('TX failed:', error)
}
```

### **2. Backend Security**

```javascript
// ✅ Private key from env
const masterWallet = new Wallet(process.env.MASTER_PRIVATE_KEY)

// ✅ Rate limiting (nonce fix)
for (let i = 0; i < bots.length; i++) {
  await fundBot(i)
  await delay(100)  // Prevent rate limit
}

// ✅ Input validation
if (!contractAddress || !ethers.isAddress(contractAddress)) {
  throw new Error('Invalid input')
}
```

### **3. Smart Contract Security**

```solidity
// ✅ Input validation
require(result.contractAddress != address(0), "Invalid address");
require(result.sent > 0, "Invalid sent count");

// ✅ Access control (if needed)
modifier onlyTester() {
  require(msg.sender == tester, "Not authorized");
  _;
}

// ✅ Event emission
event TestCompleted(bytes32 indexed testId, address indexed tester, uint256 score);
```

---

## 📈 METRİK HESAPLAMALARI

### **Success Rate**
```javascript
successRate = (successCount / totalTxCount) * 100
```

### **Average Latency**
```javascript
avgLatency = sum(latencies) / latencies.length
```

### **P95 Latency**
```javascript
sorted = latencies.sort()
p95Index = floor(0.95 * sorted.length)
p95Latency = sorted[p95Index]
```

### **Average Gas**
```javascript
avgGas = sum(gasUsed) / successCount
```

### **Parallel Score** (0-100)
```javascript
latencyScore = max(0, 100 - (avgLatency / 50))
gasScore = max(0, 100 - (avgGas / 1000))

parallelScore = (successRate * 0.4) + 
                (latencyScore * 0.3) + 
                (gasScore * 0.3)
```

**Yorumlama:**
- **90-100**: Excellent parallelization
- **70-89**: Good parallelization
- **50-69**: Moderate parallelization
- **<50**: Poor parallelization (hotspot detected)

---

## 🚀 DEPLOYMENT

### **1. Backend Deployment**

```bash
cd backend
npm install

# .env dosyasını ayarla
MONAD_RPC_URL=https://monad-testnet.g.alchemy.com/v2/YOUR_KEY
MASTER_PRIVATE_KEY=0x...

# Deploy contracts
npm run deploy

# Start server
npm run dev  # Port 3001
```

### **2. Frontend Deployment**

```bash
cd frontend
npm install

# .env.local dosyasını ayarla
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Start dev server
npm run dev  # Port 5173

# Build for production
npm run build
npm run preview
```

---

## 🔧 TROUBLESHOOTING

### **MetaMask Bağlanmıyor**
```javascript
// 1. Check MetaMask installed
if (!window.ethereum) {
  alert('Please install MetaMask')
}

// 2. Check network
const chainId = await window.ethereum.request({ method: 'eth_chainId' })
if (chainId !== '0x279F') {  // 10143
  // Switch network
}
```

### **Bot Funding Başarısız**
```javascript
// Sequential funding + delay
for (let i = 0; i < bots.length; i++) {
  await masterWallet.sendTransaction({...})
  await tx.wait()
  await new Promise(resolve => setTimeout(resolve, 100))
}
```

### **Blockchain Read Başarısız**
```javascript
// Provider kontrolü
if (!provider) {
  console.error('Provider not connected')
  return
}

// Contract address validation
if (!ethers.isAddress(contractAddress)) {
  console.error('Invalid address')
  return
}
```

---

## 📚 KAYNAKLAR

- **Ethers.js v6**: https://docs.ethers.org/v6/
- **Monad Testnet**: https://testnet.monadexplorer.com
- **Alchemy RPC**: https://docs.alchemy.com
- **React Hooks**: https://react.dev/reference/react
- **Solidity Docs**: https://docs.soliditylang.org

---

**Son Güncelleme:** 04 Ekim 2025  
**Versiyon:** 2.0 (Full DApp)

