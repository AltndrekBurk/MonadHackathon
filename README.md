# 🚀 Monad Parallel Execution DApp

> Interactive DApp for testing smart contract parallel execution performance on Monad Testnet

## ✨ Features

- 🎯 **Interactive Frontend** - Modern React UI with real-time charts
- 🔗 **Contract Address Input** - Test any deployed contract
- 📊 **Real-time Metrics** - Live performance monitoring
- 🌐 **WebSocket Support** - Instant test result updates
- 📈 **Visual Analytics** - Charts and performance scoring
- 🔧 **Easy Deployment** - One-click contract deployment

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

### 2. Configure Environment

Create `.env` file:

```env
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=10143
MASTER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
BOTS_COUNT=30
BOT_FUND_WEI=100000000000000000
SERVER_PORT=3001
FRONTEND_PORT=3000
```

### 3. Get Test MON

Visit [Monad Faucet](https://faucet.monad.xyz) to get test tokens.

### 4. Deploy Contracts

```bash
npm run deploy
```

Add the deployed addresses to your `.env` file.

### 5. Start the DApp

```bash
# Start both backend and frontend
npm run dev
```

Visit `http://localhost:3000` to use the DApp!

## 🎮 Usage

1. **Enter Contract Address** - Paste your deployed contract address
2. **Select Function** - Choose `globalInc` (hotspot) or `shardedInc` (parallel)
3. **Run Test** - Click "Run Parallel Test" button
4. **View Results** - See real-time performance metrics and charts

## 📊 Performance Metrics

- **Success Rate** - Percentage of successful transactions
- **Average Latency** - Mean transaction processing time
- **P95 Latency** - 95th percentile latency
- **Parallel Score** - Overall performance score (0-100)
- **Gas Usage** - Average gas consumption

## 🔧 API Endpoints

- `POST /api/deploy` - Deploy test contracts
- `POST /api/test` - Run parallel execution test
- `GET /api/history/:address` - Get test history

## 🌐 WebSocket Events

- `progress` - Real-time test progress updates
- `result` - Final test results

## 📁 Project Structure

```
monad-parallel-dapp/
├── contracts/           # Solidity contracts
├── scripts/            # Deployment scripts
├── backend/            # Express server + WebSocket
├── frontend/           # React DApp
└── package.json        # Root dependencies
```

## 🎯 Test Scenarios

### Hotspot Detection (globalInc)
- All transactions write to same storage slot
- Expected: ~60% success rate, high latency

### Parallel Performance (shardedInc)
- Each transaction writes to different storage slot
- Expected: ~95% success rate, low latency

## 🔍 Explorer Links

- [Monad Testnet Explorer](https://explorer.testnet.monad.xyz)
- [Monad Faucet](https://faucet.monad.xyz)
- [Monad Documentation](https://docs.monad.xyz)

## 🛠️ Development

```bash
# Backend only
npm run server

# Frontend only
npm run client

# Build for production
npm run build
```

## 📝 License

MIT License - see LICENSE file for details

---

**⚡ Happy Testing on Monad Testnet! ⚡**
