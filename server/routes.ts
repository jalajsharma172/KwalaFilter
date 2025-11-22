import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { ethers } from "ethers";
import type { ServerToClientEvents, ClientToServerEvents, EventLog } from "@shared/schema";

// Global map to hold active contract listeners, keyed by socket ID
const activeListeners = new Map<string, {
  contract: ethers.Contract;
  eventFragment: string;
}>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get RPC URL from environment variables
  const RPC_URL = process.env.RPC_URL;
  if (!RPC_URL) {
    console.error("FATAL: RPC_URL not found in environment variables. Please configure your RPC endpoint.");
    process.exit(1);
  }

  // Initialize Ethers.js provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log(`Ethers.js provider initialized with RPC: ${RPC_URL.substring(0, 30)}...`);

  // Set up Socket.IO with WebSocket path
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: '/ws',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
  });

  /**
   * Removes all Ethers.js listeners associated with a socket.
   */
  function removeSocketListeners(socketId: string) {
    const listener = activeListeners.get(socketId);
    if (listener && listener.contract) {
      listener.contract.removeAllListeners();
      console.log(`[Socket ${socketId}] Stopped listening for events.`);
    }
    activeListeners.delete(socketId);
  }

  io.on('connection', (socket) => {
    console.log(`[Socket ${socket.id}] Client connected.`);

    // START LISTENING
    socket.on('startListening', async ({ address, eventFragment, abi }) => {
      // Stop any previous listener for this socket first
      removeSocketListeners(socket.id);

      try {
        // Validation
        if (!ethers.isAddress(address)) {
          throw new Error("Invalid Ethereum address.");
        }
        if (!eventFragment) {
          throw new Error("Event signature cannot be empty.");
        }

        // Parse ABI and initialize contract
        const parsedAbi = JSON.parse(abi);
        const contract = new ethers.Contract(address, parsedAbi, provider);

        // Define the event handler function
        const eventHandler = async (...args: any[]) => {
          try {
            // The last argument is the EventLog object from Ethers.js
            const eventLogObj = args[args.length - 1] as ethers.EventLog;

            if (!eventLogObj || !eventLogObj.topics || !eventLogObj.data) {
              console.error(`[Socket ${socket.id}] Invalid log object structure`);
              return;
            }

            // Get the event fragment from the ABI
            const fragment = contract.interface.getEvent(eventFragment.split('(')[0]);
            if (!fragment) {
              console.error(`[Socket ${socket.id}] Event fragment not found for: ${eventFragment}`);
              return;
            }

            // Decode the event using the fragment
            const decodedArgs = contract.interface.decodeEventLog(
              fragment,
              eventLogObj.data,
              eventLogObj.topics
            );

            // Format arguments for display
            const logArgs: Record<string, any> = {};
            fragment.inputs.forEach((input, index) => {
              let value = decodedArgs[input.name] || decodedArgs[index];

              // Convert BigInt to string for JSON serialization
              if (typeof value === 'bigint') {
                value = value.toString();
              } else if (value && typeof value === 'object' && value._isBigNumber) {
                value = value.toString();
              } else {
                value = value?.toString?.() ?? String(value);
              }

              logArgs[input.name] = value;
            });

            // Send the rich log data back to the client
            const eventLog: EventLog = {
              name: fragment.name,
              blockNumber: Number(eventLogObj.blockNumber),
              transactionHash: eventLogObj.transactionHash || 'unknown',
              args: logArgs,
              timestamp: new Date().toLocaleTimeString()
            };

            socket.emit('newLog', eventLog);
            console.log(`[Socket ${socket.id}] Event received:`, fragment.name);
          } catch (error) {
            console.error(`[Socket ${socket.id}] Error processing event:`, error);
          }
        };

        // Start listening on the contract
        contract.on(eventFragment, eventHandler);

        // Store the active listener
        activeListeners.set(socket.id, { contract, eventFragment });

        const currentBlock = await provider.getBlockNumber();
        socket.emit('status', {
          type: 'success',
          message: `Listening for ${eventFragment} at ${address} on block ${currentBlock}.`
        });
        console.log(`[Socket ${socket.id}] Listening started: ${eventFragment} on ${address}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        socket.emit('status', {
          type: 'error',
          message: `Setup failed: ${errorMessage}. Check inputs and RPC health.`
        });
        console.error(`[Socket ${socket.id}] Listener setup failed:`, errorMessage);
      }
    });

    // STOP LISTENING
    socket.on('stopListening', () => {
      removeSocketListeners(socket.id);
      socket.emit('status', { type: 'info', message: 'Listener stopped by user command.' });
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      console.log(`[Socket ${socket.id}] Client disconnected.`);
      removeSocketListeners(socket.id);
    });
  });

  console.log('Socket.IO server initialized on path /ws');

  return httpServer;
}
