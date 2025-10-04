/**
 * @file examples/performance-analysis.js
 * @description Advanced performance analysis example
 */

import { MonadTester } from '@monad-parallel-tester/core';

async function performanceAnalysis() {
  const tester = new MonadTester({
    rpcUrl: 'https://monad-testnet.g.alchemy.com/v2/YOUR_API_KEY',
    privateKey: 'your_private_key_here'
  });

  try {
    // Deploy contracts
    const contracts = await tester.deploy();
    
    // Test different scenarios
    const scenarios = [
      { name: 'Low Load', botsCount: 10, burstSize: 10 },
      { name: 'Medium Load', botsCount: 30, burstSize: 30 },
      { name: 'High Load', botsCount: 50, burstSize: 50 },
      { name: 'Extreme Load', botsCount: 100, burstSize: 100 }
    ];

    const results = {
      hotspot: [],
      parallel: []
    };

    // Test each scenario
    for (const scenario of scenarios) {
      console.log(`\n🧪 Testing ${scenario.name}...`);
      
      // Hotspot test
      const hotspotResult = await tester.runTest({
        contractAddress: contracts.probeAddress,
        functionName: 'globalInc',
        ...scenario
      });
      
      // Parallel test
      const parallelResult = await tester.runTest({
        contractAddress: contracts.probeAddress,
        functionName: 'shardedInc',
        ...scenario
      });
      
      results.hotspot.push({
        ...scenario,
        ...hotspotResult
      });
      
      results.parallel.push({
        ...scenario,
        ...parallelResult
      });
    }

    // Analyze results
    console.log('\n📊 Performance Analysis:');
    console.log('=====================================');
    
    results.hotspot.forEach((result, index) => {
      const parallel = results.parallel[index];
      const improvement = parallel.parallelScore - result.parallelScore;
      
      console.log(`\n${result.name}:`);
      console.log(`  Hotspot Score: ${result.parallelScore}/100`);
      console.log(`  Parallel Score: ${parallel.parallelScore}/100`);
      console.log(`  Improvement: ${improvement} points`);
      console.log(`  Latency Reduction: ${result.avgLatency - parallel.avgLatency}ms`);
    });

    // Generate recommendations
    console.log('\n💡 Recommendations:');
    console.log('==================');
    
    const avgImprovement = results.hotspot.reduce((sum, result, index) => {
      return sum + (results.parallel[index].parallelScore - result.parallelScore);
    }, 0) / results.hotspot.length;
    
    if (avgImprovement > 50) {
      console.log('✅ Excellent parallel execution potential!');
      console.log('   Consider implementing sharding patterns in your contracts.');
    } else if (avgImprovement > 20) {
      console.log('⚠️  Moderate parallel execution potential.');
      console.log('   Some optimization opportunities exist.');
    } else {
      console.log('❌ Limited parallel execution potential.');
      console.log('   Consider redesigning contract architecture.');
    }

    // Export results to JSON
    const exportData = {
      timestamp: new Date().toISOString(),
      scenarios: results.hotspot.map((result, index) => ({
        name: result.name,
        botsCount: result.botsCount,
        burstSize: result.burstSize,
        hotspot: {
          parallelScore: result.parallelScore,
          successRate: result.successRate,
          avgLatency: result.avgLatency,
          avgGas: result.avgGas
        },
        parallel: {
          parallelScore: results.parallel[index].parallelScore,
          successRate: results.parallel[index].successRate,
          avgLatency: results.parallel[index].avgLatency,
          avgGas: results.parallel[index].avgGas
        }
      }))
    };
    
    import { writeFileSync } from 'fs';
    writeFileSync('./performance-analysis.json', JSON.stringify(exportData, null, 2));
    console.log('\n📁 Results exported to performance-analysis.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the analysis
performanceAnalysis();
