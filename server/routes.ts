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
      console.log(`[Socket ${socket.id}] startListening received`);
      console.log(`[Socket ${socket.id}] Address:`, address);
      console.log(`[Socket ${socket.id}] Event Fragment:`, eventFragment);
      console.log(`[Socket ${socket.id}] ABI length:`, abi?.length);
      
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

        console.log(`[Socket ${socket.id}] Validations passed`);

        // Parse ABI and initialize contract
        console.log(`[Socket ${socket.id}] Parsing ABI...`);
        const parsedAbi = JSON.parse(abi);
        console.log(`[Socket ${socket.id}] ABI parsed successfully, creating contract...`);
        const contract = new ethers.Contract(address, parsedAbi, provider);
        console.log(`[Socket ${socket.id}] Contract created successfully`);

        // Define the event handler function
        const eventHandler = async (...args: any[]) => {
          console.log(`[Socket ${socket.id}] *** EVENT HANDLER TRIGGERED ***`);
          console.log(`[Socket ${socket.id}] Total arguments received:`, args.length);
          console.log(`[Socket ${socket.id}] Argument types:`, args.map((a: any) => typeof a));
          
          try {
            // Ethers.js passes decoded arguments first, then the EventLog as the last argument
            // We need to find the EventLog object (it has blockNumber, transactionHash, etc.)
            let eventLogObj: any = null;
            let decodedArguments: any[] = [];

            console.log(`[Socket ${socket.id}] Searching for EventLog object...`);
            
            // Look for the EventLog object
            for (let i = args.length - 1; i >= 0; i--) {
              const arg = args[i];
              console.log(`[Socket ${socket.id}] Checking arg[${i}]:`, {
                hasBlockNumber: arg && 'blockNumber' in arg,
                hasTransactionHash: arg && 'transactionHash' in arg,
                keys: arg && typeof arg === 'object' ? Object.keys(arg).slice(0, 5) : 'not an object'
              });
              
              if (arg && typeof arg === 'object' && 'blockNumber' in arg && 'transactionHash' in arg) {
                console.log(`[Socket ${socket.id}] Found EventLog object at index ${i}`);
                eventLogObj = arg;
                decodedArguments = args.slice(0, i);
                console.log(`[Socket ${socket.id}] Decoded arguments count:`, decodedArguments.length);
                break;
              }
            }

            if (!eventLogObj) {
              console.error(`[Socket ${socket.id}] ❌ Could not find EventLog object in arguments`);
              console.error(`[Socket ${socket.id}] Raw args:`, JSON.stringify(args, null, 2).substring(0, 500));
              return;
            }

            console.log(`[Socket ${socket.id}] ✓ EventLog found:`, {
              blockNumber: eventLogObj.blockNumber,
              transactionHash: eventLogObj.transactionHash,
              address: eventLogObj.address
            });

            // Get the event fragment from the ABI
            const eventName = eventFragment.split('(')[0];
            console.log(`[Socket ${socket.id}] Looking for event fragment: "${eventName}"`);
            const fragment = contract.interface.getEvent(eventName);
            
            if (!fragment) {
              console.error(`[Socket ${socket.id}] ❌ Event fragment not found for: ${eventName}`);
              console.error(`[Socket ${socket.id}] Available events:`, contract.interface.fragments.filter(f => f.type === 'event').map((f: any) => f.name));
              return;
            }

            console.log(`[Socket ${socket.id}] ✓ Fragment found:`, {
              name: fragment.name,
              inputCount: fragment.inputs.length
            });

            // Format the decoded arguments for display
            const logArgs: Record<string, any> = {};
            console.log(`[Socket ${socket.id}] Processing ${decodedArguments.length} decoded arguments...`);
            
            fragment.inputs.forEach((input, index) => {
              let value = decodedArguments[index];
              console.log(`[Socket ${socket.id}] Arg[${index}] (${input.name}):`, typeof value, value);

              // Convert BigInt to string for JSON serialization
              if (typeof value === 'bigint') {
                console.log(`[Socket ${socket.id}] Converting BigInt to string`);
                value = value.toString();
              } else if (value && typeof value === 'object' && value._isBigNumber) {
                console.log(`[Socket ${socket.id}] Converting BigNumber to string`);
                value = value.toString();
              } else if (value !== undefined && value !== null) {
                value = String(value);
              }

              logArgs[input.name] = value;
            });

            console.log(`[Socket ${socket.id}] ✓ All arguments processed`);

            // Send the rich log data back to the client
            const eventLog: EventLog = {
              name: fragment.name,
              blockNumber: Number(eventLogObj.blockNumber || 0),
              transactionHash: String(eventLogObj.transactionHash || 'unknown'),
              args: logArgs,
              timestamp: new Date().toLocaleTimeString()
            };

            console.log(`[Socket ${socket.id}] 🎉 Sending event to client:`, eventLog);
            socket.emit('newLog', eventLog);
            console.log(`[Socket ${socket.id}] ✓ Event emitted successfully`);
          } catch (error) {
            console.error(`[Socket ${socket.id}] ❌ Error in event handler:`, error);
            console.error(`[Socket ${socket.id}] Stack:`, error instanceof Error ? error.stack : 'no stack');
          }
        };

        // Start listening on the contract
        console.log(`[Socket ${socket.id}] Attaching listener to contract.on("${eventFragment}", handler)...`);
        contract.on(eventFragment, eventHandler);
        console.log(`[Socket ${socket.id}] ✓ Listener attached successfully`);

        // Store the active listener
        activeListeners.set(socket.id, { contract, eventFragment });
        console.log(`[Socket ${socket.id}] ✓ Listener stored in activeListeners map`);

        const currentBlock = await provider.getBlockNumber();
        console.log(`[Socket ${socket.id}] Current block number:`, currentBlock);
        
        const successMsg = `Listening for ${eventFragment} at ${address} on block ${currentBlock}.`;
        console.log(`[Socket ${socket.id}] ✓ Sending success status: ${successMsg}`);
        socket.emit('status', {
          type: 'success',
          message: successMsg
        });
        console.log(`[Socket ${socket.id}] ✓✓✓ Listening started: ${eventFragment} on ${address}`);

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
