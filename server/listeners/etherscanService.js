// Service to fetch contract creation block from Etherscan
import fetch from 'node-fetch';
import { config } from '../config.js';

/**
 * Fetch the creation block of a contract using Etherscan API
 * @param {string} contractAddress - Contract address
 * @returns {Promise<number>} - Block number where contract was created
 */

export async function getContractCreationBlock(contractAddress) {
  try {
    if(config.ETHERSCAN_API_KEY===undefined){
      throw new Error("Etherscan API key is missing or invalid.");
    }
    console.log(`📡 Fetching contract creation block from Etherscan for ${contractAddress}...`);
    
    const url = `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${config.ETHERSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '0') {
      throw new Error(`Etherscan API error: ${data.message}`);
    }
    
    const creationBlock = parseInt(data.result[0].blockNumber, 10);
    console.log(`✓ Contract creation block found: ${creationBlock}`);
    
    return creationBlock;
  } catch (error) {
    console.error(`❌ Failed to fetch contract creation block:`, error.message);
    // Fallback: start from a reasonable block (e.g., 1 block ago)
    console.log(`⚠️  Using fallback: starting from recent blocks`);
    return null;
  }
}

getContractCreationBlock("0xA31C51DCf4913AE9Dae63254bE9BbE350f7b8ADD");