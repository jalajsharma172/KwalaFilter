// Main Express server with SSE-based log streaming
// This replaces the Socket.IO approach with a cleaner SSE implementation

import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { startListening, getActiveSubscriptions, cleanupAllSubscriptions } from './listeners/logListener.js';
import {getContractLatestBlockNumber} from "./listeners/getBlockNumber.js"
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeSubscriptions: getActiveSubscriptions()
  });
});

/**
 * Main SSE endpoint for listening to contract logs
 * 
 * Query parameters:
 *   - address: Contract address (required)
 *   - topic0: Event signature hash (required)
 *   - abi: Base64-encoded JSON ABI array (required for decoding)
 * 
 * Example: GET /listen?address=0x...&topic0=0x...&abi=BASE64
 */
app.get('/listen', (req, res) => {
  const { address, topic0, abi: abiEncoded } = req.query;

  console.log(`\n📥 New listen request:`);
  console.log(`   Address: ${address}`);
  console.log(`   Topic0: ${topic0}`);
  console.log(`   ABI (encoded) length: ${abiEncoded ? String(abiEncoded).length : 'none'}`);

  // Validate required parameters
  if (!address || !topic0) {
    return res.status(400).json({ error: 'Missing required parameters: address and topic0' });
  }
  if (!abiEncoded) {
    return res.status(400).json({ error: 'Missing required parameter: abi (Base64-encoded JSON)' });
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address format' });
  }

  // Validate topic0 format
  if (!/^0x[a-fA-F0-9]{64}$/.test(topic0)) {
    return res.status(400).json({ error: 'Invalid topic0 format (should be 0x followed by 64 hex characters)' });
  }

  // Decode and parse ABI
  let parsedAbi = null;
  try {
    const abiJsonString = Buffer.from(String(abiEncoded), 'base64').toString('utf8');
    parsedAbi = JSON.parse(abiJsonString);
    if (!Array.isArray(parsedAbi)) {
      return res.status(400).json({ error: 'ABI must decode to a JSON array' });
    }
    console.log(`   ABI decoded successfully: ${parsedAbi.length} entries`);
  } catch (e) {
    console.error('   ❌ Failed to decode/parse ABI:', e.message);
    return res.status(400).json({ error: 'Invalid ABI encoding or JSON parse failure' });
  }

  // Set up SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({
    message: 'Connected to log stream',
    address,
    topic0,
    abiEntries: parsedAbi.length,
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Start listening with decoded ABI
  startListening(address, topic0, res, parsedAbi);
});

/**
 * Status endpoint - shows active subscriptions
 */
app.get('/status', (req, res) => {
  const subscriptions = getActiveSubscriptions();
  res.json({
    status: 'running',
    subscriptions,
    timestamp: new Date().toISOString()
  });
});

// Save subscription to Supabase
app.post('/api/subscriptions', async (req, res) => {
  const { address, topic0, abi, api } = req.body || {};

  if (!address || !topic0 || !abi) {
    return res.status(400).json({ error: 'Missing required fields: address, topic0, abi' });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address format' });
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(topic0)) {
    return res.status(400).json({ error: 'Invalid topic0 format' });
  }

  let parsedAbi = abi;
  try {
    if (typeof abi === 'string') parsedAbi = JSON.parse(abi);
    if (!Array.isArray(parsedAbi)) return res.status(400).json({ error: 'ABI must be a JSON array' });
  } catch (err) {
    return res.status(400).json({ error: 'ABI is not valid JSON' });
  }

  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured on server' });
  }

  try {
    const insertBody = {
      address: address.toLowerCase(),
      topic0,
      abi: parsedAbi,
      api: api || null,
    };

    const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/subscriptions`;

    const resp = await fetch(sbUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(insertBody),
    });

    const json = await resp.json();
    if (!resp.ok) {
      console.error('Supabase insert error', resp.status, json);
      return res.status(resp.status).json({ error: json });
    }

    // attempt to determine latest block for this contract and store it in a separate table
    (async () => {
      try {
        const latestBlock = await getContractLatestBlockNumber(address.toLowerCase());
        if (latestBlock != null) {
          try { 
            const insertBody2 = {
              address: address.toLowerCase(),
              latest_block_number: latestBlock,
            };
            const sbUrl2 = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/subscription_latest_blocks`;
            const resp2 = await fetch(sbUrl2, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
                'Prefer': 'return=representation',
              },
              body: JSON.stringify(insertBody2),
            });
            const json2 = await resp2.json().catch(() => null);
            if (!resp2.ok) {
              console.warn('Could not save latest block to Supabase', resp2.status, json2);
            } else {
              console.log('Saved latest block for', address, '->', latestBlock);
            }
          } catch (err) {
            console.warn('Error saving latest block record:', err?.message || err);
          }
        } else {
          console.log('No logs found for', address, '- skipping latest block save');
        }
      } catch (err) {
        console.warn('Failed to compute latest block for', address, err?.message || err);
      }
    })();

    return res.json({ data: json });
  } catch (err) {
    console.error('Error saving subscription to Supabase:', err?.message || err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

/**
 * Serve frontend (if exists)
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try multiple possible build output locations
const possiblePaths = [
  path.join(__dirname, '../dist/public'),
  path.join(__dirname, '../client/dist'),
  path.join(__dirname, '../public'),
];

let distPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    distPath = p;
    console.log(`✓ Found frontend build at: ${distPath}`);
    break;
  }
}

if (distPath) {
  app.use(express.static(distPath));
}

app.use(express.static(path.join(__dirname, '../public')));

// Fallback: serve index.html for client-side routing
app.get('/', (req, res) => {
  if (!distPath) {
    return res.json({
      message: 'EVM Event Listener Backend',
      version: '2.0.0',
      endpoints: {
        listen: 'GET /listen?address=0x...&topic0=0x...',
        status: 'GET /status',
        health: 'GET /health'
      },
      note: 'Frontend build not found. Run: npm run build'
    });
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'EVM Event Listener Backend - No frontend index found',
      version: '2.0.0',
      endpoints: {
        listen: 'GET /listen?address=0x...&topic0=0x...',
        status: 'GET /status',
        health: 'GET /health'
      }
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`❌ Error:`, err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 EVM Event Listener Backend Started`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 Server running on: http://0.0.0.0:${config.PORT}`);
  console.log(`🌐 Environment: ${config.NODE_ENV}`);
  console.log(`${'='.repeat(60)}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n🛑 Shutting down gracefully...`);
  cleanupAllSubscriptions();
  server.close(() => {
    console.log(`✓ Server closed`);
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Shutting down gracefully...`);
  cleanupAllSubscriptions();
  server.close(() => {
    console.log(`✓ Server closed`);
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`❌ Uncaught Exception:`, error);
  cleanupAllSubscriptions();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`❌ Unhandled Rejection at:`, promise, `reason:`, reason);
});
