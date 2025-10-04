/**
 * @file blockchain.js
 * @description Blockchain interaction utilities for Monad Parallel Tester
 */

import { ethers } from 'ethers';
import { CONTRACTS, ABIS, NETWORK } from '../config';

/**
 * Generate random bytes32 tag for testing
 */
export function generateRandomTag() {
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Calculate P95 latency
 */
export function calculateP95(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(0.95 * sorted.length);
  return sorted[Math.min(index, sorted.length - 1)];
}

/**
 * Calculate parallel score
 */
export function calculateParallelScore(successRate, avgLatency, avgGas) {
  const latencyScore = Math.max(0, 100 - (avgLatency / 50));
  const gasScore = Math.max(0, 100 - (avgGas / 1000));
  
  return Math.round(
    (successRate * 0.4) + 
    (latencyScore * 0.3) + 
    (gasScore * 0.3)
  );
}

/**
 * Run parallel test with MetaMask
 * @param {ethers.Signer} signer - MetaMask signer
 * @param {string} contractAddress - ParallelProbe address
 * @param {string} functionName - Function to call (globalInc/shardedInc)
 * @param {number} txCount - Number of transactions
 * @param {function} onProgress - Progress callback
 */
export async function runParallelTest(signer, contractAddress, functionName, txCount, onProgress) {
  console.log('🧪 Starting parallel test...');
  console.log('Contract:', contractAddress);
  console.log('Function:', functionName);
  console.log('TX Count:', txCount);
  
  // Connect to contract
  const contract = new ethers.Contract(contractAddress, ABIS.PARALLEL_PROBE, signer);
  
  // Results tracking
  const results = [];
  const latencies = [];
  let successCount = 0;
  let failCount = 0;
  let totalGas = 0n;
  
  // Send transactions in parallel
  console.log('🔥 Sending transactions...');
  const promises = [];
  
  for (let i = 0; i < txCount; i++) {
    const tag = generateRandomTag();
    const startTime = Date.now();
    
    const promise = (async () => {
      try {
        const tx = await contract[functionName](tag, {
          gasLimit: 100000
        });
        
        const receipt = await tx.wait();
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        latencies.push(latency);
        successCount++;
        totalGas += receipt.gasUsed;
        
        results.push({
          success: true,
          latency,
          gasUsed: receipt.gasUsed,
          txHash: receipt.hash
        });
        
        // Progress callback
        if (onProgress) {
          onProgress({
            completed: successCount + failCount,
            total: txCount,
            success: successCount,
            failed: failCount,
            currentLatency: latency
          });
        }
        
        return { success: true, latency, gasUsed: receipt.gasUsed };
      } catch (error) {
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        failCount++;
        
        results.push({
          success: false,
          latency,
          error: error.message
        });
        
        if (onProgress) {
          onProgress({
            completed: successCount + failCount,
            total: txCount,
            success: successCount,
            failed: failCount,
            currentLatency: latency
          });
        }
        
        return { success: false, error: error.message };
      }
    })();
    
    promises.push(promise);
  }
  
  // Wait for all transactions
  console.log('⏳ Waiting for confirmations...');
  await Promise.allSettled(promises);
  
  // Calculate metrics
  const avgLatency = Math.round(
    latencies.reduce((sum, lat) => sum + lat, 0) / Math.max(1, latencies.length)
  );
  
  const p95Latency = calculateP95(latencies);
  
  const avgGas = successCount > 0 
    ? Math.round(Number(totalGas / BigInt(successCount)))
    : 0;
  
  const successRate = Math.round((successCount / txCount) * 100);
  
  const parallelScore = calculateParallelScore(successRate, avgLatency, avgGas);
  
  const testResult = {
    contractAddress,
    functionName,
    sent: txCount,
    success: successCount,
    failed: failCount,
    avgLatency,
    p95Latency,
    avgGas,
    successRate,
    parallelScore,
    timestamp: Date.now()
  };
  
  console.log('✅ Test completed:', testResult);
  
  return testResult;
}

/**
 * Save test result to blockchain
 * @param {ethers.Signer} signer - MetaMask signer
 * @param {object} testResult - Test result data
 */
export async function saveTestToBlockchain(signer, testResult) {
  console.log('💾 Saving test result to blockchain...');
  
  const contract = new ethers.Contract(
    CONTRACTS.TEST_RESULT_STORAGE,
    ABIS.TEST_RESULT_STORAGE,
    signer
  );
  
  const userAddress = await signer.getAddress();
  
  // Generate test ID
  const testId = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint256'],
      [userAddress, testResult.contractAddress, testResult.timestamp]
    )
  );
  
  // Prepare tuple data (must match contract struct order)
  const resultTuple = [
    testResult.contractAddress,      // address
    testResult.functionName,          // string
    testResult.sent,                  // uint256
    testResult.success,               // uint256
    testResult.failed,                // uint256
    testResult.avgLatency,            // uint256
    testResult.p95Latency,            // uint256
    testResult.avgGas,                // uint256
    testResult.successRate,           // uint256
    testResult.parallelScore,         // uint256
    testResult.timestamp,             // uint256
    userAddress                       // address (tester)
  ];
  
  console.log('Test ID:', testId);
  console.log('Sending transaction...');
  
  const tx = await contract.storeTestResult(testId, resultTuple);
  
  console.log('TX Hash:', tx.hash);
  console.log('Waiting for confirmation...');
  
  const receipt = await tx.wait();
  
  console.log('✅ Test result saved to blockchain!');
  console.log('Block:', receipt.blockNumber);
  
  return {
    testId,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber
  };
}

/**
 * Get contract statistics from blockchain
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} contractAddress - Contract to query
 */
export async function getContractStats(provider, contractAddress) {
  const contract = new ethers.Contract(
    CONTRACTS.TEST_RESULT_STORAGE,
    ABIS.TEST_RESULT_STORAGE,
    provider
  );
  
  const stats = await contract.getContractStats(contractAddress);
  
  return {
    testCount: Number(stats[0]),
    totalScore: Number(stats[1]),
    avgScore: Number(stats[2]),
    bestScore: Number(stats[3]),
    worstScore: Number(stats[4])
  };
}

/**
 * Get user's tests from blockchain
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} userAddress - User address
 */
export async function getUserTests(provider, userAddress) {
  const contract = new ethers.Contract(
    CONTRACTS.TEST_RESULT_STORAGE,
    ABIS.TEST_RESULT_STORAGE,
    provider
  );
  
  const testIds = await contract.getTesterTests(userAddress);
  return testIds;
}

/**
 * Get latest tests from blockchain
 * @param {ethers.Provider} provider - Ethers provider
 * @param {number} count - Number of tests to fetch
 */
export async function getLatestTests(provider, count = 10) {
  const contract = new ethers.Contract(
    CONTRACTS.TEST_RESULT_STORAGE,
    ABIS.TEST_RESULT_STORAGE,
    provider
  );
  
  const tests = await contract.getLatestTests(count);
  
  return tests.map(test => ({
    contractAddress: test[0],
    functionName: test[1],
    sent: Number(test[2]),
    success: Number(test[3]),
    failed: Number(test[4]),
    avgLatency: Number(test[5]),
    p95Latency: Number(test[6]),
    avgGas: Number(test[7]),
    successRate: Number(test[8]),
    parallelScore: Number(test[9]),
    timestamp: Number(test[10]),
    tester: test[11]
  }));
}

/**
 * Get total tests count
 * @param {ethers.Provider} provider - Ethers provider
 */
export async function getTotalTests(provider) {
  const contract = new ethers.Contract(
    CONTRACTS.TEST_RESULT_STORAGE,
    ABIS.TEST_RESULT_STORAGE,
    provider
  );
  
  const total = await contract.getTotalTests();
  return Number(total);
}

/**
 * Format address for display
 */
export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get explorer URL for address
 */
export function getExplorerUrl(address) {
  return `${NETWORK.EXPLORER_URL}/address/${address}`;
}

/**
 * Get explorer URL for transaction
 */
export function getTxExplorerUrl(txHash) {
  return `${NETWORK.EXPLORER_URL}/tx/${txHash}`;
}

