# 🚀 Monad Parallel Execution Testing Framework

A comprehensive framework for testing smart contract parallel execution performance on the Monad blockchain.

## 📋 Features

- ✅ Smart contract parallel execution testing
- ✅ Real-time WebSocket updates
- ✅ Hotspot vs Parallel-friendly comparison
- ✅ Detailed performance metrics
- ✅ Automatic contract deployment
- ✅ Visual performance charts
- ✅ Modular framework architecture

## 🏗️ Framework Structure

```
monad-parallel-tester-framework/
├── backend/                    # Backend services
│   ├── src/
│   │   ├── server/            # Express server
│   │   ├── contracts/         # Smart contracts
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── config/            # Configuration
│   ├── package.json
│   └── .env.example
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # CSS styles
│   │   └── config/            # Frontend config
│   ├── package.json
│   └── .env.example
├── contracts/                  # Smart contracts
│   ├── ParallelProbe.sol
│   └── TestResultStorage.sol
├── scripts/                    # Setup and deployment scripts
├── docs/                       # Documentation
├── examples/                   # Usage examples
└── package.json               # Root package.json
```

## 🛠️ Quick Start

### Otomatik Başlatma (Windows)

```powershell
# Tek komutla tüm sistemi başlat
cd monad-parallel-tester-framework
.\START.ps1
```

Script otomatik olarak:
- ✅ Gerekli dosyaları kontrol eder
- ✅ Eski process'leri temizler
- ✅ Backend'i başlatır (port 3001)
- ✅ Frontend'i başlatır (port 5173)
- ✅ Tarayıcıda açar

### Manuel Başlatma

#### 1. Installation

```bash
# Clone the framework
git clone <repository-url>
cd monad-parallel-tester-framework

# Install dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

#### 2. Configuration

```bash
# Windows PowerShell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\env.example frontend\.env.local

# Linux/Mac
cp backend/.env.example backend/.env
cp frontend/env.example frontend/.env.local

# Configure your settings
# Edit backend/.env with your Monad RPC URL and private key
# Edit frontend/.env.local with your API URLs
```

**ÖNEMLİ:** `frontend/postcss.config.js` dosyasının var olduğundan emin olun!

#### 3. Run the Framework

**Windows PowerShell:**
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Linux/Mac:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### 4. Open in Browser

```
http://localhost:5173
```

## 📚 Documentation

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Configuration Guide](docs/configuration.md)
- [Smart Contracts](docs/smart-contracts.md)
- [Deployment Guide](docs/deployment.md)

## 🔧 Framework Components

### Backend Services
- **Server**: Express.js server with WebSocket support
- **Contract Manager**: Smart contract deployment and interaction
- **Test Engine**: Parallel execution testing logic
- **WebSocket Service**: Real-time communication

### Frontend Components
- **Test Interface**: User-friendly testing interface
- **Real-time Charts**: Performance visualization
- **Contract Input**: Configuration and deployment
- **Results Display**: Test results and metrics

### Smart Contracts
- **ParallelProbe**: Test contract with hotspot and parallel functions
- **TestResultStorage**: Result storage and retrieval

## 🎯 Usage Examples

### Basic Testing
```javascript
import { MonadTester } from '@monad-parallel-tester/core';

const tester = new MonadTester({
  rpcUrl: 'https://monad-testnet.g.alchemy.com/v2/YOUR_KEY',
  privateKey: 'your_private_key'
});

// Deploy test contracts
const contracts = await tester.deploy();

// Run parallel test
const results = await tester.runTest({
  contractAddress: contracts.probeAddress,
  functionName: 'globalInc',
  botsCount: 30,
  burstSize: 30
});
```

### Custom Test Functions
```javascript
// Add custom test functions to your contract
const customContract = await tester.deployCustom({
  source: 'contracts/MyTestContract.sol',
  contractName: 'MyTestContract'
});
```

## 🔗 Integration

### With Existing Projects
```javascript
// Install as npm package
npm install @monad-parallel-tester/core

// Use in your project
import { MonadTester, TestRunner } from '@monad-parallel-tester/core';
```

### With CI/CD
```yaml
# GitHub Actions example
- name: Run Monad Tests
  run: |
    npm install @monad-parallel-tester/core
    npx monad-tester test --config ./test-config.json
```

## 📊 Performance Metrics

- **Success Rate**: Percentage of successful transactions
- **Average Latency**: Mean transaction processing time
- **P95 Latency**: 95th percentile latency
- **Average Gas**: Mean gas consumption
- **Parallel Score**: Overall performance score (0-100)

## 🔍 Test Types

### Hotspot Tests
- **globalInc**: All transactions conflict (worst case)
- **globalCounter**: Shared state access

### Parallel-Friendly Tests
- **shardedInc**: Independent storage slots
- **userCounter**: Per-user counters

## 🛡️ Security

- Private keys are never logged or stored
- Testnet-only by default
- Environment variable configuration
- Secure WebSocket connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Links

- [Monad Documentation](https://docs.monad.xyz/)
- [Monad Testnet Explorer](https://testnet.monadexplorer.com/)
- [Monad Faucet](https://faucet.monad.xyz)
- [Alchemy Monad Docs](https://www.alchemy.com/docs/reference/monad-api-quickstart)

## ⚠️ Important Notes

- This framework is for testing purposes only
- Never use real private keys in production
- Always test on testnet first
- Keep your API keys secure
