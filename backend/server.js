/**
 * @file server.js
 * @description Express server with WebSocket support for real-time test results
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import solc from 'solc';
import dotenv from 'dotenv';
import { Wallet, JsonRpcProvider, ContractFactory } from 'ethers';

dotenv.config();

// ================================
// CONFIGURATION
// ================================

const PORT = process.env.SERVER_PORT || 3001;
const provider = new JsonRpcProvider(process.env.MONAD_RPC_URL);
const master = process.env.MASTER_PRIVATE_KEY ? new Wallet(process.env.MASTER_PRIVATE_KEY, provider) : null;

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
app.use(cors());
app.use(express.json());

// Store WebSocket connections
const clients = new Set();

// ================================
// API ROUTES
// ================================

// Deploy contracts
app.post('/api/deploy', async (req, res) => {
  try {
    console.log('🚀 Deploying contracts...');
    
    const probe = compile('./contracts/ParallelProbe.sol', 'ParallelProbe');
    const resultStorage = compile('./contracts/TestResultStorage.sol', 'TestResultStorage');

    const ProbeFactory = new ContractFactory(probe.abi, probe.bytecode, master);
    const probeCtr = await ProbeFactory.deploy();
    await probeCtr.waitForDeployment();
    const probeAddr = await probeCtr.getAddress();

    const RSFactory = new ContractFactory(resultStorage.abi, resultStorage.bytecode, master);
    const rsCtr = await RSFactory.deploy();
    await rsCtr.waitForDeployment();
    const rsAddr = await rsCtr.getAddress();

    res.json({
      success: true,
      probeAddress: probeAddr,
      resultAddress: rsAddr
    });
  } catch (error) {
    console.error('Deploy error:', error);
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

    // Create bots
    const bots = [];
    for (let i = 0; i < botsCount; i++) {
      bots.push(Wallet.createRandom().connect(provider));
    }

    // Fund bots
    const fundWei = BigInt(process.env.BOT_FUND_WEI || '100000000000000000');
    for (let i = 0; i < bots.length; i++) {
      const tx = await master.sendTransaction({
        to: await bots[i].getAddress(),
        value: fundWei
      });
      await tx.wait();
    }

    // Contract ABI
    const PROBE_ABI = [
      'function globalInc(bytes32 tag)',
      'function shardedInc(bytes32 tag)',
      'event Hit(address indexed sender, bytes32 tag, uint256 globalValue, uint256 userValue)'
    ];

    const contract = new Contract(contractAddress, PROBE_ABI, provider);

    // Launch stress test
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
          const tx = await connectedContract[functionName](tag);
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
            completed: i + 1,
            total: burstSize,
            success: ok,
            failed: fail,
            currentLatency: latency
          };
          
          clients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify(progress));
            }
          });

        } catch (error) {
          const endTime = Date.now();
          latencies.push(endTime - startTime);
          fail++;
        }
      })();

      calls.push(promise);
    }

    // Wait for all transactions
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

    // Send final result
    clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'result', data: result }));
      }
    });

    res.json(result);

  } catch (error) {
    console.error('Test error:', error);
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
  clients.add(ws);

  ws.on('close', () => {
    console.log('🔌 WebSocket disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// ================================
// START SERVER
// ================================

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
});
