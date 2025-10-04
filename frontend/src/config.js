/**
 * @file config.js
 * @description Frontend configuration for Monad Parallel Tester DApp
 */

// Deployed Contract Addresses (Monad Testnet)
export const CONTRACTS = {
  PARALLEL_PROBE: '0x75762cc3342f5dE16147EEECB3E226F289b6b105',
  TEST_RESULT_STORAGE: '0xcf87be9E7bD190F92Cd72aAd01a8AB405c4A3C4f'
}

// Network Configuration
export const NETWORK = {
  CHAIN_ID: 10143, // Monad Testnet
  CHAIN_ID_HEX: '0x27A7',
  NAME: 'Monad Testnet',
  RPC_URL: 'https://monad-testnet.g.alchemy.com/v2/02uIVaWYaM6jrXz0pt471',
  EXPLORER_URL: 'https://testnet.monadexplorer.com',
  CURRENCY: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18
  }
}

// Contract ABIs (simplified for ethers v6)
export const ABIS = {
  PARALLEL_PROBE: [
    'function globalInc(bytes32 tag)',
    'function shardedInc(bytes32 tag)',
    'function getGlobalCounter() view returns (uint256)',
    'function getUserCounter(address user) view returns (uint256)',
    'event Hit(address indexed sender, bytes32 tag, uint256 globalValue, uint256 userValue)'
  ],
  
  TEST_RESULT_STORAGE: [
    // Request Test (NEW - User triggers backend test)
    'function requestTest(address targetContract, string functionName, uint256 txCount) returns (bytes32)',
    
    // Write - simplified ABI
    'function storeTestResult(bytes32 testId, tuple(address,string,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address))',
    
    // Read Functions
    'function getContractStats(address) view returns (tuple(uint256,uint256,uint256,uint256,uint256))',
    'function getTesterTests(address) view returns (bytes32[])',
    'function getLatestTests(uint256) view returns (tuple(address,string,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address)[])',
    'function getTotalTests() view returns (uint256)',
    'function generateTestId(address,address,uint256) pure returns (bytes32)',
    
    // Events
    'event TestRequested(bytes32 indexed requestId, address indexed requester, address indexed targetContract, string functionName, uint256 txCount, uint256 timestamp)',
    'event TestResultStored(bytes32 indexed testId, address indexed tester, address indexed contractAddress, uint256 parallelScore)',
    'event TestCompleted(bytes32 indexed testId, address indexed tester, string functionName, uint256 successRate, uint256 parallelScore)'
  ]
}

// Test Configuration
export const TEST_CONFIG = {
  MIN_TX_COUNT: 1,
  MAX_TX_COUNT: 100,
  DEFAULT_TX_COUNT: 30,
  DEFAULT_GAS_LIMIT: 100000,
  DEFAULT_FUNCTION: 'globalInc'
}

// UI Configuration
export const UI_CONFIG = {
  THEME: 'dark',
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 5000,
  CHART_UPDATE_INTERVAL: 1000
}

// Faucet and Links
export const LINKS = {
  FAUCET: 'https://faucet.monad.xyz',
  DOCS: 'https://docs.monad.xyz',
  EXPLORER: NETWORK.EXPLORER_URL,
  GITHUB: 'https://github.com/your-org/monad-parallel-tester'
}

// Export all as default
export default {
  CONTRACTS,
  NETWORK,
  ABIS,
  TEST_CONFIG,
  UI_CONFIG,
  LINKS
}

