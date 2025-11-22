// Configuration file for environment variables and settings
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  RPC_URL: process.env.RPC_URL,
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  RPC_WS_URL: process.env.RPC_WS_URL || process.env.RPC_URL.replace('https', 'wss').replace('http', 'ws'),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Validate required env vars
if (!config.RPC_URL) {
  console.error('ERROR: RPC_URL environment variable is required');
  process.exit(1);
}

if (!config.ETHERSCAN_API_KEY) {
  console.warn('⚠️  WARNING: ETHERSCAN_API_KEY not set. Contract creation block lookup will be limited.');
  config.ETHERSCAN_API_KEY = '';
}

console.log('✓ Configuration loaded');
console.log(`  RPC: ${config.RPC_URL.substring(0, 50)}...`);
console.log(`  Etherscan API Key configured: ${config.ETHERSCAN_API_KEY.substring(0, 10)}...`);
