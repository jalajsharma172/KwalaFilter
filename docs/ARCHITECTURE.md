# Project Architecture

This document provides a high-level overview of the project's architecture, including its tech stack, data flow, and key components.

## 1. High-Level Overview

The project is a **Monorepo** containing both the Frontend and Backend in a single codebase. It is designed to act as a **Blockchain Event Listener and Workflow Automation** platform.

- **Frontend**: A React Single Page Application (SPA).
- **Backend**: A Node.js/Express server that acts as the API and orchestration layer.
- **Database**: **Supabase** (PostgreSQL) is used for persistent storage, accessed via REST API.
- **Blockchain**: Integrates with Ethereum/EVM chains (specifically Sepolia in the current config) using `ethers.js`.

## 2. Tech Stack

### Frontend (`client/`)
- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: React Query (`@tanstack/react-query`)
- **Routing**: Wouter

### Backend (`server/`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Real-time**: Server-Sent Events (SSE) for log streaming.
- **Blockchain**: `ethers.js` for RPC interaction and wallet management.
- **Scheduling**: Native `setInterval` based scheduler for background tasks.

### Database (`Supabase`)
- **Access**: The backend uses the Supabase REST API (via `node-fetch`) to read/write data.
- **Tables**: `Workflow`, `PriceAlerts`, `subscription_latest_blocks`, `Functions`.

## 3. Architecture & Data Flow

### A. Client-Server Communication
1. The **Frontend** runs on the browser and makes HTTP requests to the **Express Backend** (`/api/...`).
2. The **Backend** validates requests and forwards data to **Supabase** via its REST API.
   - *Note*: The frontend does NOT connect to Supabase directly. All traffic is proxied through the backend for security and logic centralization.

### B. Blockchain Event Listening
There are two mechanisms for listening to blockchain events:

1. **Real-time Stream (SSE)**:
   - Endpoint: `/listen`
   - The frontend opens an EventSource connection.
   - The backend runs a `logListener` that polls/listens for new logs and pushes them to the client immediately.
   - Used for the "Live" Event Listener UI.

2. **Background Scheduler (`server/scheduler.ts`)**:
   - Runs every 30 seconds (configurable).
   - Iterates through active subscriptions in the database.
   - Fetches the `latest_block_number` stored in Supabase.
   - Queries the RPC provider for logs *newer* than the stored block.
   - Decodes logs and triggers **Workflows** (actions) if conditions are met.
   - Updates `latest_block_number` in Supabase to ensure continuity.

### C. Workflow Automation
When the Scheduler detects a targeted event:
1. It looks up the associated **Workflow**.
2. It processes configured actions (e.g., `Price Alert` or generic `API Call`).
3. It can trigger external webhooks initiated by the user configuration.

### D. Billing System (`server/billing.ts`)
The system includes a crypto-native billing module:
- **Currency**: KWALA Token (ERC-20).
- **Mechanism**:
  - Users must `approve` the Server Wallet to spend their tokens.
  - When a workflow action is successfully executed, the server calls `transferFrom(user, treasury, amount)` to charge a fee (default 0.01 KWALA).
- **Minting**: There is also a faucet mechanism (`/api/mint`) that signs authorized messages for a distributor contract, allowing users to claim test tokens.

## 4. Key Directories & Files

- **`server/routes.ts`**: The main API definition. Handles all HTTP requests.
- **`server/scheduler.ts`**: The heartbeat of the automation. Runs background checks.
- **`server/listeners/`**: Contains logic for fetching logs and handling SSE.
- **`server/billing.ts`**: Manages token transfers and wallet interactions.
- **`shared/schema.ts`**: Shared TypeScript types and Zod schemas (ensures type safety across front/back).
- **`client/src/pages/`**: Frontend views (Dashboard, Workflows, etc.).
