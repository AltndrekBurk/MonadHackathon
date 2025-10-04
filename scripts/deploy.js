/**
 * @file deploy.js
 * @description Deploy contracts to Monad Testnet
 */

import { readFileSync } from 'fs';
import solc from 'solc';
import 'dotenv/config';
import { Wallet, JsonRpcProvider, ContractFactory } from 'ethers';

const provider = new JsonRpcProvider(process.env.MONAD_RPC_URL);
const master = new Wallet(process.env.MASTER_PRIVATE_KEY, provider);

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

async function main() {
  console.log('\n🚀 MONAD TESTNET DEPLOYMENT');
  console.log('================================');
  console.log('Network:', process.env.MONAD_RPC_URL);
  console.log('Deployer:', await master.getAddress());
  
  const balance = await provider.getBalance(await master.getAddress());
  console.log('Balance:', balance.toString(), 'wei');
  
  if (balance === 0n) {
    console.error('\n❌ Insufficient balance! Get test MON from faucet:');
    console.error('   https://faucet.monad.xyz');
    process.exit(1);
  }

  console.log('\n================================');
  console.log('📝 COMPILING CONTRACTS');
  console.log('================================\n');

  const probe = compile('./contracts/ParallelProbe.sol', 'ParallelProbe');
  const resultStorage = compile('./contracts/TestResultStorage.sol', 'TestResultStorage');

  console.log('\n================================');
  console.log('🔨 DEPLOYING CONTRACTS');
  console.log('================================\n');

  console.log('Deploying ParallelProbe...');
  const ProbeFactory = new ContractFactory(probe.abi, probe.bytecode, master);
  const probeCtr = await ProbeFactory.deploy();
  await probeCtr.waitForDeployment();
  const probeAddr = await probeCtr.getAddress();
  console.log('✅ ParallelProbe deployed at:', probeAddr);

  console.log('\nDeploying TestResultStorage...');
  const RSFactory = new ContractFactory(resultStorage.abi, resultStorage.bytecode, master);
  const rsCtr = await RSFactory.deploy();
  await rsCtr.waitForDeployment();
  const rsAddr = await rsCtr.getAddress();
  console.log('✅ TestResultStorage deployed at:', rsAddr);

  console.log('\n================================');
  console.log('📝 DEPLOYMENT COMPLETE');
  console.log('================================');
  console.log('\n⚠️  ADD THESE TO YOUR .env FILE:\n');
  console.log(`PROBE_ADDRESS=${probeAddr}`);
  console.log(`RESULT_ADDRESS=${rsAddr}`);
  console.log('\n================================');
  console.log('🔍 View on Explorer:');
  console.log(`https://explorer.testnet.monad.xyz/address/${probeAddr}`);
  console.log(`https://explorer.testnet.monad.xyz/address/${rsAddr}`);
  console.log('================================\n');
}

main().catch(error => {
  console.error('\n❌ Deployment failed:', error);
  process.exit(1);
});
