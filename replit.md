# Real-Time EVM Event Listener Platform

## Overview

This is a real-time blockchain event monitoring application that listens to Ethereum Virtual Machine (EVM) smart contract events via WebSocket connections. The platform enables users to configure contract addresses and event signatures to monitor specific blockchain events in real-time.

The application features a dark-themed, data-intensive dashboard built for blockchain developers who need to track and debug smart contract events. It provides live event streaming with detailed transaction data, timestamps, and decoded event arguments.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates (November 2025)

### Core MVP Implementation Complete
- ✅ Full-stack real-time event listener with Socket.IO and Ethers.js
- ✅ Beautiful dark-themed UI with Shadcn components
- ✅ WebSocket-based real-time event streaming
- ✅ In-memory listener management with proper cleanup
- ✅ Form validation and error handling
- ✅ Responsive design following design guidelines

### Technical Improvements
- Fixed BigInt serialization for blockchain data (block numbers converted to Number)
- Configured Socket.IO on custom `/ws` path for WebSocket communication
- Implemented proper listener lifecycle management (start/stop/cleanup on disconnect)
- Added comprehensive form validation with Zod schemas

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**UI Component Library**: Shadcn UI built on Radix UI primitives with Tailwind CSS for styling. The design system follows a custom dark theme optimized for data visualization and monitoring tasks.

**Routing**: Wouter for lightweight client-side routing. The application is a single-page application focused on the event listener interface.

**State Management**: 
- React Hook Form for form validation and state with Zod schemas for type-safe validation
- useState for component-level state management
- Socket.IO client for real-time WebSocket communication

**Real-Time Communication**: Socket.IO client configured on path `/ws` for bidirectional WebSocket communication with the backend, enabling real-time event streaming from the blockchain.

**Design Principles**:
- Dark theme by default (class="dark" on HTML element)
- Monospace fonts for technical data (addresses, hashes, JSON)
- Responsive layout with mobile-first approach
- Focus on readability and technical precision
- Beautiful status indicators and real-time feedback

**Key Components**:
- `event-listener.tsx`: Main page component with form inputs, WebSocket connection management, and real-time log display
- Form validation using react-hook-form with zodResolver
- Real-time status updates with color-coded badges
- Scrollable event log panel with formatted transaction details

### Backend Architecture

**Runtime**: Node.js with TypeScript and ES modules.

**Web Framework**: Express.js for HTTP server and API routing.

**Real-Time Layer**: Socket.IO server configured on path `/ws` for WebSocket connections, handling bidirectional communication between clients and blockchain event listeners.

**Blockchain Integration**: Ethers.js v6 for Ethereum blockchain interaction, providing contract event listening capabilities and ABI parsing. Uses JsonRpcProvider to connect to configured RPC endpoint.

**Development/Production Split**: Separate entry points (`index-dev.ts` and `index-prod.ts`) with Vite middleware integration for development hot module replacement.

**Session Management**: Stateless WebSocket connections with socket ID-based listener tracking. No persistent user sessions required.

**Key Architectural Decisions**:
- **Event-Driven Architecture**: Each connected client gets its own isolated Ethers.js contract listener instance, stored in a Map keyed by socket ID. This ensures clean separation and prevents event cross-contamination between users.
- **Dynamic Contract Binding**: Contracts are instantiated on-demand when clients request to listen to events, using user-provided ABI and event signatures.
- **Graceful Cleanup**: All Ethers.js listeners are removed when clients disconnect, preventing memory leaks from orphaned blockchain listeners.
- **BigInt Handling**: Block numbers are converted from BigInt to Number for JSON serialization over WebSocket (safe for current blockchain heights, may need string conversion for future-proofing).

### Data Layer

**Schema Location**: `shared/schema.ts` contains Zod schemas for validation and TypeScript types for event logs and listener configuration.

**In-Memory Storage**: Active listeners stored in a Map<string, {contract, eventFragment}> keyed by Socket.IO socket ID. No database persistence required for this application.

**Data Models**:
- `EventLog`: Contains event name, block number, transaction hash, decoded arguments, and timestamp
- `ListenerConfig`: Contract address, event fragment (signature), and ABI JSON
- `ServerToClientEvents` / `ClientToServerEvents`: TypeScript interfaces for Socket.IO event typing

### Data Flow

1. **Client Configuration**: User inputs contract address, event signature, and ABI via React Hook Form with Zod validation
2. **WebSocket Connection**: Socket.IO establishes bidirectional connection to backend on path `/ws`
3. **Listener Instantiation**: Backend validates address, parses ABI, creates Ethers.js contract instance, and attaches event listener
4. **Event Streaming**: Blockchain events trigger callbacks that parse event data, normalize BigInt values, and emit to connected client via Socket.IO
5. **UI Updates**: React components receive events and update the log display in real-time with formatted transaction details
6. **Cleanup**: On disconnect or stop command, all listeners are removed and resources freed

## External Dependencies

### Blockchain Infrastructure

**RPC Provider**: Configured via `RPC_URL` environment variable (shared environment). The application requires a JSON-RPC endpoint to an Ethereum-compatible blockchain (mainnet, testnet, or Layer 2).

**Ethers.js**: Primary blockchain interaction library (v6) handling contract ABIs, event parsing, BigInt normalization, and provider connections.

### Real-Time Communication

**Socket.IO**: WebSocket library (v4.x) for both client and server, enabling low-latency bidirectional event streaming on custom `/ws` path.

### UI Component Libraries

**Radix UI**: Headless UI primitives for accessible component behavior (dialogs, popovers, scroll areas, etc.)

**Shadcn UI**: Pre-built component implementations using Radix UI primitives with Tailwind styling

**Lucide React**: Icon library for UI elements (Zap, Activity, Clock, Database, ExternalLink, etc.)

### Development Tools

**Vite**: Build tool and development server with HMR support

**Replit Plugins**: Custom Vite plugins for error overlays, cartographer, and dev banners when running in Replit environment

### Build and Deployment

**esbuild**: Bundles the production server build

**TypeScript**: Type safety across the entire application stack

**Environment Variables Required**:
- `RPC_URL`: Ethereum JSON-RPC endpoint (mandatory, shared environment)
- `NODE_ENV`: Environment mode (development/production)

## Current Implementation Status

✅ **Complete MVP Features**:
- Real-time WebSocket event streaming
- Beautiful dark-themed UI with responsive design
- Form validation and error handling
- Contract address validation (checksummed Ethereum addresses)
- ABI parsing and event signature matching
- In-memory listener management with cleanup
- Status indicators and real-time feedback
- Transaction detail display with Etherscan links
- Proper BigInt serialization for blockchain data

## Known Limitations & Future Enhancements

**Current Limitations**:
- Block numbers converted to Number (may lose precision beyond Number.MAX_SAFE_INTEGER in distant future)
- Single event signature per listener session (no multi-event monitoring)
- No historical event fetching (only real-time events)
- No data persistence (events not saved)
- No event filtering or search

**Recommended Future Enhancements**:
1. Convert block numbers to string transport for future-proof precision
2. Add historical event filtering for specific block ranges
3. Implement event data export (CSV/JSON download)
4. Support multiple simultaneous contract listeners per session
5. Add indexed parameter filtering and search
6. Implement WebSocket reconnection logic and health monitoring
7. Add automated integration tests with mocked provider

## Testing & Validation

**Tested Scenarios**:
- ✅ WebSocket connection establishment
- ✅ Form validation (invalid addresses, empty fields)
- ✅ Listener start/stop lifecycle
- ✅ Error handling and user feedback
- ✅ UI responsiveness and crash resistance
- ✅ Dark theme rendering
- ✅ Real-time status updates

**Test Results**: All core functionality verified. Application successfully establishes WebSocket connection, validates inputs, manages listener lifecycle, and handles errors gracefully.

## Design & UX

Following design_guidelines.md for professional dark-themed dashboard:
- Custom indigo/primary color scheme for CTAs and highlights
- Dark gray backgrounds (gray-900/800/700) for depth
- Monospace fonts for addresses, hashes, and JSON data
- Responsive grid layout with mobile-first approach
- Status indicators with color-coded badges (online/away/busy)
- Smooth transitions and hover effects
- Clear visual hierarchy with proper spacing
- Clickable transaction links to Etherscan
