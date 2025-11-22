import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listenerConfigSchema, type ListenerConfig, type EventLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, StopCircle, PlayCircle, ExternalLink, Zap, Database, Clock } from "lucide-react";
import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@shared/schema";

type StatusType = 'idle' | 'connecting' | 'listening' | 'error';

export default function EventListener() {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [status, setStatus] = useState<StatusType>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to start listening');
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const form = useForm<ListenerConfig>({
    resolver: zodResolver(listenerConfigSchema),
    defaultValues: {
      address: "0x89e0018a994D581c7e937d4022416f403980a3D6",
      eventFragment: "Transfer(address,address,uint256)",
      abi: '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Transfer","type":"event"}]',
    },
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(wsUrl, {
      transports: ['websocket', 'polling'],
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('idle');
      setStatusMessage('Connected to server. Ready to start listening.');
    });

    socket.on('disconnect', () => {
      setStatus('error');
      setStatusMessage('Disconnected from server');
    });

    socket.on('status', ({ type, message }) => {
      setStatusMessage(message);
      if (type === 'success') {
        setStatus('listening');
      } else if (type === 'error') {
        setStatus('error');
      } else {
        setStatus('idle');
      }
    });

    socket.on('newLog', (log) => {
      setLogs((prev) => [log, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStartListening = (data: ListenerConfig) => {
    if (!socketRef.current) return;
    
    setStatus('connecting');
    setStatusMessage('Initializing listener...');
    setLogs([]);
    
    socketRef.current.emit('startListening', data);
  };

  const handleStopListening = () => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('stopListening');
    setStatus('idle');
    setStatusMessage('Listener stopped');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return 'bg-status-online';
      case 'connecting':
        return 'bg-status-away';
      case 'error':
        return 'bg-status-busy';
      default:
        return 'bg-muted';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'listening':
        return <Badge className="bg-status-online/20 text-status-online border-status-online/30">Listening</Badge>;
      case 'connecting':
        return <Badge className="bg-status-away/20 text-status-away border-status-away/30">Connecting</Badge>;
      case 'error':
        return <Badge className="bg-status-busy/20 text-status-busy border-status-busy/30">Error</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-extrabold text-foreground" data-testid="text-page-title">
              EVM Event Listener
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-page-description">
            Real-time blockchain event monitoring with WebSocket streaming
          </p>
        </div>

        {/* Status Bar */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getStatusColor()} animate-pulse`} data-testid="indicator-connection-status" />
                <span className="text-sm font-medium" data-testid="text-status-message">{statusMessage}</span>
              </div>
              {getStatusBadge()}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Configuration
              </CardTitle>
              <CardDescription>
                Enter contract details to start monitoring events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={form.handleSubmit(handleStartListening)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Contract Address</Label>
                  <Input
                    id="address"
                    data-testid="input-contract-address"
                    placeholder="0x..."
                    {...form.register("address")}
                    className="font-mono"
                  />
                  {form.formState.errors.address && (
                    <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Ethereum contract address (42 characters)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventFragment">Event Signature</Label>
                  <Input
                    id="eventFragment"
                    data-testid="input-event-signature"
                    placeholder="Transfer(address,address,uint256)"
                    {...form.register("eventFragment")}
                    className="font-mono"
                  />
                  {form.formState.errors.eventFragment && (
                    <p className="text-sm text-destructive">{form.formState.errors.eventFragment.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Event name with parameter types
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abi">Contract ABI</Label>
                  <Textarea
                    id="abi"
                    data-testid="input-contract-abi"
                    rows={6}
                    placeholder='[{"anonymous":false,"inputs":[...],"name":"Transfer","type":"event"}]'
                    {...form.register("abi")}
                    className="font-mono text-sm resize-none"
                  />
                  {form.formState.errors.abi && (
                    <p className="text-sm text-destructive">{form.formState.errors.abi.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Full ABI or event fragment in JSON format
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    data-testid="button-start-listening"
                    disabled={status === 'listening' || status === 'connecting'}
                    className="flex-1"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Listening
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    data-testid="button-stop-listening"
                    disabled={status !== 'listening'}
                    onClick={handleStopListening}
                    className="flex-1"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Real-time Logs Panel */}
          <Card className="lg:row-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Event Logs
                <Badge variant="secondary" className="ml-auto" data-testid="text-log-count">
                  {logs.length} events
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time blockchain events as they occur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[500px] text-center space-y-3">
                    <Activity className="h-16 w-16 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-sm" data-testid="text-empty-state">
                      No events yet. Start listening to see real-time logs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, index) => (
                      <Card key={`${log.transactionHash}-${index}`} className="hover-elevate" data-testid={`card-event-log-${index}`}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary" data-testid={`text-event-name-${index}`}>
                                  {log.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span data-testid={`text-event-timestamp-${index}`}>{log.timestamp}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Block:</span>
                              <a
                                href={`https://etherscan.io/block/${log.blockNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-primary hover:underline flex items-center gap-1"
                                data-testid={`link-block-${index}`}
                              >
                                {log.blockNumber}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Tx Hash:</span>
                              <a
                                href={`https://etherscan.io/tx/${log.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
                                data-testid={`link-transaction-${index}`}
                              >
                                {log.transactionHash.substring(0, 10)}...{log.transactionHash.substring(58)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <div className="pt-2 border-t">
                              <span className="text-muted-foreground block mb-2">Arguments:</span>
                              <pre className="font-mono text-xs bg-muted p-3 rounded-md overflow-x-auto" data-testid={`text-event-args-${index}`}>
                                {JSON.stringify(log.args, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium text-foreground">1. Enter Contract Details</p>
                <p>Provide the contract address, event signature, and ABI JSON.</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">2. Start Listening</p>
                <p>Click "Start Listening" to begin monitoring blockchain events in real-time.</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">3. View Events</p>
                <p>Events will appear instantly in the logs panel with transaction details.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
