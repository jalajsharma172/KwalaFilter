// server/loglistener.js
// Improved log listener: historical catch-up + realtime WS (with polling fallback)
// Sends SSE events with both encoded and decoded payloads.
//
// Usage:
//   import { startListening, getActiveSubscriptions, cleanupAllSubscriptions } from './server/loglistener.js';
//   startListening(contractAddress, topic0, expressRes, contractAbi);
import { ethers } from 'ethers';
import { config } from '../config.js';
import { getLastBlock, setLastBlock } from '../storage/blockStore.js';
import { getContractCreationBlock } from './etherscanService.js';

// single shared HTTP provider (avoid recreating repeatedly)
const httpProvider = new ethers.JsonRpcProvider(config.RPC_URL );
 
// Configs (can be set via config)
const CHUNK_SIZE = config.CHUNK_SIZE || 10;
const POLL_INTERVAL_MS = config.POLL_INTERVAL_MS || 10_000;
  
// Map listenerKey -> { clients: [res,...], wsProvider?, onLog?, pollInterval?, previousBlock?, iface? }
const activeSubscriptions = new Map();

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}



// export async function fetchHistoricalLogs(contractAddress, topic0, fromBlock, toBlock) {
//   if (fromBlock > toBlock) return [];
//   console.log(`📜 Fetching historical logs for ${contractAddress} [${fromBlock}..${toBlock}]`);
//   const allLogs = [];

//   for (let block = fromBlock; block <= toBlock; block += CHUNK_SIZE) {
//     const chunkTo = Math.min(block + CHUNK_SIZE - 1, toBlock);
//     try {
//       console.log(`  📍 Fetching chunk: ${block} -> ${chunkTo}`);
//       const logs = await httpProvider.getLogs({
//         address: contractAddress,
//         topics: [topic0],
//         fromBlock: block,
//         toBlock: chunkTo,
//       });
//       if (logs && logs.length) {
//         allLogs.push(...logs);
//         console.log(`    ✓ ${logs.length} logs`);
//       } else {
//         console.log(`    ✓ 0 logs`);
//       }
//       // be gentle with RPC rate limits
//       await sleep(100);
//     } catch (err) {
//       console.error(`  ❌ Error fetching ${block}-${chunkTo}:`, err?.message || err);
//       // continue to next chunk
//     }
//   }

//   // sort by blockNumber & logIndex to preserve event order
//   allLogs.sort((a, b) => {
//     if (a.blockNumber === b.blockNumber) return (a.logIndex || 0) - (b.logIndex || 0);
//     return a.blockNumber - b.blockNumber;
//   });

//   return allLogs;
// }

export async function fetchHistoricalLogs(contractAddress, topic0, fromBlock, toBlock) {
  if (fromBlock > toBlock) return [];
  console.log(`📜 Fetching historical logs for ${contractAddress} [${fromBlock}..${toBlock}]`);

  const allLogs = [];

  for (let block = fromBlock; block <= toBlock; block += CHUNK_SIZE) {
    const chunkTo = Math.min(block + CHUNK_SIZE - 1, toBlock);

    console.log(`  📍 Fetching chunk: ${block} -> ${chunkTo}`);

    const filter = {
      address: contractAddress,
      topics: [topic0],
      fromBlock: block,
      toBlock: chunkTo,
    };

    let logs = [];

    // If this is the *final chunk AND contains latest block → use retry version*
    if (chunkTo === toBlock) {
      logs = await safeGetLogsWithRetry(httpProvider, filter, 6, 10*1000);
    } else {
      logs = await httpProvider.getLogs(filter).catch(() => []);
    }

    if (logs.length > 0) {
      console.log(`    ✓ ${logs.length} logs`);
      allLogs.push(...logs);
    } else {
      console.log(`    ✓ 0 logs`);
    }

    await sleep(100);
  }

  allLogs.sort((a, b) => {
    if (a.blockNumber === b.blockNumber) return (a.logIndex || 0) - (b.logIndex || 0);
    return a.blockNumber - b.blockNumber;
  });

  return allLogs;
}



async function safeGetLogsWithRetry(provider, filter, retries = 5, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const logs = await provider.getLogs(filter);

      // If logs found → return immediately
      if (logs.length > 0) return logs;

      // If this is not the last retry → wait and retry
      if (i < retries - 1) {
        console.log(`⏳ Waiting ${delayMs}ms for logs to appear...`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    } catch (err) {
      console.log("⚠️ Retry error:", err.message);
    }
  }

  return []; // no logs even after retries
}




/**
 * Attach a new SSE client and start (or attach to) a subscription for given contract+topic.
 *
 * NOTE: `abi` must be provided (array) so that logs can be decoded.
 */
export async function startListening(contractAddress, topic0, res, abi) {
  if (!contractAddress || !topic0) {
    throw new Error('contractAddress and topic0 are required');
  }
  const listenerKey = `${contractAddress.toLowerCase()}-${topic0}`;

  if (!abi) {
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: 'Contract ABI is required to decode logs.' })}\n\n`);
    res.end();
    return;
  }

  const iface = new ethers.Interface(abi);




  // ensure SSE headers (caller may already set them)
  try {
    res.writeHead?.(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
  } catch (e) {
    // ignore if writeHead not available
  }

  // If subscription exists -> attach client
  if (activeSubscriptions.has(listenerKey)) {
    const subscription = activeSubscriptions.get(listenerKey);
    subscription.clients.push(res);
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ message: 'Attached to existing subscription' })}\n\n`);
    return;
  }

  // New subscription
  const clients = [res];
  activeSubscriptions.set(listenerKey, { clients, iface });

  // cleanup per-client
  res.on('close', () => {
    const subscription = activeSubscriptions.get(listenerKey);
    if (subscription) {
      subscription.clients = subscription.clients.filter((client) => client !== res);
      if (subscription.clients.length === 0) {
        activeSubscriptions.delete(listenerKey);
      }
    }
  });

  try {
    // get creation block (if available)
    let fromBlock = await getContractCreationBlock(contractAddress);
    if (!fromBlock) {
      const currentBlock = await httpProvider.getBlockNumber();
      fromBlock = Math.max(0, currentBlock - 100);
      console.log('⚠️ using fallback fromBlock:', fromBlock);
    }

    // latest block
    const latestBlock = await httpProvider.getBlockNumber();

    // get last processed block
    let lastProcessedBlock = await getLastBlock(contractAddress, topic0);
    // semantics: lastProcessedBlock = block number we've processed up to.
    if (lastProcessedBlock == null) {
      lastProcessedBlock = fromBlock - 1;
    }

    console.log(`Subscription status for ${listenerKey}`);
    console.log('  creationBlock:', fromBlock);
    console.log('  latestBlock:', latestBlock);
    console.log('  lastProcessedBlock:', lastProcessedBlock);

    // notify client
    clients.forEach((c) => {
      try {
        c.write(`event: status\n`);
        c.write(`data: ${JSON.stringify({ status: 'catching-up', message: `Catching up from ${lastProcessedBlock + 1} to ${latestBlock}` })}\n\n`);
      } catch (e) { /* ignore */ }
    });

    // if behind -> fetch historical logs
    if (lastProcessedBlock < latestBlock) {
      const historical = await fetchHistoricalLogs(contractAddress, topic0, lastProcessedBlock + 1, latestBlock);
      for (const log of historical) {
        // decode if iface available
        const decoded =decodeEventLog(log, abi);  // pass ABI ARRAY, not iface
        console.log("Decoded stuff",decoded);
        
        const payload = {
          encoded: log,
          decoded,
        };
        // send to SSE clients
        for (const c of clients.slice()) {
          try { c.write(`event: log\n`); c.write(`data: ${JSON.stringify(payload)}\n\n`); } catch (e) { /* ignore */ }
        }
        // persist last block only after processing
        try { await setLastBlock(contractAddress, topic0, log.blockNumber); } catch (e) { console.warn('setLastBlock failed', e?.message || e); }
      }
      console.log(`✓ historical logs sent: ${historical.length}`);
    }

    // switch to real-time
    clients.forEach((c) => {
      try {
        c.write(`event: status\n`);
        c.write(`data: ${JSON.stringify({ status: 'listening', message: 'Now listening for real-time events' })}\n\n`);
      } catch (e) {}
    });

    // attach realtime WS provider (with filter)
    try {
      const wsProvider = new ethers.WebSocketProvider(config.RPC_WS_URL);
      const filter = {
        address: contractAddress,
        topics: [topic0],
      };

      const onLog = async (log) => {
        try {
          // some ws providers may forward unrelated logs; confirm address/topic
          if (String(log.address).toLowerCase() !== contractAddress.toLowerCase()) return;
          if (!log.topics || log.topics[0] !== topic0) return;

          // decode
          const decoded = decodeEventLog(log, abi);
          const payload = { encoded: log, decoded };

          // send to all clients
          for (const c of clients.slice()) {
            try { c.write(`event: log\n`); c.write(`data: ${JSON.stringify(payload)}\n\n`); } catch (e) {}
          }

          // persist last processed block
          try { await setLastBlock(contractAddress, topic0, log.blockNumber); } catch (e) { console.warn('setLastBlock failed', e?.message || e); }
        } catch (e) {
          console.error('Error in onLog processing:', e?.message || e);
        }
      };

      // attach using filter
      wsProvider.on(filter, onLog);

      // store subscription info
      const sub = activeSubscriptions.get(listenerKey);
      sub.wsProvider = wsProvider;
      sub.onLog = onLog;
      sub.previousBlock = latestBlock;
      sub.clients = clients;
      sub.iface = iface;
      activeSubscriptions.set(listenerKey, sub);

      // WebSocket close fallback to polling
      try {
            if (wsProvider._websocket) {
              wsProvider._websocket.onclose = (ev) => {
                console.warn("WebSocket closed — falling back to polling", ev?.reason || ev);
                const s = activeSubscriptions.get(listenerKey);
                if (s && !s.pollInterval) startPollingForLogs(listenerKey, contractAddress, topic0);
              };
            }
      } catch (error) {
        console.log("Error is ",error);
        
      }

      console.log('✓ WebSocket listener attached for', listenerKey);
    } catch (wsErr) {
      console.warn('⚠️ WebSocket provider failed — using polling fallback', wsErr?.message || wsErr);
      startPollingForLogs(listenerKey, contractAddress, topic0);
    }
  } catch (err) {
    console.error('❌ Error in startListening:', err?.message || err);
    try {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: err?.message || String(err) })}\n\n`);
      res.end();
    } catch (e) { /* ignore */ }
  }
}

/**
 * Polling fallback: periodically fetch logs between previousBlock+1 and currentBlock
 */
function startPollingForLogs(listenerKey, contractAddress, topic0) {
  const sub = activeSubscriptions.get(listenerKey);
  if (!sub) return;
  if (sub.pollInterval) return;

  // initialize previousBlock if missing
  (async () => {
    try {
      sub.previousBlock = sub.previousBlock || (await httpProvider.getBlockNumber());
    } catch (e) {
      sub.previousBlock = 0;
    }
  })();

  const pollFn = async () => {
    try {
      const currentBlock = await httpProvider.getBlockNumber();
      if (!sub.previousBlock) sub.previousBlock = currentBlock;
      if (currentBlock > sub.previousBlock) {
        const from = sub.previousBlock + 1;
        const to = currentBlock;
        const newLogs = await fetchHistoricalLogs(contractAddress, topic0, from, to);
        for (const log of newLogs) {
          const decoded = sub.iface ? decodeEventLog(log, sub.iface) : null;
          const payload = { encoded: log, decoded };
          for (const c of sub.clients.slice()) {
            try { c.write(`event: log\n`); c.write(`data: ${JSON.stringify(payload)}\n\n`); } catch (e) {}
          }
          try { await setLastBlock(contractAddress, topic0, log.blockNumber); } catch (e) { console.warn('setLastBlock failed', e?.message || e); }
        }
        sub.previousBlock = currentBlock;
      }
    } catch (e) {
      console.error('❌ Polling error:', e?.message || e);
    }
  };

  const interval = setInterval(pollFn, POLL_INTERVAL_MS);
  sub.pollInterval = interval;
  activeSubscriptions.set(listenerKey, sub);
  console.log(`✓ Started polling for ${listenerKey} every ${POLL_INTERVAL_MS}ms`);
}

export function cleanUpSubscription(listenerKey) {
  const sub = activeSubscriptions.get(listenerKey);
  if (!sub) return;
  console.log(`🧹 Cleaning up ${listenerKey}`);

  try {
    if (sub.wsProvider && sub.onLog) {
      try { sub.wsProvider.off({ address: null, topics: null }, sub.onLog); } catch (_) {}
      try { sub.wsProvider.off(sub.onLog); } catch (_) {}
      try { sub.wsProvider.off(); } catch (_) {}
      try { sub.wsProvider.destroy(); } catch (_) {}
    }
  } catch (e) {
    console.warn('Error cleaning wsProvider', e?.message || e);
  }

  if (sub.pollInterval) {
    clearInterval(sub.pollInterval);
  }

  // close SSE connections gracefully (optional)
  if (sub.clients && sub.clients.length) {
    for (const c of sub.clients) {
      try {
        c.write(`event: status\n`);
        c.write(`data: ${JSON.stringify({ status: 'stopped', message: 'Server stopped subscription' })}\n\n`);
      } catch (_) {}
      try { c.end?.(); } catch (_) {}
    }
  }

  activeSubscriptions.delete(listenerKey);
  console.log(`✓ Cleaned up ${listenerKey}`);
}

export function getActiveSubscriptions() {
  return Array.from(activeSubscriptions.keys());
}

export function cleanupAllSubscriptions() {
  for (const key of Array.from(activeSubscriptions.keys())) {
    cleanUpSubscription(key);
  }
  console.log('✓ All subscriptions cleaned up');
}



 
 

function decodeEventLog(rawLog, abi) {
  try {
    // ensure abi is an array/object (not a JSON string)
    const abiObj = typeof abi === 'string' ? JSON.parse(abi) : abi;

    const iface = new ethers.Interface(abiObj);

    // parseLog will throw if topics[0] doesn't match any event signature
    const parsed = iface.parseLog({
      topics: rawLog.topics,
      data: rawLog.data
    });

    // build a plain JS args object
    const args = {};
    // parsed.args is array-like with named keys
    for (const k of Object.keys(parsed.args)) {
      const v = parsed.args[k];
      if (typeof v === 'bigint') {
        args[k] = v.toString();
      } else if (Array.isArray(v)) {
        args[k] = v.map(x => (typeof x === 'bigint' ? x.toString() : x));
      } else if (v && typeof v === 'object' && typeof v.toHexString === 'function') {
        // BytesLike or similar
        args[k] = ethers.hexlify(v);
      } else {
        args[k] = v;
      }
    }

    return {
      status: true,
      eventName: parsed.name,
      args,
      raw: {
        data: rawLog.data,
        topics: rawLog.topics,
      }
    };
  } catch (err) {
    // parseLog throws when there is no matching event topic OR for other reasons
    return {
      status: false,
      error: err?.message || String(err),
    };
  }
}

 

 













// // Core log listening logic
// // Handles both historical catch-up (via HTTP) and real-time subscriptions (via WebSocket)

// import { ethers } from 'ethers';
// import { config } from '../config.js';
// import { getLastBlock, setLastBlock } from '../storage/blockStore.js';
// import { getContractCreationBlock } from './etherscanService.js';

// // Store active subscriptions per client
// const activeSubscriptions = new Map();

// /**
//  * Fetch historical logs in chunks
//  * @param {string} contractAddress - Contract address
//  * @param {string} topic0 - Event signature (topic0)
//  * @param {number} fromBlock - Starting block
//  * @param {number} toBlock - Ending block
//  * @returns {Promise<array>} - Array of logs
//  */
// export async function fetchHistoricalLogs(contractAddress, topic0, fromBlock, toBlock) {
//   console.log(`📜 Fetching historical logs from block ${fromBlock} to ${toBlock}...`);
  
//   // Use HTTP provider for efficient historical queries
//   const httpProvider = new ethers.JsonRpcProvider(config.RPC_URL);
//   const allLogs = [];
  
//   const CHUNK_SIZE = 3000; // Etherscan limit
  
//   for (let block = fromBlock; block <= toBlock; block += CHUNK_SIZE) {
//     const chunkTo = Math.min(block + CHUNK_SIZE - 1, toBlock);
    
//     try {
//       console.log(`  📍 Fetching chunk: blocks ${block} to ${chunkTo}...`);
      
//       const logs = await httpProvider.getLogs({
//         address: contractAddress,
//         topics: [topic0],
//         fromBlock: block,
//         toBlock: chunkTo,
//       });
      
//       allLogs.push(...logs);
//       console.log(`    ✓ Found ${logs.length} logs in this chunk`);
      
//       // Small delay to avoid rate limiting
//       await new Promise(resolve => setTimeout(resolve, 100));
//     } catch (error) {
//       console.error(`  ❌ Error fetching logs for blocks ${block}-${chunkTo}:`, error.message);
//       // Continue with next chunk even if one fails
//     }
//   }
  
//   console.log(`✓ Total historical logs fetched: ${allLogs.length}`);
//   return allLogs;
// }

// /**
//  * Start listening to a contract and stream logs to clients
//  * @param {string} contractAddress - Contract address
//  * @param {string} topic0 - Event signature (topic0)
//  * @param {object} res - Express response object for SSE
//  */
// export async function startListening(contractAddress, topic0, res) {
//   console.log(`\n🚀 Starting listener for ${contractAddress} with topic ${topic0.substring(0, 10)}...`);
  
//   const listenerKey = `${contractAddress}-${topic0}`;
  
//   try {
//     // Get creation block or use fallback
//     let fromBlock = await getContractCreationBlock(contractAddress);
//       const httpProvider = new ethers.JsonRpcProvider(config.RPC_URL);
//     if (!fromBlock) {
//       // Fallback: start from 100 blocks ago

//       const currentBlock = await httpProvider.getBlockNumber();
//       fromBlock = Math.max(0, currentBlock - 100);
//       console.log(`⚠️  Using fallback fromBlock: ${fromBlock}`);
//     }
    
//     // Get latest block
//     const latestBlock = await httpProvider.getBlockNumber();
    
//     // Check if we need to catch up
//     let lastProcessedBlock = getLastBlock(contractAddress, topic0);
    
//     if (!lastProcessedBlock) {
//       lastProcessedBlock = fromBlock;
//     }
    
//     console.log(`📊 Status:`);
//     console.log(`  Creation block: ${fromBlock}`);
//     console.log(`  Latest block: ${latestBlock}`);
//     console.log(`  Last processed: ${lastProcessedBlock}`);
    
//     // Send initial status to client
//     res.write(`event: status\n`);
//     res.write(`data: ${JSON.stringify({ 
//       status: 'catching-up',
//       message: `Catching up from block ${lastProcessedBlock} to ${latestBlock}`
//     })}\n\n`);
    
//     // Fetch historical logs if we're behind
//     if (lastProcessedBlock < latestBlock - 1) {
//       const historicalLogs = await fetchHistoricalLogs(
//         contractAddress,
//         topic0,
//         lastProcessedBlock + 1,
//         latestBlock - 1
//       );
      
//       // Stream historical logs to client
//       for (const log of historicalLogs) {
//         res.write(`event: log\n`);
//         res.write(`data: ${JSON.stringify(log)}\n\n`);
//         setLastBlock(contractAddress, topic0, log.blockNumber);
//       }
      
//       console.log(`✓ Caught up with ${historicalLogs.length} historical logs`);
//     }
    
//     // Update last processed block
//     setLastBlock(contractAddress, topic0, latestBlock);
    
//     // Send status that we're now listening for real-time events
//     res.write(`event: status\n`);
//     res.write(`data: ${JSON.stringify({ 
//       status: 'listening',
//       message: 'Now listening for real-time events'
//     })}\n\n`);
    
//     console.log(`✓ Switched to real-time listening mode`);
    
//     // Set up real-time WebSocket listener
//     try {
//       // Try WebSocket provider for real-time updates
//       const wsProvider = new ethers.WebSocketProvider(config.RPC_WS_URL);
      
//       const onLog = (log) => {
//         // Only process logs for our contract and topic
//         if (log.address.toLowerCase() === contractAddress.toLowerCase() &&
//             log.topics[0] === topic0) {
//           console.log(`📨 Real-time event received at block ${log.blockNumber}`);
          
//           res.write(`event: log\n`);
//           res.write(`data: ${JSON.stringify(log)}\n\n`);
//           setLastBlock(contractAddress, topic0, log.blockNumber);
//         }
        
//         const decodedLog = decodeEventLog(log, abi);
//         console.log(`Encoded Data - ${JSON.stringify(log.topics)}`);
//         console.log(`Decoded Data - ${JSON.stringify(decodedLog)}`);
//       };
      
//       // Replace 'log' with a valid filter object for listening to logs
//       const filter = {
//         address: contractAddress, // Contract address
//         topics: [topic0], // Event signature (topic0)
//       };

//       wsProvider.on(filter, onLog); // Use filter instead of 'log'

//       // Store subscription for cleanup
//       const subscription = { wsProvider, onLog };
//       activeSubscriptions.set(listenerKey, subscription);

//       console.log(`✓ Real-time WebSocket listener attached`);

//       // Handle client disconnect
//       res.on('close', () => {
//         console.log(`🔌 Client disconnected from ${listenerKey}`);

//         // Clean up WebSocket subscription
//         const sub = activeSubscriptions.get(listenerKey);
//         if (sub) {
//           sub.wsProvider.off(filter, sub.onLog); // Use filter for cleanup
//           sub.wsProvider.destroy();
//           activeSubscriptions.delete(listenerKey);
//           console.log(`✓ Cleaned up WebSocket listener`);
//         }
//       });
      
//     } catch (wsError) {
//       console.warn(`⚠️  WebSocket connection failed, falling back to 1-second block polling:`, wsError.message);
      
//       // Fallback to polling if WebSocket fails
//       // Track the current/latest block as the baseline for polling
//       let previousBlock = latestBlock;
      
//       const pollInterval = setInterval(async () => {
//         try {
//           // Get latest block number
//           const currentBlock = await httpProvider.getBlockNumber();
          
//           console.log(`⏱️  [Poll] Current block: ${currentBlock}, Previous: ${previousBlock}`);
          
//           // Only fetch logs if block number has changed
//           if (currentBlock > previousBlock) {
//             console.log(`📍 New block(s) detected! Fetching logs from block ${previousBlock + 1} to ${currentBlock}`);
            
//             const newLogs = await fetchHistoricalLogs(
//               contractAddress,
//               topic0,
//               previousBlock + 1,
//               currentBlock
//             );
            
//             // Stream any new logs to client
//             for (const log of newLogs) {
//               console.log(`📨 Sending event from block ${log.blockNumber}`);
//               res.write(`event: log\n`);
//               res.write(`data: ${JSON.stringify(log)}\n\n`);
//               setLastBlock(contractAddress, topic0, log.blockNumber);
//             }
            
//             // Update previous block for next iteration
//             previousBlock = currentBlock;
//           }
//         } catch (error) {
//           console.error(`❌ Polling error:`, error.message);
//         }
//       }, 10000); // Poll every 10 seconds
      
//       // Store polling interval for cleanup
//       const subscription = { pollInterval };
//       activeSubscriptions.set(listenerKey, subscription);
      
//       // Handle client disconnect
//       res.on('close', () => {
//         console.log(`🔌 Client disconnected, stopping poll interval`);
//         clearInterval(pollInterval);
//         activeSubscriptions.delete(listenerKey);
//         console.log(`✓ Cleaned up polling interval`);
//       });
//     }
    
//   } catch (error) {
//     console.error(`❌ Error starting listener:`, error.message);
    
//     res.write(`event: error\n`);
//     res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
//     res.end();
//   }
// }

// /**
//  * Get info about all active subscriptions
//  */
// export function getActiveSubscriptions() {
//   return Array.from(activeSubscriptions.keys());
// }

// /**
//  * Clean up all subscriptions
//  */
// export function cleanupAllSubscriptions() {
//   for (const [key, subscription] of activeSubscriptions) {
//     if (subscription.wsProvider) {
//       subscription.wsProvider.off('log', subscription.onLog);
//       subscription.wsProvider.destroy();
//     }
//     if (subscription.pollInterval) {
//       clearInterval(subscription.pollInterval);
//     }
//   }
//   activeSubscriptions.clear();
//   console.log(`✓ All subscriptions cleaned up`);
// }

// // Decode Ethereum event logs using the ABI
// export function decodeEventLog(log, abi) {
//   try {
//     const iface = new ethers.Interface(abi);

//     // Find the event by matching the first topic with the event signature
//     const eventFragment = abi.find((item) => item.type === 'event' && iface.getEventTopic(item) === log.topics[0]);
//     if (!eventFragment) {
//       throw new Error('Event signature not found in ABI.');
//     }

//     // Decode the event
//     const decodedLog = iface.decodeEventLog(eventFragment.name, log.data, log.topics);

//     // Format the output
//     const output = {
//       eventName: eventFragment.name,
//       blockNumber: log.blockNumber,
//       txHash: log.transactionHash,
//       address: ethers.getAddress(log.address), // Checksummed address
//       args: {},
//     };

//     // Populate decoded arguments
//     eventFragment.inputs.forEach((input, index) => {
//       const value = decodedLog[index];
//       if (input.type === 'uint256') {
//         output.args[input.name] = value.toString(); // Convert uint256 to decimal
//       } else if (input.type === 'address') {
//         output.args[input.name] = ethers.getAddress(value); // Checksummed address
//       } else if (input.type.startsWith('bytes')) {
//         output.args[input.name] = ethers.hexlify(value); // Hex representation
//       } else if (input.type.endsWith('[]')) {
//         output.args[input.name] = value.map((item) => item.toString()); // Decode arrays
//       } else {
//         output.args[input.name] = value; // Default case
//       }
//     });

//     return output;
//   } catch (error) {
//     return {
//       error: error.message,
//       reason: 'Decoding failed. Ensure the ABI and log data are correct.',
//     };
//   }
// }
