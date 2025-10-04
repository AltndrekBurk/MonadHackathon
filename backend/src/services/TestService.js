/**
 * @file services/TestService.js
 * @description Service for running parallel execution tests
 */

import { Wallet, Contract } from 'ethers';

export class TestService {
  constructor(provider, masterWallet, webSocketService) {
    this.provider = provider;
    this.masterWallet = masterWallet;
    this.webSocketService = webSocketService;
  }

  /**
   * Generate a random tag for testing
   * @returns {string} Random 32-byte hex string
   */
  randTag() {
    const array = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return '0x' + Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Calculate P95 latency
   * @param {Array} values - Array of latency values
   * @returns {number} P95 latency value
   */
  p95(values) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil(0.95 * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
  }

  /**
   * Compute parallel execution score
   * @param {number} successRate - Success rate percentage
   * @param {number} avgLatency - Average latency in ms
   * @param {number} avgGas - Average gas consumption
   * @returns {number} Parallel score (0-100)
   */
  computeParallelScore(successRate, avgLatency, avgGas) {
    const sr = successRate;
    const latScore = Math.max(0, 100 - Math.min(100, Math.round(avgLatency / 50)));
    const gasScore = Math.max(0, 100 - Math.min(100, Math.round(avgGas / 1000)));
    return Math.round(sr * 0.4 + latScore * 0.3 + gasScore * 0.3);
  }

  /**
   * Create and fund test bots
   * @param {number} count - Number of bots to create
   * @param {string} fundWei - Amount to fund each bot in wei
   * @returns {Array} Array of funded bot wallets
   */
  async createBots(count, fundWei) {
    console.log(`🤖 Creating ${count} test bots...`);
    
    const bots = [];
    for (let i = 0; i < count; i++) {
      bots.push(Wallet.createRandom().connect(this.provider));
    }

    console.log('💸 Funding bots sequentially to avoid nonce conflicts...');
    let successCount = 0;
    
    // Fund bots sequentially to avoid nonce issues
    for (let i = 0; i < bots.length; i++) {
      try {
        const tx = await this.masterWallet.sendTransaction({
          to: await bots[i].getAddress(),
          value: fundWei,
          // Add delay between transactions
          gasLimit: 21000
        });
        await tx.wait();
        successCount++;
        
        if (i % 5 === 0) {
          console.log(`  Funded ${i + 1}/${bots.length} bots...`);
        }
        
        // Small delay to avoid rate limiting
        if (i < bots.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Failed to fund bot ${i}:`, error.message.substring(0, 100));
      }
    }
    
    console.log(`✅ Bots funded: ${successCount}/${bots.length}`);
    
    return bots;
  }

  /**
   * Run a single transaction test
   * @param {Contract} contract - Contract instance
   * @param {string} functionName - Function to call
   * @param {Wallet} wallet - Wallet to use for transaction
   * @param {Object} options - Transaction options
   * @returns {Object} Test result
   */
  async runSingleTest(contract, functionName, wallet, options = {}) {
    const startTime = Date.now();
    const tag = this.randTag();
    const connectedContract = contract.connect(wallet);
    
    try {
      const tx = await connectedContract[functionName](tag, {
        gasLimit: options.gasLimit || 100000,
        ...options
      });
      const receipt = await tx.wait();
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      return {
        success: receipt.status === 1,
        latency,
        gasUsed: receipt.gasUsed,
        txHash: receipt.hash,
        error: null
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        success: false,
        latency: endTime - startTime,
        gasUsed: 0n,
        txHash: null,
        error: error.message
      };
    }
  }

  /**
   * Run parallel execution test
   * @param {Object} params - Test parameters
   * @returns {Object} Test results
   */
  async runTest(params) {
    const {
      contractAddress,
      functionName,
      botsCount = 30,
      burstSize = 30,
      fundWei = '100000000000000000' // 0.1 MON
    } = params;

    console.log(`🧪 Running test: ${functionName} on ${contractAddress}`);
    console.log(`👥 Bots: ${botsCount}, Burst: ${burstSize}`);

    // Broadcast test start (if webSocketService is available)
    if (this.webSocketService) {
      this.webSocketService.broadcast({ 
        type: 'test_started',
        contractAddress,
        functionName,
        botsCount,
        burstSize
      });
    }

    // Create and fund bots
    const bots = await this.createBots(botsCount, BigInt(fundWei));

    // Contract ABI
    const PROBE_ABI = [
      'function globalInc(bytes32 tag)',
      'function shardedInc(bytes32 tag)',
      'event Hit(address indexed sender, bytes32 tag, uint256 globalValue, uint256 userValue)'
    ];

    const contract = new Contract(contractAddress, PROBE_ABI, this.provider);

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
      const promise = (async () => {
        const result = await this.runSingleTest(contract, functionName, wallet);
        
        latencies.push(result.latency);

        if (result.success) {
          ok++;
          gasSum += result.gasUsed;
          gasCount += 1n;
        } else {
          fail++;
          console.error(`Transaction ${i} failed:`, result.error);
        }

        // Send real-time update
        const progress = {
          type: 'progress',
          completed: ok + fail,
          total: burstSize,
          success: ok,
          failed: fail,
          currentLatency: result.latency
        };
        
        if (this.webSocketService) {
          this.webSocketService.broadcast(progress);
        }

        return result;
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
    const p95Latency = Math.round(this.p95(latencies));
    const avgGas = gasCount > 0n ? Math.round(Number(gasSum / gasCount)) : 0;
    const successRate = Math.round((ok / Math.max(1, sent)) * 100);
    const score = this.computeParallelScore(successRate, avgLatency, avgGas);

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

    // Send final result (if webSocketService is available)
    if (this.webSocketService) {
      this.webSocketService.broadcast({ type: 'result', data: result });
    }

    return result;
  }
}
