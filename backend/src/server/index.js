/**
 * @file server/index.js
 * @description Express server with WebSocket support for real-time test results
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import solc from 'solc';
import dotenv from 'dotenv';
import { Wallet, JsonRpcProvider, ContractFactory, Contract } from 'ethers';

// Import services
import { TestService } from '../services/TestService.js';
import { ContractService } from '../services/ContractService.js';
import { WebSocketService } from '../services/WebSocketService.js';
import EventListenerService from '../services/EventListenerService.js';
import { config } from '../config/index.js';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ================================
// CONFIGURATION
// ================================

const PORT = config.server.port;
const RPC_URL = config.blockchain.rpcUrl;
const provider = new JsonRpcProvider(RPC_URL);
const master = new Wallet(config.blockchain.masterPrivateKey, provider);

// ================================
// HELPER FUNCTIONS
// ================================

function compile(filePath, contractName) {
  console.log(`📦 Compiling ${contractName}...`);
  
  const source = readFileSync(filePath, 'utf8');
  
  const input = {
    language: 'Solidity',
    sources: {
      [contractName + '.sol']: { content: source }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length) {
      console.error('❌ Compilation errors:', errors);
      throw new Error('Solc compile error');
    }
  }

  const compiled = output.contracts[contractName + '.sol'][contractName];
  
  return {
    abi: compiled.abi,
    bytecode: '0x' + compiled.evm.bytecode.object
  };
}

function randTag() {
  const array = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return '0x' + Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function p95(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function computeParallelScore(successRate, avgLatency, avgGas) {
  const sr = successRate;
  const latScore = Math.max(0, 100 - Math.min(100, Math.round(avgLatency / 50)));
  const gasScore = Math.max(0, 100 - Math.min(100, Math.round(avgGas / 1000)));
  return Math.round(sr * 0.4 + latScore * 0.3 + gasScore * 0.3);
}

// ================================
// EXPRESS SERVER
// ================================

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

// Initialize services
const webSocketService = new WebSocketService();
const contractService = new ContractService(provider, master);
const testService = new TestService(provider, master, webSocketService);

// ================================
// API ROUTES
// ================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'online',
    network: RPC_URL 
  });
});

// Deploy contracts
app.post('/api/deploy', async (req, res) => {
  try {
    console.log('🚀 Deploying contracts...');
    
    // Check balance first
    const balance = await provider.getBalance(await master.getAddress());
    console.log('💰 Master balance:', balance.toString(), 'wei');
    
    if (balance === 0n) {
      throw new Error('Insufficient balance! Get test MON from https://faucet.monad.xyz');
    }

    // Resolve contract paths from project root
    const contractsPath = join(__dirname, '../../../contracts');
    const probe = compile(join(contractsPath, 'ParallelProbe.sol'), 'ParallelProbe');
    const resultStorage = compile(join(contractsPath, 'TestResultStorage.sol'), 'TestResultStorage');

    console.log('📝 Deploying ParallelProbe...');
    const ProbeFactory = new ContractFactory(probe.abi, probe.bytecode, master);
    const probeCtr = await ProbeFactory.deploy();
    await probeCtr.waitForDeployment();
    const probeAddr = await probeCtr.getAddress();
    console.log('✅ ParallelProbe deployed at:', probeAddr);

    console.log('📝 Deploying TestResultStorage...');
    const RSFactory = new ContractFactory(resultStorage.abi, resultStorage.bytecode, master);
    const rsCtr = await RSFactory.deploy();
    await rsCtr.waitForDeployment();
    const rsAddr = await rsCtr.getAddress();
    console.log('✅ TestResultStorage deployed at:', rsAddr);

    res.json({
      success: true,
      probeAddress: probeAddr,
      resultAddress: rsAddr,
      explorerUrls: {
        probe: `https://testnet.monadexplorer.com/address/${probeAddr}`,
        result: `https://testnet.monadexplorer.com/address/${rsAddr}`
      }
    });
  } catch (error) {
    console.error('❌ Deploy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run stress test
app.post('/api/test', async (req, res) => {
  try {
    const { contractAddress, functionName, botsCount = 30, burstSize = 30 } = req.body;
    
    if (!contractAddress || !functionName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contract address and function name required' 
      });
    }

    console.log(`🧪 Running test: ${functionName} on ${contractAddress}`);
    console.log(`👥 Bots: ${botsCount}, Burst: ${burstSize}`);

    // Broadcast test start
    webSocketService.broadcast({ 
      type: 'test_started',
      contractAddress,
      functionName,
      botsCount,
      burstSize
    });

    // Create bots
    const bots = [];
    for (let i = 0; i < botsCount; i++) {
      bots.push(Wallet.createRandom().connect(provider));
    }

    // Fund bots
    console.log('💸 Funding bots...');
    const fundWei = BigInt(process.env.BOT_FUND_WEI || '100000000000000000'); // 0.1 MON
    
    const fundPromises = [];
    for (let i = 0; i < bots.length; i++) {
      const promise = (async () => {
        try {
          const tx = await master.sendTransaction({
            to: await bots[i].getAddress(),
            value: fundWei
          });
          await tx.wait();
        } catch (error) {
          console.error(`Failed to fund bot ${i}:`, error.message);
        }
      })();
      fundPromises.push(promise);
    }
    
    await Promise.all(fundPromises);
    console.log('✅ Bots funded');

    // Contract ABI
    const PROBE_ABI = [
      'function globalInc(bytes32 tag)',
      'function shardedInc(bytes32 tag)',
      'event Hit(address indexed sender, bytes32 tag, uint256 globalValue, uint256 userValue)'
    ];

    const contract = new Contract(contractAddress, PROBE_ABI, provider);

    // Launch stress test
    console.log('🔥 Launching stress test...');
    const calls = [];
    const latencies = [];
    let ok = 0;
    let fail = 0;
    let gasSum = 0n;
    let gasCount = 0n;

    for (let i = 0; i < burstSize; i++) {
      const wallet = bots[i % bots.length];
      const connectedContract = contract.connect(wallet);
      const tag = randTag();

      const promise = (async () => {
        const startTime = Date.now();
        
        try {
          const tx = await connectedContract[functionName](tag, {
            gasLimit: 100000 // Set reasonable gas limit
          });
          const receipt = await tx.wait();
          const endTime = Date.now();
          const latency = endTime - startTime;
          
          latencies.push(latency);

          if (receipt.status === 1) {
            ok++;
            gasSum += receipt.gasUsed;
            gasCount += 1n;
          } else {
            fail++;
          }

          // Send real-time update
          const progress = {
            type: 'progress',
            completed: ok + fail,
            total: burstSize,
            success: ok,
            failed: fail,
            currentLatency: latency
          };
          
          webSocketService.broadcast(progress);

        } catch (error) {
          const endTime = Date.now();
          latencies.push(endTime - startTime);
          fail++;
          console.error(`Transaction ${i} failed:`, error.message);
          
          // Send failure update
          webSocketService.broadcast({
            type: 'progress',
            completed: ok + fail,
            total: burstSize,
            success: ok,
            failed: fail,
            currentLatency: endTime - startTime
          });
        }
      })();

      calls.push(promise);
    }

    // Wait for all transactions
    console.log('⏳ Waiting for all transactions...');
    await Promise.all(calls);

    // Calculate metrics
    const sent = burstSize;
    const avgLatency = Math.round(
      latencies.reduce((sum, lat) => sum + lat, 0) / Math.max(1, latencies.length)
    );
    const p95Latency = Math.round(p95(latencies));
    const avgGas = gasCount > 0n ? Math.round(Number(gasSum / gasCount)) : 0;
    const successRate = Math.round((ok / Math.max(1, sent)) * 100);
    const score = computeParallelScore(successRate, avgLatency, avgGas);

    const result = {
      success: true,
      contractAddress,
      functionName,
      sent,
      ok,
      fail,
      avgLatency,
      p95Latency,
      avgGas,
      successRate,
      parallelScore: score,
      timestamp: Date.now()
    };

    console.log('✅ Test completed:', result);

    // Send final result
    webSocketService.broadcast({ type: 'result', data: result });

    res.json(result);

  } catch (error) {
    console.error('❌ Test error:', error);
    
    // Notify clients of error
    webSocketService.broadcast({ 
      type: 'error', 
      message: error.message 
    });
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get test history
app.get('/api/history/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // This would typically query the blockchain for stored results
    // For now, return mock data
    res.json({
      success: true,
      results: []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// WEBSOCKET SERVER
// ================================

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  webSocketService.addClient(ws);

  ws.send(JSON.stringify({ 
    type: 'connected', 
    message: 'Connected to Monad Parallel Tester' 
  }));

  ws.on('close', () => {
    console.log('🔌 WebSocket disconnected');
    webSocketService.removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    webSocketService.removeClient(ws);
  });
});

// ================================
// BLOCKCHAIN EVENT LISTENER
// ================================

// TestResultStorage ABI (simplified for event listening)
const TEST_RESULT_STORAGE_ABI = [
  'event TestRequested(bytes32 indexed requestId, address indexed requester, address indexed targetContract, string functionName, uint256 txCount, uint256 timestamp)',
  'event TestCompleted(bytes32 indexed testId, address indexed tester, string functionName, uint256 successRate, uint256 parallelScore)',
  'function storeTestResult(bytes32 testId, tuple(address contractAddress, string functionName, uint256 sent, uint256 success, uint256 failed, uint256 avgLatency, uint256 p95Latency, uint256 avgGas, uint256 successRate, uint256 parallelScore, uint256 timestamp, address tester) result) external',
  'function requestTest(address targetContract, string functionName, uint256 txCount) external returns (bytes32)'
];

// Initialize event listener
let eventListener;
if (process.env.RESULT_ADDRESS) {
  console.log('\n🎧 Initializing blockchain event listener...');
  eventListener = new EventListenerService(
    provider,
    master,
    process.env.RESULT_ADDRESS,
    TEST_RESULT_STORAGE_ABI
  );
  eventListener.startListening();
} else {
  console.warn('\n⚠️ RESULT_ADDRESS not set, event listener not started');
}

// ================================
// START SERVER
// ================================

server.listen(PORT, () => {
  console.log('\n================================');
  console.log('🚀 MONAD PARALLEL TESTER SERVER');
  console.log('================================');
  console.log(`📡 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 Network: ${RPC_URL}`);
  console.log(`👤 Master: ${master.address}`);
  if (eventListener) {
    console.log(`🎧 Event Listener: ACTIVE`);
    console.log(`📍 Watching: ${process.env.RESULT_ADDRESS}`);
  }
  console.log('================================\n');
  console.log('💬 Ready to receive test requests!\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  if (eventListener) {
    eventListener.stopListening();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  if (eventListener) {
    eventListener.stopListening();
  }
  process.exit(0);
});
