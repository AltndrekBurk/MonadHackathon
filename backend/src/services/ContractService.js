/**
 * @file services/ContractService.js
 * @description Service for smart contract operations
 */

import { ContractFactory, Contract } from 'ethers';
import { readFileSync } from 'fs';
import solc from 'solc';

export class ContractService {
  constructor(provider, masterWallet) {
    this.provider = provider;
    this.masterWallet = masterWallet;
    this.deployedContracts = new Map();
  }

  /**
   * Compile a Solidity contract
   * @param {string} filePath - Path to the .sol file
   * @param {string} contractName - Name of the contract
   * @returns {Object} Compiled contract with ABI and bytecode
   */
  compile(filePath, contractName) {
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

  /**
   * Deploy a contract
   * @param {string} filePath - Path to the .sol file
   * @param {string} contractName - Name of the contract
   * @param {Array} constructorArgs - Constructor arguments
   * @returns {Object} Deployed contract instance and address
   */
  async deploy(filePath, contractName, constructorArgs = []) {
    try {
      const compiled = this.compile(filePath, contractName);
      
      console.log(`📝 Deploying ${contractName}...`);
      const factory = new ContractFactory(compiled.abi, compiled.bytecode, this.masterWallet);
      const contract = await factory.deploy(...constructorArgs);
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      
      console.log(`✅ ${contractName} deployed at:`, address);
      
      // Store the deployed contract
      this.deployedContracts.set(contractName, {
        contract,
        address,
        abi: compiled.abi
      });
      
      return {
        contract,
        address,
        abi: compiled.abi,
        explorerUrl: `https://testnet.monadexplorer.com/address/${address}`
      };
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error);
      throw error;
    }
  }

  /**
   * Get a deployed contract instance
   * @param {string} contractName - Name of the contract
   * @returns {Object} Contract instance and metadata
   */
  getDeployedContract(contractName) {
    return this.deployedContracts.get(contractName);
  }

  /**
   * Connect to an existing contract
   * @param {string} address - Contract address
   * @param {Array} abi - Contract ABI
   * @returns {Contract} Contract instance
   */
  connectToContract(address, abi) {
    return new Contract(address, abi, this.provider);
  }

  /**
   * Get contract with a specific wallet
   * @param {string} address - Contract address
   * @param {Array} abi - Contract ABI
   * @param {Wallet} wallet - Wallet to use for transactions
   * @returns {Contract} Contract instance connected to wallet
   */
  getContractWithWallet(address, abi, wallet) {
    return new Contract(address, abi, wallet);
  }

  /**
   * Get all deployed contracts
   * @returns {Map} Map of deployed contracts
   */
  getAllDeployedContracts() {
    return this.deployedContracts;
  }

  /**
   * Clear deployed contracts cache
   */
  clearCache() {
    this.deployedContracts.clear();
  }
}
