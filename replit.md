# Real-Time EVM Event Listener Platform

## Overview

This is a real-time blockchain event monitoring application that listens to Ethereum Virtual Machine (EVM) smart contract events via WebSocket connections. The platform enables users to configure contract addresses and event signatures to monitor specific blockchain events in real-time.

The application features a dark-themed, data-intensive dashboard built for blockchain developers who need to track and debug smart contract events. It provides live event streaming with detailed transaction data, timestamps, and decoded event arguments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**UI Component Library**: Shadcn UI built on Radix UI primitives with Tailwind CSS for styling. The design system follows a custom dark theme optimized for data visualization and monitoring tasks.

**Routing**: Wouter for lightweight client-side routing. The application is primarily a single-page application focused on the event listener interface.

**State Management**: React Hook Form for form validation and state, with Zod schemas for type-safe validation. TanStack Query handles server state management and data fetching.

**Real-Time Communication**: Socket.IO client for bidirectional WebSocket communication with the backend, enabling real-time event streaming from the blockchain.

**Design Principles**:
- Material Design influence for data-intensive applications
- Monospace fonts for technical data (addresses, hashes, JSON)
- Responsive layout with mobile-first approach
- Focus on readability and technical precision

### Backend Architecture

**Runtime**: Node.js with TypeScript and ES modules.

**Web Framework**: Express.js for HTTP server and API routing.

**Real-Time Layer**: Socket.IO server for WebSocket connections, handling bidirectional communication between clients and blockchain event listeners.

**Blockchain Integration**: Ethers.js v6 for Ethereum blockchain interaction, providing contract event listening capabilities and ABI parsing.

**Development/Production Split**: Separate entry points (`index-dev.ts` and `index-prod.ts`) with Vite middleware integration for development hot module replacement.

**Session Management**: Stateless WebSocket connections with socket ID-based listener tracking. No persistent user sessions required.

**Key Architectural Decisions**:
- **Event-Driven Architecture**: Each connected client gets its own isolated Ethers.js contract listener instance, stored in a Map keyed by socket ID. This ensures clean separation and prevents event cross-contamination between users.
- **Dynamic Contract Binding**: Contracts are instantiated on-demand when clients request to listen to events, using user-provided ABI and event signatures.
- **Graceful Cleanup**: All Ethers.js listeners are removed when clients disconnect, preventing memory leaks from orphaned blockchain listeners.

### Database Layer

**ORM**: Drizzle ORM configured for PostgreSQL (via Neon serverless adapter).

**Schema Location**: `shared/schema.ts` contains Zod schemas for validation and TypeScript types, but no database table schemas are currently defined. The application appears to be stateless with no data persistence.

**Migration Strategy**: Drizzle Kit configured with `db:push` command for schema synchronization.

**Current Usage**: The database configuration exists but is not actively used in the current implementation. Event data is streamed in real-time but not persisted. Future enhancements may include event logging, user preferences, or historical event storage.

### Data Flow

1. **Client Configuration**: User inputs contract address, event signature, and ABI via React Hook Form
2. **WebSocket Connection**: Socket.IO establishes bidirectional connection to backend
3. **Listener Instantiation**: Backend creates Ethers.js contract instance with provided ABI and attaches event listener
4. **Event Streaming**: Blockchain events trigger callbacks that emit data to the connected client via Socket.IO
5. **UI Updates**: React components receive events and update the log display in real-time
6. **Cleanup**: On disconnect, all listeners are removed and resources freed

## External Dependencies

### Blockchain Infrastructure

**RPC Provider**: Configured via `RPC_URL` environment variable. The application requires a JSON-RPC endpoint to an Ethereum-compatible blockchain (mainnet, testnet, or Layer 2).

**Ethers.js**: Primary blockchain interaction library handling contract ABIs, event parsing, and provider connections.

### Database Service

**Neon Postgres**: Serverless PostgreSQL provider configured via `DATABASE_URL` environment variable. Currently provisioned but not actively used in the application logic.

### UI Component Libraries

**Radix UI**: Headless UI primitives for accessible component behavior (dialogs, popovers, dropdowns, etc.)

**Shadcn UI**: Pre-built component implementations using Radix UI primitives with Tailwind styling

**Lucide React**: Icon library for UI elements

### Development Tools

**Vite**: Build tool and development server with HMR support

**Replit Plugins**: Custom Vite plugins for error overlays, cartographer, and dev banners when running in Replit environment

### Real-Time Communication

**Socket.IO**: WebSocket library for both client and server, enabling low-latency bidirectional event streaming

### Build and Deployment

**esbuild**: Bundles the production server build

**TypeScript**: Type safety across the entire application stack

**Environment Variables Required**:
- `RPC_URL`: Ethereum JSON-RPC endpoint (mandatory)
- `DATABASE_URL`: PostgreSQL connection string (configured but optional for current features)
- `NODE_ENV`: Environment mode (development/production)