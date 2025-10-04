/**
 * @file scripts/deploy.js
 * @description Deployment script for ParallelProbe and TestResultStorage contracts
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import solc from 'solc';
import dotenv from 'dotenv';
import { Wallet, JsonRpcProvider, ContractFactory } from 'ethers';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const RPC_URL = process.env.MONAD_RPC_URL;
const PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;

if (!RPC_URL || !PRIVATE_KEY) {
  console.error('❌ Error: MONAD_RPC_URL and MASTER_PRIVATE_KEY must be set in .env file');
  process.exit(1);
}

// Connect to network
const provider = new JsonRpcProvider(RPC_URL);
const deployer = new Wallet(PRIVATE_KEY, provider);

console.log('🚀 Starting deployment...');
console.log('📡 RPC URL:', RPC_URL);
console.log('👤 Deployer:', await deployer.getAddress());

/**
 * Compile a Solidity contract
 */
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

  const contract = output.contracts[contractName + '.sol'][contractName];
  
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
  };
}

/**
 * Main deployment function
 */
async function main() {
  try {
    // Check balance
    const balance = await provider.getBalance(deployer.address);
    console.log('💰 Balance:', balance.toString(), 'wei');
    
    if (balance === 0n) {
      throw new Error('Insufficient balance! Get test MON from https://faucet.monad.xyz');
    }

    // Resolve contract paths
    const contractsPath = join(__dirname, '../../contracts');
    
    // Compile contracts
    console.log('\n📦 Compiling contracts...');
    const probe = compile(join(contractsPath, 'ParallelProbe.sol'), 'ParallelProbe');
    const resultStorage = compile(join(contractsPath, 'TestResultStorage.sol'), 'TestResultStorage');

    // Deploy ParallelProbe
    console.log('\n📝 Deploying ParallelProbe...');
    const ProbeFactory = new ContractFactory(probe.abi, probe.bytecode, deployer);
    const probeCtr = await ProbeFactory.deploy();
    await probeCtr.waitForDeployment();
    const probeAddress = await probeCtr.getAddress();
    
    console.log('✅ ParallelProbe deployed at:', probeAddress);

    // Deploy TestResultStorage
    console.log('\n📝 Deploying TestResultStorage...');
    const ResultFactory = new ContractFactory(resultStorage.abi, resultStorage.bytecode, deployer);
    const resultCtr = await ResultFactory.deploy();
    await resultCtr.waitForDeployment();
    const resultAddress = await resultCtr.getAddress();
    
    console.log('✅ TestResultStorage deployed at:', resultAddress);

    // Print summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ DEPLOYMENT SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📋 Contract Addresses:');
    console.log('');
    console.log('ParallelProbe:');
    console.log('  Address:', probeAddress);
    console.log('  Explorer:', `https://testnet.monadexplorer.com/address/${probeAddress}`);
    console.log('');
    console.log('TestResultStorage:');
    console.log('  Address:', resultAddress);
    console.log('  Explorer:', `https://testnet.monadexplorer.com/address/${resultAddress}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n💡 Next Steps:');
    console.log('1. Update backend/env file with new addresses:');
    console.log(`   PROBE_ADDRESS=${probeAddress}`);
    console.log(`   RESULT_ADDRESS=${resultAddress}`);
    console.log('');
    console.log('2. Update frontend config with new addresses');
    console.log('');
    console.log('3. Start testing:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend: http://localhost:3001');
    console.log('');

    // Return addresses for programmatic use
    return {
      success: true,
      probeAddress,
      resultAddress,
      explorerUrls: {
        probe: `https://testnet.monadexplorer.com/address/${probeAddress}`,
        result: `https://testnet.monadexplorer.com/address/${resultAddress}`
      }
    };

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run deployment
main()
  .then(() => {
    console.log('🎉 Deployment script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

