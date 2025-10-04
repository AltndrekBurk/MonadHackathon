#!/usr/bin/env node

/**
 * @file scripts/setup.js
 * @description Setup script for the Monad Parallel Tester Framework
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    log('❌ Node.js 18 or higher is required!', 'red');
    log(`Current version: ${nodeVersion}`, 'yellow');
    process.exit(1);
  }
  
  log(`✅ Node.js version: ${nodeVersion}`, 'green');
}

function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✅ npm version: ${npmVersion}`, 'green');
  } catch (error) {
    log('❌ npm is not installed!', 'red');
    process.exit(1);
  }
}

function createDirectories() {
  const dirs = [
    'backend/src/services',
    'backend/src/config',
    'backend/src/utils',
    'frontend/src/components',
    'frontend/src/hooks',
    'frontend/src/utils',
    'frontend/src/styles',
    'docs',
    'examples'
  ];
  
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      log(`📁 Created directory: ${dir}`, 'blue');
    }
  });
}

function createEnvFiles() {
  // Backend .env
  if (!existsSync('backend/.env')) {
    const backendEnv = `# Server Configuration
SERVER_PORT=3001
SERVER_HOST=localhost

# CORS Configuration
CORS_ORIGIN=*

# Monad Testnet RPC URL
MONAD_RPC_URL=https://monad-testnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Master Wallet (For deploying and funding bots)
MASTER_PRIVATE_KEY=your_private_key_here

# Bot Funding Amount (in wei)
BOT_FUND_WEI=100000000000000000

# Gas Configuration
GAS_LIMIT=100000

# Test Limits
MAX_BOTS=100
MAX_BURST_SIZE=100

# Optional: Already deployed contracts
PROBE_ADDRESS=
RESULT_ADDRESS=`;
    
    writeFileSync('backend/.env', backendEnv);
    log('📝 Created backend/.env', 'green');
  }
  
  // Frontend .env.local
  if (!existsSync('frontend/.env.local')) {
    const frontendEnv = `# Frontend Environment Variables
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001`;
    
    writeFileSync('frontend/.env.local', frontendEnv);
    log('📝 Created frontend/.env.local', 'green');
  }
}

function installDependencies() {
  log('📦 Installing root dependencies...', 'blue');
  try {
    execSync('npm install', { stdio: 'inherit' });
    log('✅ Root dependencies installed', 'green');
  } catch (error) {
    log('❌ Failed to install root dependencies', 'red');
    process.exit(1);
  }
  
  log('📦 Installing backend dependencies...', 'blue');
  try {
    execSync('cd backend && npm install', { stdio: 'inherit' });
    log('✅ Backend dependencies installed', 'green');
  } catch (error) {
    log('❌ Failed to install backend dependencies', 'red');
    process.exit(1);
  }
  
  log('📦 Installing frontend dependencies...', 'blue');
  try {
    execSync('cd frontend && npm install', { stdio: 'inherit' });
    log('✅ Frontend dependencies installed', 'green');
  } catch (error) {
    log('❌ Failed to install frontend dependencies', 'red');
    process.exit(1);
  }
}

function createGitignore() {
  const gitignore = `# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
.cache/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
.temp/

# Contract artifacts
artifacts/
cache/
typechain/
typechain-types/

# Private keys (NEVER COMMIT!)
*.key
*.pem
wallets/`;
  
  writeFileSync('.gitignore', gitignore);
  log('📝 Created .gitignore', 'green');
}

function displayNextSteps() {
  log('\n🎉 Setup complete!', 'green');
  log('\n📋 Next steps:', 'bright');
  log('1. Configure your environment variables:', 'yellow');
  log('   - Edit backend/.env with your Monad RPC URL and private key', 'cyan');
  log('   - Get test MON from: https://faucet.monad.xyz', 'cyan');
  log('   - Get Alchemy API key from: https://www.alchemy.com/', 'cyan');
  log('');
  log('2. Start the development servers:', 'yellow');
  log('   npm run dev', 'cyan');
  log('   # This will start both backend and frontend', 'cyan');
  log('');
  log('3. Or start them separately:', 'yellow');
  log('   # Terminal 1 - Backend', 'cyan');
  log('   cd backend && npm run dev', 'cyan');
  log('   # Terminal 2 - Frontend', 'cyan');
  log('   cd frontend && npm run dev', 'cyan');
  log('');
  log('4. Open your browser to http://localhost:5173', 'yellow');
  log('');
  log('📚 Documentation: docs/', 'blue');
  log('🔧 Examples: examples/', 'blue');
  log('');
  log('Happy testing! 🚀', 'magenta');
}

function main() {
  log('🚀 Monad Parallel Tester Framework Setup', 'bright');
  log('==========================================', 'bright');
  
  checkNodeVersion();
  checkNpmVersion();
  createDirectories();
  createEnvFiles();
  createGitignore();
  installDependencies();
  displayNextSteps();
}

main();
