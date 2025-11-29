# Backend Setup Guide

This guide focuses on configuring and running the KwalaFilter backend. For API documentation, see [docs/API.md](docs/API.md).

## 1. Environment Configuration

The backend relies on several environment variables to function. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RPC_URL` | HTTP provider for blockchain data | `https://eth-mainnet.g.alchemy.com/v2/...` |
| `RPC_WS_URL` | WebSocket provider for real-time events | `wss://eth-mainnet.g.alchemy.com/v2/...` |
| `ETHERSCAN_API_KEY` | For fetching contract creation blocks | `ABC123...` |
| `SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (Server-side only) | `eyJ...` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Port for the Express server |
| `NODE_ENV` | `development` | Environment mode |

## 2. Installation & Running

Ensure you have Node.js v18+ installed.

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Run in production mode
npm start
```

## 3. Troubleshooting

### "Invalid topic0 format"
- Ensure `topic0` is a 64-character hex string starting with `0x`.
- It must be the `keccak256` hash of the event signature (e.g., `Transfer(address,address,uint256)`).

### "Could not fetch block number"
- Check your `ETHERSCAN_API_KEY`.
- Verify the contract address is correct and verified on Etherscan.

### "Connection Refused" (Supabase)
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct.
- Ensure your IP is allowed in Supabase database settings if restrictions are enabled.
