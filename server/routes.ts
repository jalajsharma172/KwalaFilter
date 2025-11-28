import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import fetch from 'node-fetch';
import { startListening, getActiveSubscriptions, cleanupAllSubscriptions } from "./listeners/logListener.js";
import { config } from './config.js';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Health endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      activeSubscriptions: getActiveSubscriptions(),
    });
  });

  // SSE listen endpoint
  app.get('/listen', (req, res) => {
    const { address, topic0, abi: abiEncoded ,api} = req.query as Record<string, string | undefined>;

    console.log(`\n📥 New listen request: address=${address} topic0=${topic0} api=${api}`);

    if (!address || !topic0) {
      return res.status(400).json({ error: 'Missing required parameters: address and topic0' });
    } 

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format- No 0x' });
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(topic0)) {
      return res.status(400).json({ error: 'Invalid topic0 format (should be 0x followed by 64 hex characters)' });
    }

    if (!abiEncoded) {
      return res.status(400).json({ error: 'Missing required parameter: abi (Base64-encoded JSON)' });
    }

    let parsedAbi: any;
    try {
      const abiJsonString = Buffer.from(String(abiEncoded), 'base64').toString('utf8');
      parsedAbi = JSON.parse(abiJsonString);
      if (!Array.isArray(parsedAbi)) {
        return res.status(400).json({ error: 'ABI must decode to a JSON array' });
      }
    } catch (e: any) {
      console.error('Failed to decode/parse ABI:', e?.message || e);
      return res.status(400).json({ error: 'Invalid ABI encoding or JSON parse failure' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Initial message
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ message: 'Connected to log stream', address, topic0, abiEntries: parsedAbi.length, timestamp: new Date().toISOString() })}\n\n`);

    // Delegate to existing SSE listener implementation
    startListening(address, topic0, res, parsedAbi).catch((err) => {
      console.error('startListening error:', err?.message || err);
      try {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ error: err?.message || String(err) })}\n\n`);
        res.end();
      } catch (_) {}
    });
  });

  // POST save subscription to Supabase
  app.post('/api/subscriptions', async (req, res) => {
    // Supabase config presence is validated below; avoid logging secrets here
    const { address, topic0, abi, api } = req.body || {};

    // basic validation
    if (!address || !topic0 || !abi) {
      return res.status(400).json({ error: 'Missing required fields: address, topic0, abi' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(topic0)) {
      return res.status(400).json({ error: 'Invalid topic0 format' });
    }

    // parse/validate ABI if string
    let parsedAbi = abi;
    try {
      if (typeof abi === 'string') parsedAbi = JSON.parse(abi);
      if (!Array.isArray(parsedAbi)) return res.status(400).json({ error: 'ABI must be a JSON array' });
    } catch (err) {
      return res.status(400).json({ error: 'ABI is not valid JSON' });
    }

    // ensure Supabase configured
    if (!config.SUPABASE_URL && !config.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }else{
     
      
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

      return res.json({ data: json });
    } catch (err: any) {
      console.error('Error saving subscription to Supabase:', err?.message || err);
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // Status endpoint
  app.get('/status', (_req, res) => {
    res.json({ status: 'running', subscriptions: getActiveSubscriptions(), timestamp: new Date().toISOString() });
  });

  // Serve static public folder
  const __dirname = path.resolve(path.join(process.cwd(), 'server'));
  const publicPath = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicPath)) {
    app.use(fs.realpathSync(publicPath), (req, res, next) => next());
  }

  // Return the underlying HTTP server so the caller can `listen()`
  return httpServer;
}
