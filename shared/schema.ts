import { z } from "zod";

// Event log data structure
export const eventLogSchema = z.object({
  name: z.string(),
  blockNumber: z.number(),
  transactionHash: z.string(),
  args: z.record(z.string(), z.any()),
  timestamp: z.string(),
});

export type EventLog = z.infer<typeof eventLogSchema>;

// Contract listener configuration
export const listenerConfigSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  eventFragment: z.string().min(1, "Event signature is required"),
  abi: z.string().min(1, "ABI is required"),
});

export type ListenerConfig = z.infer<typeof listenerConfigSchema>;

// Socket.IO event types
export interface ServerToClientEvents {
  newLog: (log: EventLog) => void;
  status: (data: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export interface ClientToServerEvents {
  startListening: (config: ListenerConfig) => void;
  stopListening: () => void;
}
