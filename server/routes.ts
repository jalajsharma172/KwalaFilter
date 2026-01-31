import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import fetch from 'node-fetch';
import { startListening, getActiveSubscriptions } from "./listeners/logListener.js";
import { getContractLatestBlockNumber } from './listeners/getBlockNumber.js';
import { config } from './config.js';
import { ethers } from "ethers";
import { SERVER_WALLET_ADDRESS, TOKEN_ADDRESS, chargeUser } from './billing.js';

export async function registerRoutes(app: Express): Promise<Server> {
  // Price Alerts API
  app.post('/api/price-alerts', async (req, res) => {
    try {
      const { workflowName, chain, targetPrice, api, body } = req.body;

      if (!workflowName || !targetPrice) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate JSON body
      let parsedBody = body;
      try {
        if (typeof body === 'string') {
          parsedBody = JSON.parse(body);
        }
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in body' });
      }

      // Use Fetch to Supabase REST API
      const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/PriceAlerts`;

      const response = await fetch(sbUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          WorkflowName: workflowName,
          Chain: chain,
          The: parseFloat(targetPrice),
          API: api,
          Body: parsedBody
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase error:', response.status, errorText);
        throw new Error(`Supabase error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error creating price alert:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  // Health endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      activeSubscriptions: getActiveSubscriptions(),
    });
  });

  //check score for the tokens
  app.post('/checkscore', async (req, res) => {
    const { walletaddress, twiter_id, optionname } = req.body;
    if (!walletaddress || !twiter_id || !optionname) {
      return res.status(400).json({ error: 'Missing required parameters: walletaddress, twiter_id, optionname' });
    }
    if (optionname == 'both') {
      const apiUrl = `https://api.fairscale.xyz/score?wallet=${walletaddress}&twitter=${twiter_id}`;
      const apiKey = "7abaf3b00b912f94d6e3c7e7996e3afc6d6ba7a4030b0904ef7864c06fdd75fb";
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "fairkey": apiKey,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fairscale API Error:", response.status, errorText);
        return res.status(400).json({ error: `Fairscale API failed: ${response.status}` });
      }
      const data = await response.json() as any;

      res.json({
        fairscore_base: data.fairscore_base,
        social_score: data.social_score,
        fairscore: data.fairscore,
        badges_count: data.badges ? data.badges.length : 0
      });
    }


  })


  // Billing Config API
  app.get('/api/config/billing', (_req, res) => {
    if (!SERVER_WALLET_ADDRESS || !TOKEN_ADDRESS) {
      return res.status(500).json({ error: 'Billing not configured on server' });
    }
    res.json({
      tokenAddress: TOKEN_ADDRESS,
      serverWalletAddress: SERVER_WALLET_ADDRESS,
      defaultFee: "0.001"
    });
  });

  // Manual Billing Charge API
  app.post('/api/billing/charge', async (req, res) => {
    const { userAddress, amount } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'Missing userAddress' });
    }

    try {
      let feeAmount;
      if (amount) {
        try {
          feeAmount = ethers.parseUnits(String(amount), 18);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid amount format' });
        }
      }

      const result = await chargeUser(userAddress, feeAmount);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (e: any) {
      console.error("Manual charge error:", e);
      res.status(500).json({ error: e.message || String(e) });
    }
  });


  // Ethereum Mint API (Sepolia)
  // Distributor Claim API
  app.post('/api/mint', async (req, res) => {
    try {
      const { walletAddress, amount } = req.body;

      if (!walletAddress || !amount) {
        return res.status(400).json({ error: "Missing required fields: walletAddress, amount" });
      }

      const privateKey = process.env.ETH_PRIVATE_KEY;
      if (!privateKey) {
        return res.status(500).json({ error: "Server misconfiguration: Mint authority key missing" });
      }

      const rpcUrl = process.env.RPC_URL || "https://rpc.sepolia.org";
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Distributor Contract
      const distributorAddress = "0xbFdFAF326C1cA399Da54954e570a165d3E7548B4";
      const distributorAbi = [
        "function nonces(address user) view returns (uint256)"
      ];
      const distributor = new ethers.Contract(distributorAddress, distributorAbi, provider);

      // 1. Get Nonce from Contract
      const nonce = await distributor.nonces(walletAddress);

      // 2. Define Amount & Deadline
      const amountInWei = ethers.parseUnits(amount.toString(), 18);
      const deadline = Math.floor(Date.now() / 1000) + (30 * 60 * 60); // 30 hours from now

      // 3. Chain ID (Sepolia = 11155111)
      const network = await provider.getNetwork();
      const chainId = network.chainId;

      // 4. Create Message Hash (Must match Solidity: abi.encodePacked(...))
      // keccak256(abi.encodePacked(block.chainid, address(this), user, amount, nonce, deadline))
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "address", "uint256", "uint256", "uint256"],
        [chainId, distributorAddress, walletAddress, amountInWei, nonce, deadline]
      );

      // 5. Sign the binary hash
      const signature = await wallet.signMessage(ethers.getBytes(messageHash));

      console.log(`Generated signature for ${walletAddress}: nonce=${nonce}, amount=${amount}`);

      return res.json({
        status: "success",
        signature,
        nonce: nonce.toString(),
        amount: amountInWei.toString(),
        deadline: deadline.toString(),
        distributorAddress,
        chainId: chainId.toString()
      });

    } catch (error: any) {
      console.error("Distributor Sign API Error:", error);
      return res.status(500).json({ error: error.message || String(error) });
    }
  });

  // SSE listen endpoint
  app.get('/listen', (req, res) => {
    const { address, topic0, abi: abiEncoded, api } = req.query as Record<string, string | undefined>;

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
      } catch (_) { }
    });
  });

  // POST save subscription to Supabase
  app.post('/api/subscriptions', async (req, res) => {
    // Supabase config presence is validated below; avoid logging secrets here
    const { address, blocknumber, topic0, abi, api, params, times, ActionName, ActionType, TargetFunction, TargetFunctionParameters, TargetContract } = req.body || {};

    // basic validation
    if (!address || !topic0 || !blocknumber) {
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
    } else {


    }

    try {
      const insertBody = {
        address: address.toLowerCase(),
        latest_block_number: blocknumber,
        abi: abi,
        event_signature: topic0,
        api: api,
        params: params,
        times: times,
        ActionName: ActionName,
        ActionType: ActionType,
        TargetFunction: TargetFunction,
        TargetContract,
        TargetFunctionParameters
      };

      const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/subscription_latest_blocks`;

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


      (async () => {
        try {
          const latestBlock = await getContractLatestBlockNumber(address.toLowerCase());
          if (latestBlock != null) {
            try {
              const updateBody = {
                latest_block_number: latestBlock,
              };
              // Supabase REST API endpoint with filter
              const sbUrl2 =
                `${config.SUPABASE_URL.replace(/\/$/, '')}` +
                `/rest/v1/subscription_latest_blocks?address=eq.${address.toLowerCase()}`;
              const resp2 = await fetch(sbUrl2, {
                method: 'PATCH', // IMPORTANT: Use PATCH for update
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
                  'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
                  'Prefer': 'return=representation',
                },
                body: JSON.stringify(updateBody),
              });
              const json2 = await resp2.json().catch(() => null);
              if (!resp2.ok) {
                console.warn('Could not save latest block to Supabase', resp2.status, json2);
              } else {
                console.log('Saved latest block for', address, '->', latestBlock);
              }
            } catch (err) {
              console.warn('Error saving latest block record:', ((err as any)?.message ?? String(err)));
            }
          } else {
            console.log('No logs found for', address, '- skipping latest block save');
          }
        } catch (err) {
          console.warn('Failed to compute latest block for', address, ((err as any)?.message ?? String(err)));
        }
      })();

      return res.json({ data: json });
    } catch (err: any) {
      console.error('Error saving subscription to Supabase:', err?.message || err);
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // GET subscription_latest_blocks from Supabase
  app.get('/api/subscription-latest-blocks', async (_req, res) => {
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    try {
      const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/subscription_latest_blocks?select=*`;
      const resp = await fetch(sbUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        console.error('Supabase fetch subscription_latest_blocks error', resp.status, json);
        return res.status(resp.status).json({ error: json });
      }

      return res.json(json || []);
    } catch (err: any) {
      console.error('Error fetching subscription_latest_blocks from Supabase:', err?.message || err);
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // GET workflows from Supabase (returns workflow records)
  app.get('/api/workflows', async (_req, res) => {
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    try {
      const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/Workflow`;
      const resp = await fetch(sbUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        console.error('Supabase fetch workflows error', resp.status, json);
        return res.status(resp.status).json({ error: json });
      }

      return res.json(json || []);
    } catch (err: any) {
      console.error('Error fetching workflows from Supabase:', err?.message || err);
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // GET functions from Supabase
  app.get('/api/functions', async (_req, res) => {
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured on server' });
    }

    try {
      const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/Functions`;
      const resp = await fetch(sbUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        console.error('Supabase fetch functions error', resp.status, json);
        return res.status(resp.status).json({ error: json });
      }

      return res.json(json || []);
    } catch (err: any) {
      console.error('Error fetching functions from Supabase:', err?.message || err);
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });


  // Status endpoint
  app.get('/status', (_req, res) => {
    res.json({ status: 'running', subscriptions: getActiveSubscriptions(), timestamp: new Date().toISOString() });
  });

  // app.get('/callapi', async (_req, res) => {

  //   const json = await response.json().catch(() => null);
  //   if (!response.ok) {
  //     console.error('Error calling API:', response.status, json);
  //     return res.status(response.status).json({ error: json });
  //   }

  //   console.log('API response:', json);



  //   return res.json(json || []);

  // })

  // Get all PriceAlerts
  app.get('/api/price-alerts', async (_req, res) => {
    try {
      if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Supabase credentials missing");
      }

      const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/PriceAlerts?select=*`;
      const response = await fetch(sbUrl, {
        method: 'GET',
        headers: {
          'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching PriceAlerts:', response.status, errorText);
        return res.status(response.status).json({ error: errorText });
      }

      const data: any = await response.json();


      const ethprice = await fetch('https://pxl6dnbsdl.execute-api.us-east-1.amazonaws.com/eth-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const ethResponse: any = await ethprice.json();
      console.log("DEBUG: Full ETH Response:", JSON.stringify(ethResponse, null, 2));

      const ethData = ethResponse.data || {};
      console.log("DEBUG: ethData keys:", Object.keys(ethData));
      console.log("DEBUG: timestamp value:", ethData.timestamp);

      const results = [];

      for (const alert of data) {
        try {
          let bodyString = JSON.stringify(alert.Body);
          console.log(`DEBUG: Original Body for Alert ${alert.id}:`, bodyString);

          // Replace placeholders with flexible regex for spaces
          bodyString = bodyString.replace(/re\.event\s*\(\s*0\s*\)/g, String(ethData.eth_usd || ''));
          bodyString = bodyString.replace(/re\.event\s*\(\s*1\s*\)/g, String(ethData.eth_inr || ''));
          bodyString = bodyString.replace(/re\.event\s*\(\s*2\s*\)/g, String(ethData.timestamp || ''));

          console.log(`DEBUG: Processed Body for Alert ${alert.id}:`, bodyString);

          const processedBody = JSON.parse(bodyString);

          console.log(`Processing Alert ID ${alert.id}: Calling ${alert.API}`);

          const alertResp = await fetch(alert.API, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(processedBody)
          });

          const resultJson = await alertResp.json().catch(() => null);
          results.push({
            id: alert.id,
            status: alertResp.status,
            response: resultJson
          });

        } catch (err) {
          console.error(`Error processing alert ${alert.id}:`, err);
          results.push({
            id: alert.id,
            error: String(err)
          });
        }
      }

      return res.json({
        message: "Price alerts processed",
        eth_data: ethData,
        results: results
      });
    } catch (error) {
      console.error('Exception fetching PriceAlerts:', error);
      return res.status(500).json({ error: String(error) });
    }
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

// If this module is executed directly, bootstrap an Express app and start the server
if (process.argv[1] && process.argv[1].endsWith('routes.ts')) {
  (async () => {
    const expressMod = await import('express');
    const corsMod = await import('cors');
    const app = expressMod.default();
    app.use(corsMod.default());
    app.use(expressMod.json());

    // simple request logger
    app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });

    try {
      const server = await registerRoutes(app);
      server.listen(config.PORT, '0.0.0.0', () => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 EVM Event Listener Backend (routes.ts) Started`);
        console.log(`${'='.repeat(60)}`);
        console.log(`📍 Server running on: http://0.0.0.0:${config.PORT}`);
        console.log(`🌐 Environment: ${config.NODE_ENV}`);
        console.log(`${'='.repeat(60)}\n`);

        // start optional scheduler (runs background tasks)
        // scheduler is optional; try dynamic import so runtime can resolve TS/JS
        import('./scheduler.ts').then((mod) => {
          if (mod && typeof mod.startScheduler === 'function') {
            mod.startScheduler();
          }
        }).catch((e) => {
          console.log('No scheduler started (optional):', ((e as any)?.message ?? String(e)));
        });
      });
    } catch (err) {
      console.error('Failed to start server from routes.ts:', ((err as any)?.message ?? String(err)));
      process.exit(1);
    }
  })();
}
