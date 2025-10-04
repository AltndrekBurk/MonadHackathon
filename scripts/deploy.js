#!/usr/bin/env node

/**
 * @file scripts/deploy.js
 * @description Contract deployment script for the Monad Parallel Tester Framework
 */

import { readFileSync } from 'fs';
import solc from 'solc';
import { Wallet, JsonRpcProvider, ContractFactory } from 'ethers';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function compile(filePath, contractName) {
  log(`📦 Compiling ${contractName}...`, 'blue');
  
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
      log('❌ Compilation errors:', 'red');
      console.error(errors);
      throw new Error('Solc compile error');
    }
  }

  const compiled = output.contracts[contractName + '.sol'][contractName];
  
  return {
    abi: compiled.abi,
    bytecode: '0x' + compiled.evm.bytecode.object
  };
}

async function deployContract(contractName, filePath, factory, constructorArgs = []) {
  try {
    const compiled = compile(filePath, contractName);
    
    log(`📝 Deploying ${contractName}...`, 'blue');
    const contractFactory = new ContractFactory(compiled.abi, compiled.bytecode, factory);
    const contract = await contractFactory.deploy(...constructorArgs);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    log(`✅ ${contractName} deployed at: ${address}`, 'green');
    log(`🔗 Explorer: https://testnet.monadexplorer.com/address/${address}`, 'cyan');
    
    return {
      contract,
      address,
      abi: compiled.abi
    };
  } catch (error) {
    log(`❌ Failed to deploy ${contractName}: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  log('🚀 Monad Parallel Tester - Contract Deployment', 'bright');
  log('===============================================', 'bright');
  
  // Check environment variables
  const rpcUrl = process.env.MONAD_RPC_URL;
  const privateKey = process.env.MASTER_PRIVATE_KEY;
  
  if (!rpcUrl || rpcUrl.includes('YOUR_API_KEY')) {
    log('❌ Please set MONAD_RPC_URL in backend/.env', 'red');
    log('Get your API key from: https://www.alchemy.com/', 'yellow');
    process.exit(1);
  }
  
  if (!privateKey || privateKey === 'your_private_key_here') {
    log('❌ Please set MASTER_PRIVATE_KEY in backend/.env', 'red');
    log('Get test MON from: https://faucet.monad.xyz', 'yellow');
    process.exit(1);
  }
  
  try {
    // Setup provider and wallet
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    
    // Check balance
    const balance = await provider.getBalance(await wallet.getAddress());
    log(`💰 Master wallet balance: ${balance.toString()} wei`, 'blue');
    
    if (balance === 0n) {
      log('❌ Insufficient balance! Get test MON from https://faucet.monad.xyz', 'red');
      process.exit(1);
    }
    
    // Deploy contracts
    log('\n📦 Deploying contracts...', 'bright');
    
    const probe = await deployContract(
      'ParallelProbe',
      './contracts/ParallelProbe.sol',
      wallet
    );
    
    const resultStorage = await deployContract(
      'TestResultStorage',
      './contracts/TestResultStorage.sol',
      wallet
    );
    
    // Display results
    log('\n🎉 Deployment complete!', 'green');
    log('===============================================', 'bright');
    log(`📋 Contract Addresses:`, 'bright');
    log(`ParallelProbe: ${probe.address}`, 'cyan');
    log(`TestResultStorage: ${resultStorage.address}`, 'cyan');
    log('');
    log(`🔗 Explorer Links:`, 'bright');
    log(`ParallelProbe: https://testnet.monadexplorer.com/address/${probe.address}`, 'cyan');
    log(`TestResultStorage: https://testnet.monadexplorer.com/address/${resultStorage.address}`, 'cyan');
    log('');
    log('📝 Add these to your backend/.env file:', 'yellow');
    log(`PROBE_ADDRESS=${probe.address}`, 'cyan');
    log(`RESULT_ADDRESS=${resultStorage.address}`, 'cyan');
    log('');
    log('🚀 You can now run the test framework!', 'green');
    
  } catch (error) {
    log(`❌ Deployment failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
