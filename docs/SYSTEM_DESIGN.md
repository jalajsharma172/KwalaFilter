# System Design & Architecture Specification

This document provides a rigorous breakdown of the system architecture, intended to aid in creating high-fidelity visual representations (C4 models, UML diagrams, or system maps).

## 1. System Context (High Level)

**Goal**: A central platform that listens to blockchain events and triggers off-chain automation.

| Entity | Type | Description |
| :--- | :--- | :--- |
| **User** | Person | Configures workflows, connects wallet, pays fees. |
| **KwalaFilter System** | System | The core platform (Monorepo). |
| **Blockchain (EVM)** | External | Source of truth for events (Ethereum, Polygon, Sepolia, etc.). |
| **Supabase** | External DB | Persistent storage for users, workflows, and process state. |
| **External Webhooks** | External | Third-party services (Discord, Slack, Custom APIs) that receive triggers. |

---

## 2. Container Architecture (Tech Stack Layers)

### A. Client (Frontend)
- **Technology**: React, Vite, TypeScript, Tailwind, Radix UI.
- **Responsibility**: User Interface, Wallet Connection, State Display.
- **Key Interactions**:
  - Connects to **Wallet** (Browser Extension) for signing.
  - Connects to **Server API** (HTTP/SSE) for data and live streams.

### B. Server (Backend)
- **Technology**: Node.js, Express, Ethers.js.
- **Responsibility**: Logic Orchestration, Blockchain Polling, Billing.
- **Key Components**:
  - `API Layer`: Express Routes (`routes.ts`).
  - `Stream Engine`: SSE for live frontend updates.
  - `Scheduler`: Background cron for persistent monitoring.
  - `Billing`: Logic for charging tokens.

### C. Data Store (Supabase)
- **Technology**: PostgreSQL.
- **Tables**:
  - `Workflow`: Stores user-defined automation rules.
  - `subscription_latest_blocks`: Tracks the last processed block for every contract.
  - `PriceAlerts`: Specific configuration for price monitoring.

---

## 3. Component Deep Dive

### Core Server Modules

#### 1. `Scheduler` (`server/scheduler.ts`)
The "Heartbeat" of the system.
- **Trigger**: Runs every ~30 seconds (`setInterval`).
- **Input**: Reads active subscriptions from `Supabase`.
- **Logic**:
  - Gets `last_processed_block` from DB.
  - Calls `RPC` to get `current_block`.
  - Loops identifying new blocks.
  - Fetches Logs for the block range.
  - Decodes Logs using stored ABI.
  - Matches conditions (e.g., "Value > 100").
  - Executes Actions (API Call / Webhook).
- **Billing Hook**: If workflow succeeds, calls `Billing Module`.
- **State Update**: Writes new `last_processed_block` to DB.

#### 2. `Log Listener` (`server/listeners/logListener.js`)
The "Real-Time" engine.
- **Trigger**: Client connection to `/listen`.
- **Mechanism**: Long-polling or WebSocket subscription to RPC.
- **Output**: Pushes JSON data via Server-Sent Events (SSE) to the frontend.
- **Note**: Transient state (does not save to DB, only for UI display).

#### 3. `Billing Module` (`server/billing.ts`)
The "Revenue" engine.
- **Logic**:
  - Checks User's Token Allowance.
  - Checks User's Token Balance.
  - Executes `transferFrom(user, treasury, fee)` on the Blockchain.
- **Dependency**: Requires a server-side private key.

---

## 4. Key Data Flows (Sequence Definitions)

### Scenario A: User Creates a Workflow
1. **User** fills form on Dashboard.
2. **Frontend** POSTs to `/api/subscriptions`.
3. **API** validates Address, Topic, and ABI.
4. **API** saves record to **Supabase** (`subscription_latest_blocks`).
5. **API** fetches current block number from **RPC** and initializes tracking.

### Scenario B: Background Event Detection
1. **Scheduler** wakes up.
2. **Scheduler** queries **Supabase** -> "Get me all active contracts".
3. **Scheduler** queries **RPC** -> "Get logs for Contract X from Block N to Latest".
4. **RPC** returns raw logs.
5. **Scheduler** decodes logs.
6. **Scheduler** evaluates Logic (e.g., `${re.event(0)} > 1000`).
7. **Scheduler** POSTs to **External Webhook**.
8. **Scheduler** updates **Supabase** -> "Set last block to Latest".

### Scenario C: Billing Execution
*(Happens inside Scenario B if configured)*
1. **Scheduler** determines action was successful.
2. **Scheduler** calls `chargeUser(ownerAddress)`.
3. **Billing Module** broadcasts Method Call to **Blockchain**.
4. **Billing Module** waits for Confirmation.
5. **Scheduler** logs "Success" to System Logs.

---

## 5. Visual Mapping Hints

For generating a diagram, use these relationships:

- **Central Hub**: `Scheduler` (connects to everything).
- **Data Source**: `RPC Provider` (feeds both Scheduler and Listener).
- **Data Sink**: `Supabase` (stores state).
- **Action Output**: `External Webhooks`.
- **Financial Flow**: `Billing` -> `Token Contract`.

This structure decouples the reading of events (Scheduler) from the viewing of events (UI Listener), which is a key architectural decision in this project.
