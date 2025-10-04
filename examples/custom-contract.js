/**
 * @file examples/custom-contract.js
 * @description Example of testing a custom smart contract
 */

import { MonadTester } from '@monad-parallel-tester/core';
import { readFileSync } from 'fs';

async function customContractExample() {
  const tester = new MonadTester({
    rpcUrl: 'https://monad-testnet.g.alchemy.com/v2/YOUR_API_KEY',
    privateKey: 'your_private_key_here'
  });

  try {
    // Deploy a custom contract
    console.log('🚀 Deploying custom contract...');
    const customContract = await tester.deployCustom({
      source: './contracts/MyCustomContract.sol',
      contractName: 'MyCustomContract',
      constructorArgs: [] // Add constructor arguments if needed
    });
    console.log('✅ Custom contract deployed:', customContract.address);

    // Test different functions
    const functions = ['increment', 'decrement', 'reset'];
    
    for (const funcName of functions) {
      console.log(`\n🧪 Testing function: ${funcName}`);
      
      const results = await tester.runTest({
        contractAddress: customContract.address,
        functionName: funcName,
        botsCount: 20,
        burstSize: 20
      });
      
      console.log(`📊 ${funcName} Results:`, {
        parallelScore: results.parallelScore,
        successRate: results.successRate,
        avgLatency: results.avgLatency
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example custom contract (MyCustomContract.sol)
const customContractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MyCustomContract {
    uint256 public counter;
    mapping(address => uint256) public userCounters;
    
    function increment() external {
        counter += 1;
        userCounters[msg.sender] += 1;
    }
    
    function decrement() external {
        require(counter > 0, "Counter underflow");
        counter -= 1;
        userCounters[msg.sender] += 1;
    }
    
    function reset() external {
        counter = 0;
        userCounters[msg.sender] += 1;
    }
    
    function getUserCounter(address user) external view returns (uint256) {
        return userCounters[user];
    }
}
`;

// Save the custom contract
import { writeFileSync } from 'fs';
writeFileSync('./contracts/MyCustomContract.sol', customContractSource);

// Run the example
customContractExample();
