/**
 * @file EventListenerService.js
 * @description Listens to blockchain events and triggers test execution
 */

import { ethers } from 'ethers';
import { TestService } from './TestService.js';

class EventListenerService {
  constructor(provider, masterWallet, testResultStorageAddress, testResultStorageAbi) {
    this.provider = provider;
    this.masterWallet = masterWallet;
    this.testResultStorageAddress = testResultStorageAddress;
    
    // Connect to TestResultStorage contract
    this.contract = new ethers.Contract(
      testResultStorageAddress,
      testResultStorageAbi,
      provider
    );
    
    // Create TestService instance (without webSocketService for event-driven mode)
    this.testService = new TestService(provider, masterWallet, null);
    
    // Track active tests to prevent duplicates
    this.activeTests = new Map();
    
    console.log('🎧 EventListenerService initialized');
    console.log('📍 Listening to:', testResultStorageAddress);
  }
  
  /**
   * Start listening to TestRequested events using polling
   * (Alchemy doesn't support eth_newFilter)
   */
  startListening() {
    console.log('👂 Starting event listener with polling...');
    
    let lastProcessedBlock = 0;
    
    // Poll for new events every 3 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        // Get current block number
        const currentBlock = await this.provider.getBlockNumber();
        
        // First run - set starting block
        if (lastProcessedBlock === 0) {
          lastProcessedBlock = currentBlock - 1; // Check last block
          return;
        }
        
        // No new blocks
        if (currentBlock <= lastProcessedBlock) {
          return;
        }
        
        // Query events from last processed block to current (Alchemy Free tier: max 10 blocks)
        const filter = this.contract.filters.TestRequested();
        const fromBlock = Math.max(lastProcessedBlock + 1, currentBlock - 9); // Max 10 block range
        const events = await this.contract.queryFilter(
          filter,
          fromBlock,
          currentBlock
        );
        
        // Process each event
        for (const event of events) {
          const [requestId, requester, targetContract, functionName, txCount, timestamp] = event.args;
          
          console.log('\n🔔 ==========================================');
          console.log('📥 NEW TEST REQUEST RECEIVED!');
          console.log('==========================================');
          console.log('Request ID:', requestId);
          console.log('Requester:', requester);
          console.log('Target Contract:', targetContract);
          console.log('Function:', functionName);
          console.log('TX Count:', Number(txCount));
          console.log('Timestamp:', new Date(Number(timestamp) * 1000).toISOString());
          console.log('Block Number:', event.blockNumber);
          console.log('TX Hash:', event.transactionHash);
          console.log('==========================================\n');
          
          // Check if already processing
          if (this.activeTests.has(requestId)) {
            console.log('⚠️ Test already being processed, skipping...');
            continue;
          }
          
          // Mark as active
          this.activeTests.set(requestId, {
            requester,
            targetContract,
            functionName,
            txCount: Number(txCount),
            startedAt: Date.now()
          });
          
          // Execute the test (don't await - run in background)
          this.executeTest(
            requestId,
            requester,
            targetContract,
            functionName,
            Number(txCount)
          ).catch(error => {
            console.error('❌ Error executing test:', error);
            this.activeTests.delete(requestId);
          });
        }
        
        // Update last processed block
        lastProcessedBlock = currentBlock;
        
      } catch (error) {
        console.error('❌ Error polling for events:', error.message);
      }
    }, 3000); // Poll every 3 seconds
    
    console.log('✅ Event listener is now active (polling mode)!');
    console.log('🔄 Polling every 3 seconds for new test requests...\n');
  }
  
  /**
   * Execute the test based on event data
   */
  async executeTest(requestId, requester, targetContract, functionName, txCount) {
    try {
      console.log('🚀 ==========================================');
      console.log('🧪 STARTING TEST EXECUTION');
      console.log('==========================================');
      
      // Get contract code to verify it exists
      const code = await this.provider.getCode(targetContract);
      if (code === '0x') {
        throw new Error('Target contract does not exist or has no code');
      }
      
      console.log('✅ Target contract verified');
      
      // Create bot wallets and fund them
      console.log(`\n🤖 Creating ${txCount} bot wallets...`);
      const fundAmount = ethers.parseEther('0.01'); // 0.01 MON per bot
      const bots = await this.testService.createBots(txCount, fundAmount);
      
      if (bots.length === 0) {
        throw new Error('Failed to create bots');
      }
      
      console.log(`✅ ${bots.length} bots ready\n`);
      
      // Connect to target contract with minimal ABI
      // We only need the function being tested
      const targetContractInterface = new ethers.Contract(
        targetContract,
        [
          `function ${functionName}(bytes32) external`,
          `function ${functionName}(bytes32) external returns (uint256)`
        ],
        this.provider
      );
      
      // Run the parallel test
      console.log('🔥 Running parallel test...\n');
      const results = await this.testService.runTest({
        contractAddress: targetContract,
        functionName,
        botsCount: txCount,
        burstSize: txCount,
        fundWei: '100000000000000000' // 0.1 MON per bot
      });
      
      console.log('\n📊 Test execution completed');
      console.log(`✅ Success: ${results.ok}`);
      console.log(`❌ Failed: ${results.fail}`);
      
      // Metrics already calculated in runTest
      console.log('\n📈 Metrics calculated:');
      console.log('   Success Rate:', results.successRate + '%');
      console.log('   Avg Latency:', results.avgLatency + 'ms');
      console.log('   P95 Latency:', results.p95Latency + 'ms');
      console.log('   Avg Gas:', results.avgGas);
      console.log('   Parallel Score:', results.parallelScore);
      
      // Generate test ID (different from request ID)
      const testId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'address', 'uint256'],
          [requestId, requester, Date.now()]
        )
      );
      
      // Prepare result tuple for smart contract
      const testResult = {
        contractAddress: targetContract,
        functionName: functionName,
        sent: results.sent,
        success: results.ok,
        failed: results.fail,
        avgLatency: results.avgLatency,
        p95Latency: results.p95Latency,
        avgGas: results.avgGas,
        successRate: results.successRate,
        parallelScore: results.parallelScore,
        timestamp: results.timestamp,
        tester: requester
      };
      
      // Store result on blockchain
      console.log('\n💾 Storing results on blockchain...');
      
      // Create TestResult struct for smart contract
      const resultStruct = {
        contractAddress: testResult.contractAddress,
        functionName: testResult.functionName,
        sent: testResult.sent,
        success: testResult.success,
        failed: testResult.failed,
        avgLatency: testResult.avgLatency,
        p95Latency: testResult.p95Latency,
        avgGas: testResult.avgGas,
        successRate: testResult.successRate,
        parallelScore: testResult.parallelScore,
        timestamp: testResult.timestamp,
        tester: testResult.tester
      };
      
      const contractWithSigner = new ethers.Contract(
        this.testResultStorageAddress,
        this.contract.interface,
        this.masterWallet
      );
      
      console.log('📤 Sending transaction to blockchain...');
      console.log('Test ID:', testId);
      console.log('Result struct:', JSON.stringify(resultStruct, null, 2));
      
      const tx = await contractWithSigner.storeTestResult(testId, resultStruct);
      console.log('📤 TX sent:', tx.hash);
      
      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ TX confirmed in block:', receipt.blockNumber);
      
      console.log('\n🎉 ==========================================');
      console.log('✅ TEST COMPLETED SUCCESSFULLY!');
      console.log('==========================================');
      console.log('Test ID:', testId);
      console.log('Request ID:', requestId);
      console.log('Requester:', requester);
      console.log('Parallel Score:', results.parallelScore);
      console.log('Success Rate:', results.successRate + '%');
      console.log('Avg Latency:', results.avgLatency + 'ms');
      console.log('==========================================\n');
      
      // Remove from active tests
      this.activeTests.delete(requestId);
      
    } catch (error) {
      console.error('\n❌ ==========================================');
      console.error('❌ TEST EXECUTION FAILED');
      console.error('==========================================');
      console.error('Request ID:', requestId);
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('==========================================\n');
      
      // Remove from active tests
      this.activeTests.delete(requestId);
      
      throw error;
    }
  }
  
  /**
   * Stop listening to events
   */
  stopListening() {
    console.log('🛑 Stopping event listener...');
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log('✅ Event listener stopped');
  }
  
  /**
   * Get active tests
   */
  getActiveTests() {
    return Array.from(this.activeTests.entries()).map(([requestId, data]) => ({
      requestId,
      ...data,
      duration: Date.now() - data.startedAt
    }));
  }
}

export default EventListenerService;

