// Core log listening logic
// Handles both historical catch-up (via HTTP) and real-time subscriptions (via WebSocket)

import { ethers } from 'ethers';
import { config } from '../config.js';
import { getLastBlock, setLastBlock } from '../storage/blockStore.js';
import { getContractCreationBlock } from './etherscanService.js';

// Store active subscriptions per client
const activeSubscriptions = new Map();

/**
 * Fetch historical logs in chunks
 * @param {string} contractAddress - Contract address
 * @param {string} topic0 - Event signature (topic0)
 * @param {number} fromBlock - Starting block
 * @param {number} toBlock - Ending block
 * @returns {Promise<array>} - Array of logs
 */
export async function fetchHistoricalLogs(contractAddress, topic0, fromBlock, toBlock) {
  console.log(`📜 Fetching historical logs from block ${fromBlock} to ${toBlock}...`);
  
  // Use HTTP provider for efficient historical queries
  const httpProvider = new ethers.JsonRpcProvider(config.RPC_URL);
  const allLogs = [];
  
  const CHUNK_SIZE = 3000; // Etherscan limit
  
  for (let block = fromBlock; block <= toBlock; block += CHUNK_SIZE) {
    const chunkTo = Math.min(block + CHUNK_SIZE - 1, toBlock);
    
    try {
      console.log(`  📍 Fetching chunk: blocks ${block} to ${chunkTo}...`);
      
      const logs = await httpProvider.getLogs({
        address: contractAddress,
        topics: [topic0],
        fromBlock: block,
        toBlock: chunkTo,
      });
      
      allLogs.push(...logs);
      console.log(`    ✓ Found ${logs.length} logs in this chunk`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Error fetching logs for blocks ${block}-${chunkTo}:`, error.message);
      // Continue with next chunk even if one fails
    }
  }
  
  console.log(`✓ Total historical logs fetched: ${allLogs.length}`);
  return allLogs;
}

/**
 * Start listening to a contract and stream logs to clients
 * @param {string} contractAddress - Contract address
 * @param {string} topic0 - Event signature (topic0)
 * @param {object} res - Express response object for SSE
 */
export async function startListening(contractAddress, topic0, res) {
  console.log(`\n🚀 Starting listener for ${contractAddress} with topic ${topic0.substring(0, 10)}...`);
  
  const listenerKey = `${contractAddress}-${topic0}`;
  
  try {
    // Get creation block or use fallback
    let fromBlock = await getContractCreationBlock(contractAddress);
    if (!fromBlock) {
      // Fallback: start from 100 blocks ago
      const httpProvider = new ethers.JsonRpcProvider(config.RPC_URL);
      const currentBlock = await httpProvider.getBlockNumber();
      fromBlock = Math.max(0, currentBlock - 100);
      console.log(`⚠️  Using fallback fromBlock: ${fromBlock}`);
    }
    
    // Get latest block
    const httpProvider = new ethers.JsonRpcProvider(config.RPC_URL);
    const latestBlock = await httpProvider.getBlockNumber();
    
    // Check if we need to catch up
    let lastProcessedBlock = getLastBlock(contractAddress, topic0);
    
    if (!lastProcessedBlock) {
      lastProcessedBlock = fromBlock;
    }
    
    console.log(`📊 Status:`);
    console.log(`  Creation block: ${fromBlock}`);
    console.log(`  Latest block: ${latestBlock}`);
    console.log(`  Last processed: ${lastProcessedBlock}`);
    
    // Send initial status to client
    res.write(`event: status\n`);
    res.write(`data: ${JSON.stringify({ 
      status: 'catching-up',
      message: `Catching up from block ${lastProcessedBlock} to ${latestBlock}`
    })}\n\n`);
    
    // Fetch historical logs if we're behind
    if (lastProcessedBlock < latestBlock - 1) {
      const historicalLogs = await fetchHistoricalLogs(
        contractAddress,
        topic0,
        lastProcessedBlock + 1,
        latestBlock - 1
      );
      
      // Stream historical logs to client
      for (const log of historicalLogs) {
        res.write(`event: log\n`);
        res.write(`data: ${JSON.stringify(log)}\n\n`);
        setLastBlock(contractAddress, topic0, log.blockNumber);
      }
      
      console.log(`✓ Caught up with ${historicalLogs.length} historical logs`);
    }
    
    // Update last processed block
    setLastBlock(contractAddress, topic0, latestBlock);
    
    // Send status that we're now listening for real-time events
    res.write(`event: status\n`);
    res.write(`data: ${JSON.stringify({ 
      status: 'listening',
      message: 'Now listening for real-time events'
    })}\n\n`);
    
    console.log(`✓ Switched to real-time listening mode`);
    
    // Set up real-time WebSocket listener
    try {
      // Try WebSocket provider for real-time updates
      const wsProvider = new ethers.WebSocketProvider(config.RPC_WS_URL);
      
      const onLog = (log) => {
        // Only process logs for our contract and topic
        if (log.address.toLowerCase() === contractAddress.toLowerCase() &&
            log.topics[0] === topic0) {
          console.log(`📨 Real-time event received at block ${log.blockNumber}`);
          
          res.write(`event: log\n`);
          res.write(`data: ${JSON.stringify(log)}\n\n`);
          setLastBlock(contractAddress, topic0, log.blockNumber);
        }
      };
      
      // Subscribe to logs
      wsProvider.on('log', onLog);
      
      // Store subscription for cleanup
      const subscription = { wsProvider, onLog };
      activeSubscriptions.set(listenerKey, subscription);
      
      console.log(`✓ Real-time WebSocket listener attached`);
      
      // Handle client disconnect
      res.on('close', () => {
        console.log(`🔌 Client disconnected from ${listenerKey}`);
        
        // Clean up WebSocket subscription
        const sub = activeSubscriptions.get(listenerKey);
        if (sub) {
          sub.wsProvider.off('log', sub.onLog);
          sub.wsProvider.destroy();
          activeSubscriptions.delete(listenerKey);
          console.log(`✓ Cleaned up WebSocket listener`);
        }
      });
      
    } catch (wsError) {
      console.warn(`⚠️  WebSocket connection failed, falling back to 1-second block polling:`, wsError.message);
      
      // Fallback to polling if WebSocket fails
      // Track the current/latest block as the baseline for polling
      let previousBlock = latestBlock;
      
      const pollInterval = setInterval(async () => {
        try {
          // Get latest block number
          const currentBlock = await httpProvider.getBlockNumber();
          
          console.log(`⏱️  [Poll] Current block: ${currentBlock}, Previous: ${previousBlock}`);
          
          // Only fetch logs if block number has changed
          if (currentBlock > previousBlock) {
            console.log(`📍 New block(s) detected! Fetching logs from block ${previousBlock + 1} to ${currentBlock}`);
            
            const newLogs = await fetchHistoricalLogs(
              contractAddress,
              topic0,
              previousBlock + 1,
              currentBlock
            );
            
            // Stream any new logs to client
            for (const log of newLogs) {
              console.log(`📨 Sending event from block ${log.blockNumber}`);
              res.write(`event: log\n`);
              res.write(`data: ${JSON.stringify(log)}\n\n`);
              setLastBlock(contractAddress, topic0, log.blockNumber);
            }
            
            // Update previous block for next iteration
            previousBlock = currentBlock;
          }
        } catch (error) {
          console.error(`❌ Polling error:`, error.message);
        }
      }, 10000); // Poll every 10 seconds
      
      // Store polling interval for cleanup
      const subscription = { pollInterval };
      activeSubscriptions.set(listenerKey, subscription);
      
      // Handle client disconnect
      res.on('close', () => {
        console.log(`🔌 Client disconnected, stopping poll interval`);
        clearInterval(pollInterval);
        activeSubscriptions.delete(listenerKey);
        console.log(`✓ Cleaned up polling interval`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Error starting listener:`, error.message);
    
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

/**
 * Get info about all active subscriptions
 */
export function getActiveSubscriptions() {
  return Array.from(activeSubscriptions.keys());
}

/**
 * Clean up all subscriptions
 */
export function cleanupAllSubscriptions() {
  for (const [key, subscription] of activeSubscriptions) {
    if (subscription.wsProvider) {
      subscription.wsProvider.off('log', subscription.onLog);
      subscription.wsProvider.destroy();
    }
    if (subscription.pollInterval) {
      clearInterval(subscription.pollInterval);
    }
  }
  activeSubscriptions.clear();
  console.log(`✓ All subscriptions cleaned up`);
}
