# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to define the software requirements for **KwalaFilter**, a Real-Time EVM Event Listener and Workflow Automation Platform. It outlines the system's intended behavior, functional and non-functional requirements, and architectural components.

### 1.2 Scope
KwalaFilter is a web-based application designed to monitor smart contract events on any Ethereum Virtual Machine (EVM) compatible blockchain (Ethereum, Polygon, Arbitrum, Base, etc.) in real-time. It provides developers and users with the ability to define subscriptions to specific on-chain events and trigger automated workflows (such as webhook calls or Discord/Telegram notifications) when those events occur.

### 1.3 Definitions, Acronyms, and Abbreviations
- **EVM**: Ethereum Virtual Machine
- **RPC**: Remote Procedure Call
- **SSE**: Server-Sent Events
- **ABI**: Application Binary Interface
- **Smart Contract**: Self-executing code deployed on a blockchain
- **Workflow**: A predefined sequence of automated actions triggered by specific criteria

---

## 2. Overall Description

### 2.1 Product Perspective
KwalaFilter operates as an independent web application featuring a React-based frontend and a Node.js/Express backend. It acts as an intermediary layer between blockchain RPC providers (like Alchemy or Infura) and external notification/API systems (like Discord, Telegram, or custom APIs). Data persistence is managed via Supabase (PostgreSQL).

### 2.2 User Classes and Characteristics
- **DeFi Users/Traders**: Need to monitor specific on-chain activities (e.g., large swaps, liquidations) and receive instant notifications.
- **Blockchain Developers**: Require reliable event ingestion to trigger internal off-chain logic and microservices.
- **DAO Members/Governance Observers**: Need to track governance proposals and votes.
- **Security Teams**: Monitor for anomalous transactions or large token transfers for real-time alerting.

### 2.3 Operating Environment
- **Backend Environment**: Node.js (v18+)
- **Frontend Environment**: Modern Web Browsers (Chrome, Firefox, Safari)
- **Database**: PostgreSQL (Supabase)
- **Blockchain Connectivity**: EVM-compatible RPC nodes via WebSocket/HTTPS

---

## 3. System Features

### 3.1 Real-Time Event Monitoring
- **Description**: The system must listen for specific smart contract events continuously using WebSockets and SSE to ensure sub-second latency.
- **Requirements**:
  - The system must accept a contract address, ABI, and event signature.
  - The system must process events immediately as they are confirmed on the blockchain.

### 3.2 Historical Log Catch-Up
- **Description**: The system must handle periods of downtime without losing critical data.
- **Requirements**:
  - The system must track the latest processed block number for each subscription.
  - Upon restart or reconnection, the system must query for any missed blocks between the last processed block and the current block.

### 3.3 Workflow Automation
- **Description**: The system must be capable of executing automated actions based on intercepted on-chain data.
- **Requirements**:
  - Users must be able to define webhooks or external API endpoints.
  - The system must decode the on-chain event data based on the ABI.
  - The system must inject decoded data points into the API payload dynamically using a defined syntax (e.g., `${re.event(0)}`).

### 3.4 Billing and Monetization
- **Description**: The system natively charges users for executing automated workflows.
- **Requirements**:
  - The system must charge the Workflow Owner a defined fee (e.g., 0.01 KWALA) per successful webhook execution.
  - Transactions must be recorded securely.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- A web-based dashboard allowing users to:
  - Input contract addresses, topic hashes, and ABIs.
  - View real-time logs and streamed events in a dark-themed UI.
  - Configure workflow actions and destination URLs.
  - View a history of executed workflows and analytics.

### 4.2 Software Interfaces
- **Blockchain RPCs**: Interaction via Ethers.js to standard EVM RPC endpoints.
- **Etherscan API**: For automatic ABI and contract metadata retrieval.
- **Supabase**: Communication via REST API and PostgreSQL connections for persisting subscriptions and workflow execution logs.
- **External Webhooks**: RESTful POST requests to user-defined APIs (e.g., Discord/Telegram).

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- **Latency**: The system should parse and trigger workflows within 1 second of block confirmation.
- **Scalability**: The backend scheduler must handle multiple concurrent subscriptions without overlapping event processing (requires execution locking mechanisms).

### 5.2 Reliability and Availability
- The system should guarantee "at-least-once" delivery of events by persisting the last parsed block number.
- In case of API failure (e.g., external webhook returns 404), the system should log the failure and optionally retry based on configuration parameters.

### 5.3 Security Requirements
- API keys, RPC URLs, and service role keys must be securely stored in environment variables (`.env`) and never exposed to the client side.
- Webhook endpoints must validate incoming payload shapes.

### 5.4 Maintainability
- The codebase is structured using TypeScript to enforce strict typing across shared schemas and APIs.
- Core dependencies include standard libraries (Ethers.js v6, React, Express) to ensure long-term community support.
