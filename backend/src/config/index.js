/**
 * @file config/index.js
 * @description Configuration management for the backend
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: process.env.SERVER_PORT || 3001,
    host: process.env.SERVER_HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }
  },
  blockchain: {
    rpcUrl: process.env.MONAD_RPC_URL || 'https://monad-testnet.g.alchemy.com/v2/YOUR_API_KEY',
    masterPrivateKey: process.env.MASTER_PRIVATE_KEY || '',
    botFundWei: process.env.BOT_FUND_WEI || '100000000000000000', // 0.1 MON
    gasLimit: process.env.GAS_LIMIT || '100000',
    maxBots: process.env.MAX_BOTS || 100,
    maxBurstSize: process.env.MAX_BURST_SIZE || 100
  },
  contracts: {
    probeAddress: process.env.PROBE_ADDRESS || '',
    resultAddress: process.env.RESULT_ADDRESS || '',
    explorerUrl: 'https://testnet.monadexplorer.com/address/'
  },
  test: {
    defaultBotsCount: 30,
    defaultBurstSize: 30,
    timeout: 300000, // 5 minutes
    retryAttempts: 3
  },
  websocket: {
    heartbeatInterval: 30000, // 30 seconds
    maxConnections: 100
  }
};
