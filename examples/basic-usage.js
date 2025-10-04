/**
 * @file examples/basic-usage.js
 * @description Basic usage example of the Monad Parallel Tester Framework
 */

import { MonadTester } from '@monad-parallel-tester/core';

async function basicExample() {
  // Initialize the tester
  const tester = new MonadTester({
    rpcUrl: 'https://monad-testnet.g.alchemy.com/v2/YOUR_API_KEY',
    privateKey: 'your_private_key_here'
  });

  try {
    // Deploy test contracts
    console.log('🚀 Deploying contracts...');
    const contracts = await tester.deploy();
    console.log('✅ Contracts deployed:', contracts);

    // Run hotspot test (globalInc)
    console.log('\n🔥 Running hotspot test...');
    const hotspotResults = await tester.runTest({
      contractAddress: contracts.probeAddress,
      functionName: 'globalInc',
      botsCount: 30,
      burstSize: 30
    });
    console.log('📊 Hotspot Results:', hotspotResults);

    // Run parallel test (shardedInc)
    console.log('\n⚡ Running parallel test...');
    const parallelResults = await tester.runTest({
      contractAddress: contracts.probeAddress,
      functionName: 'shardedInc',
      botsCount: 30,
      burstSize: 30
    });
    console.log('📊 Parallel Results:', parallelResults);

    // Compare results
    console.log('\n📈 Performance Comparison:');
    console.log(`Hotspot Score: ${hotspotResults.parallelScore}/100`);
    console.log(`Parallel Score: ${parallelResults.parallelScore}/100`);
    console.log(`Improvement: ${parallelResults.parallelScore - hotspotResults.parallelScore} points`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
basicExample();
