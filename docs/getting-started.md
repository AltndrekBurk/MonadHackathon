# Getting Started with Monad Parallel Tester Framework

This guide will help you set up and run the Monad Parallel Tester Framework for testing smart contract parallel execution performance.

## Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- A Monad testnet RPC URL (Alchemy recommended)
- Test MON tokens from the faucet

## Quick Setup

### 1. Clone and Install

```bash
# Clone the framework
git clone <repository-url>
cd monad-parallel-tester-framework

# Run the setup script
npm run setup
```

### 2. Configure Environment

Edit `backend/.env` with your configuration:

```env
# Get from https://www.alchemy.com/
MONAD_RPC_URL=https://monad-testnet.g.alchemy.com/v2/YOUR_API_KEY

# Get from https://faucet.monad.xyz
MASTER_PRIVATE_KEY=your_private_key_here
```

### 3. Deploy Contracts

```bash
# Deploy test contracts
npm run deploy
```

### 4. Start the Framework

```bash
# Start both backend and frontend
npm run dev
```

Open your browser to `http://localhost:5173`

## Manual Setup

If you prefer to set up manually:

### Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp env.example .env.local
# Edit .env.local if needed
npm run dev
```

## Getting Test MON

1. Visit [Monad Faucet](https://faucet.monad.xyz)
2. Enter your wallet address (derived from MASTER_PRIVATE_KEY)
3. Request test MON tokens
4. Wait for confirmation

## Getting Alchemy API Key

1. Visit [Alchemy](https://www.alchemy.com/)
2. Create an account
3. Create a new app
4. Select "Monad Testnet" as the network
5. Copy the API key to your `.env` file

## Running Your First Test

1. Open the web interface at `http://localhost:5173`
2. Click "Deploy Test Contract" to deploy the test contracts
3. Select a test function:
   - **globalInc**: Hotspot test (all transactions conflict)
   - **shardedInc**: Parallel test (independent storage)
4. Configure bot count and burst size
5. Click "Run Parallel Test"
6. Watch real-time results!

## Understanding Results

### Performance Metrics

- **Success Rate**: Percentage of successful transactions
- **Average Latency**: Mean transaction processing time
- **P95 Latency**: 95th percentile latency
- **Average Gas**: Mean gas consumption per transaction
- **Parallel Score**: Overall performance score (0-100)

### Test Functions

#### globalInc (Hotspot)
```solidity
function globalInc(bytes32 tag) external {
    globalCounter += 1;  // All transactions conflict here!
    userCounter[msg.sender] += 1;
}
```

#### shardedInc (Parallel-Friendly)
```solidity
function shardedInc(bytes32 tag) external {
    userCounter[msg.sender] += 1;  // Independent per user
}
```

## Troubleshooting

### Common Issues

**"Insufficient balance" error**
- Get test MON from the faucet
- Check your private key is correct

**WebSocket connection failed**
- Ensure backend is running on port 3001
- Check firewall settings

**Contract deployment failed**
- Verify RPC URL is correct
- Check private key format (should start with 0x)
- Ensure you have test MON

**High latency**
- Check network conditions
- Try reducing burst size
- Verify gas limits

### Getting Help

- Check the [API Reference](api-reference.md)
- Review [Configuration Guide](configuration.md)
- Look at [Examples](examples/)
- Open an issue on GitHub

## Next Steps

- Explore the [API Reference](api-reference.md) for programmatic usage
- Check out [Examples](examples/) for advanced use cases
- Read about [Smart Contracts](smart-contracts.md) for custom testing
- Learn about [Deployment](deployment.md) for production setup
