// Updated Event Listener Frontend (Option B)
// Displays Decoded Event in human-readable format:
// EventName: ...
// Arguments:
//   • name: value
// Block: ...
// Tx: ...

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, StopCircle, PlayCircle, ExternalLink, Zap, Database, Copy, Check } from "lucide-react";

type StatusType = 'idle' | 'connecting' | 'listening' | 'catching-up' | 'error';
//Ready to start listening - Ye Workflow ki baat ho rahi hai
interface LogEntry {
  type: 'log' | 'status' | 'error' | 'connected';
  data: any;
  timestamp: Date;
}

export default function EventListener() {
  const [logs, setLogs] = useState<LogEntry[]>([]);//Workflow[]
  const [status, setStatus] = useState<StatusType>('idle');//Status of workflow
  const [statusMessage, setStatusMessage] = useState<string>('Ready to start listening');//MSG of workflow
  const [address, setAddress] = useState('');//Address
  const [topic0, setTopic0] = useState('');//Event
  const [abi, setAbi] = useState<string>('');//ABI
  const [api, setApi] = useState('');//API
  const [isFormValid, setIsFormValid] = useState(false);
  const [errors, setErrors] = useState<{ address?: string; topic0?: string; abi?: string; api?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [copied, setCopied] = useState('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStartListening = async (e: React.FormEvent) => {
    console.log("HandlestartListening");
    
    e.preventDefault();

    // Validate inputs
    if (!address.trim()) {
      setStatus('error');
      setStatusMessage('Please enter a contract address');
      return;
    }

    if (!topic0.trim()) {
      setStatus('error');
      setStatusMessage('Please enter a topic (topic0)');
      return;
    }

    if (!abi.trim()) {
      setStatus('error');
      setStatusMessage('Please enter the contract ABI');
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    console.log("HandlestartListening conditions Over");
    

    setLogs([]);
    setStatus('connecting');
    setStatusMessage('Connecting to event stream...');

    try {
      const abiBase64 = btoa(abi.trim());
      const url = `/listen?address=${encodeURIComponent(address.trim())}&topic0=${encodeURIComponent(topic0.trim())}&abi=${encodeURIComponent(abiBase64)}&api=${encodeURIComponent(api.trim())}`;
      const eventSource = new EventSource(url);

    console.log("EVENT");
    console.log("eventSource : ",eventSource);
      
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setLogs((prev) => [
          {
            type: 'connected',
            data,
            timestamp: new Date(),
          },
          ...prev,
        ]);
        setStatus('idle');
        setStatusMessage('Connected to event stream');
      });

      eventSource.addEventListener('status', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setLogs((prev) => [
          {
            type: 'status',
            data,
            timestamp: new Date(),
          },
          ...prev,
        ]);

        if (data.status === 'catching-up') {
          setStatus('catching-up');
          setStatusMessage(data.message);
        } else if (data.status === 'listening') {
          setStatus('listening');
          setStatusMessage(data.message);
        }
      });

      eventSource.addEventListener('log', (e: MessageEvent) => {
        const raw = JSON.parse(e.data);
        const encoded = raw.encoded || {};
        const decoded = raw.decoded || null;
        // Normalize shape so renderer has direct fields
        const normalized = {
          blockNumber: encoded.blockNumber ?? decoded?.raw?.blockNumber ?? null,
            // transactionHash always optional; guard for substring usage later
          transactionHash: encoded.transactionHash ?? null,
          address: encoded.address ?? null,
          topics: encoded.topics ?? [],
          decoded, // keep full decoded object for future expansion
        };
        setLogs((prev) => [
          {
            type: 'log',
            data: normalized,
            timestamp: new Date(),
          },
          ...prev,
        ]);
        setStatus('listening');
        setStatusMessage('Listening for events');
      });

      eventSource.addEventListener('error', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setLogs((prev) => [
            {
              type: 'error',
              data,
              timestamp: new Date(),
            },
            ...prev,
          ]);
          setStatusMessage(`Error: ${data.error}`);
        } catch {
          setStatusMessage('Connection error');
        }
        setStatus('error');
        eventSource.close();
      });

      eventSource.onerror = () => {
        setStatus('error');
        setStatusMessage('Connection lost');
        eventSource.close();
      };
    } catch (error) {
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to connect');
    }
  };

  const validateInputs = (): { ok: boolean; errors: { address?: string; topic0?: string; abi?: string; api?: string } } => {
    const addr = address.trim();
    const tp = topic0.trim();
    const ab = abi.trim();
    const ap = api.trim();
    const out: { address?: string; topic0?: string; abi?: string; api?: string } = {};

    if (!addr) out.address = 'Please enter a contract address';
    else if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) out.address = 'Invalid address format (0x + 40 hex chars)';

    if (!tp) out.topic0 = 'Please enter a topic (topic0)';
    else if (!/^0x[a-fA-F0-9]{64}$/.test(tp)) out.topic0 = 'Invalid topic0 format (0x + 64 hex chars)';

    if (!ab) out.abi = 'Please enter the contract ABI';
    else {
      try {
        const parsed = JSON.parse(ab);
        if (!Array.isArray(parsed)) out.abi = 'ABI must be a JSON array';
      } catch (err) {
        out.abi = 'ABI is not valid JSON';
      }
    }

    if (ap) {
      try {
        if (!ap.startsWith('/')) new URL(ap);
      } catch (err) {
        out.api = 'API URL is not valid';
      }
    }

    return { ok: Object.keys(out).length === 0, errors: out };
  };

  const handleTestInputs = (e?: React.MouseEvent) => {
    e?.preventDefault();
    const res = validateInputs();
    setErrors(res.errors);
    if (!res.ok) {
      setIsFormValid(false);
      setStatus('error');
      const first = res.errors.address || res.errors.topic0 || res.errors.abi || res.errors.api;
      setStatusMessage(first || 'Validation failed');
      return;
    }

    // validation passed
    setIsFormValid(true);
    setIsSaved(false); // require re-save after a new successful test
    setStatus('idle');
    setStatusMessage('Validation OK — Save enabled');
  };

  const SaveInputsToSupabase = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    // require validation to have passed
    if (!isFormValid) {
      setStatus('error');
      setStatusMessage('Please run Test and fix validation errors before saving');
      return;
    }

    setIsSaving(true);
    setStatus('connecting');
    setStatusMessage('Saving subscription to server...');

    // prepare payload
    let parsedAbi: any = abi;
    try {
      if (typeof abi === 'string') parsedAbi = JSON.parse(abi);
    } catch (err) {
      setIsSaving(false);
      setStatus('error');
      setStatusMessage('ABI is not valid JSON');
      return;
    }

    try {
      const resp = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), topic0: topic0.trim(), abi: parsedAbi, api: api?.trim() }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        console.error('Save failed', resp.status, json);
        setIsSaving(false);
        setIsSaved(false);
        setStatus('error');
        // show message returned by server if possible
        const msg = json?.error || (json && typeof json === 'object' ? JSON.stringify(json) : String(json));
        setStatusMessage(`Save failed: ${msg}`);
        return;
      }

      setIsSaving(false);
      setIsSaved(true);
      setStatus('idle');
      setStatusMessage('Saved to server — Start Listening enabled');
    } catch (err: any) {
      console.error('Save exception', err);
      setIsSaving(false);
      setIsSaved(false);
      setStatus('error');
      setStatusMessage(err?.message || 'Save failed');
    }
  };

  const handleStopListening = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('idle');
    setStatusMessage('Stopped listening');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return 'bg-status-online';
      case 'catching-up':
        return 'bg-status-away';
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
      case 'catching-up':
        return <Badge className="bg-status-away/20 text-status-away border-status-away/30">Catching Up</Badge>;
      case 'connecting':
        return <Badge className="bg-status-away/20 text-status-away border-status-away/30">Connecting</Badge>;
      case 'error':
        return <Badge className="bg-status-busy/20 text-status-busy border-status-busy/30">Error</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const formatLogData = (log: LogEntry) => {
    if (log.type === 'log') {
      const data = log.data || {};
      const tx = data.transactionHash;
      return (
        <div className="space-y-2 text-xs font-mono">
          <div>
            <span className="text-muted-foreground">Block:</span>{' '}
            <span className="text-foreground">{data.blockNumber ?? '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tx Hash:</span>{' '}
            {typeof tx === 'string' && tx.startsWith('0x') ? (
              <code className="text-primary break-all cursor-pointer flex items-center gap-2 group">
                <span><u>{tx.slice(0, 20)}</u>...</span>
                <ExternalLink
                  className="h-3 w-3 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => window.open(`https://sepolia.etherscan.io/tx/${tx}`, '_blank')}
                />
              </code>
            ) : (
              <span className="text-muted-foreground">(not available)</span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Address:</span>{' '}
            <code className="text-foreground break-all">{data.address ?? '—'}</code>
          </div>
          {Array.isArray(data.topics) && data.topics.length > 0 && (
            <div>
              <span className="text-muted-foreground">Topics:</span>
              <div className="ml-2 space-y-1">
                {data.topics.map((topic: string, idx: number) => (
                  <div key={idx} className="text-muted-foreground">
                    [{idx}] <code className="text-foreground text-xs break-all">{topic}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.decoded && data.decoded.eventName && (
            <div>
              <span className="text-muted-foreground">Decoded Event:</span>{' '}
              <span className="text-foreground font-semibold">{data.decoded.eventName}</span>
              {data.decoded.args && (
                <div className="mt-1 ml-2 space-y-1">
                  {Object.entries(data.decoded.args).map(([k, v]) => (
                    <div key={k} className="text-muted-foreground">
                      • {k}: <code className="text-foreground">{String(v)}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    } else if (log.type === 'status') {
      return (
        <div className="text-xs space-y-1">
          <div>
            <span className="text-muted-foreground">Status:</span> <span className="text-foreground">{log.data.status}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Message:</span> <span className="text-foreground">{log.data.message}</span>
          </div>
        </div>
      );
    } else if (log.type === 'error') {
      return (
        <div className="text-xs text-red-400">
          <span className="text-muted-foreground">Error:</span> {log.data.error}
        </div>
      );
    } else if (log.type === 'connected') {
      return (
        <div className="text-xs text-green-400">
          <span className="text-muted-foreground">Connected:</span> {log.data.message}
        </div>
      );
    }
  };

  const exampleAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const exampleTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

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
            Real-time blockchain event monitoring with Server-Sent Events
          </p>
        </div>

        {/* Status Bar */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${getStatusColor()} animate-pulse`}
                  data-testid="indicator-connection-status"
                />
                <span className="text-sm font-medium" data-testid="text-status-message">
                  {statusMessage}
                </span>
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
              <CardDescription>Enter contract address and event topic to monitor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleStartListening} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Contract  Address</Label>
                  <Input
                    id="address"
                    data-testid="input-contract-address"
                    placeholder="0x..."
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setIsFormValid(false); setErrors(prev => ({ ...prev, address: undefined })); }}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Ethereum contract address (42 characters: 0x + 40 hex)</p>
                  {errors.address && <p className="text-xs text-red-400 mt-1">{errors.address}</p>}
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    onClick={() => copyToClipboard(exampleAddress, 'addr')}
                  >
                    {copied === 'addr' ? (
                      <>
                        <Check className="h-3 w-3" /> Copied example
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Use example (USDC on Sepolia)
                      </>
                    )}
                  </button>
                  </div>

                <div className="space-y-2">
                  <Label htmlFor="topic0">Event Topic (topic0)</Label>
                  <Input
                    id="topic0"
                    data-testid="input-event-topic"
                    placeholder="0x..."
                    value={topic0}
                    onChange={(e) => { setTopic0(e.target.value); setIsFormValid(false); setErrors(prev => ({ ...prev, topic0: undefined })); setIsSaved(false); }}
                    className="font-mono text-xs"
                  />






                  <p className="text-xs text-muted-foreground">
                    Event signature hash (0x + 64 hex characters)
                  </p>
                  {errors.topic0 && <p className="text-xs text-red-400 mt-1">{errors.topic0}</p>}
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    onClick={() => copyToClipboard(exampleTopic, 'topic')}
                  >
                    {copied === 'topic' ? (
                      <>
                        <Check className="h-3 w-3" /> Copied example
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Use example (Transfer event)
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abi">Contract ABI</Label>
                  <textarea
                    id="abi"
                    data-testid="input-contract-abi"
                    placeholder="Paste contract ABI here..."
                    value={abi}
                    onChange={(e) => { setAbi(e.target.value); setIsFormValid(false); setErrors(prev => ({ ...prev, abi: undefined })); }}
                    className="font-mono text-xs w-full h-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the contract ABI (Application Binary Interface) to decode logs.
                  </p>
                  {errors.abi && <p className="text-xs text-red-400 mt-1">{errors.abi}</p>}
                </div>





                <div className="space-y-2">
                  <Label htmlFor="api">POST API</Label>
                  <Input
                    id="api"
                    data-testid="input-post-api"
                    placeholder="http://localhost:5000/api"
                    value={api}
                    onChange={(e) => { setApi(e.target.value); setIsFormValid(false); setErrors(prev => ({ ...prev, api: undefined })); }}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    POST API endpoint URL
                  </p>
                  <Button
                    type="button"
                    data-testid="button-test-inputs"
                    onClick={handleTestInputs}
                    className="flex-1"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Test
                  </Button>

                  <Button
                    type="button"
                    data-testid="button-save-subscription"
                    onClick={SaveInputsToSupabase}
                    disabled={!isFormValid || isSaving}
                    className="flex-1"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
                  </Button>

                  
 
                  <Button
                    type="submit"
                    data-testid="button-start-listening"
                    disabled={
                      status === 'listening' ||
                      status === 'catching-up' ||
                      status === 'connecting' ||
                      !isFormValid ||
                      !isSaved
                    }
                    className="flex-1"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Listening
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    data-testid="button-stop-listening"
                    disabled={status !== 'listening' && status !== 'catching-up'}
                    onClick={handleStopListening}
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>

              </form>

              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Quick Guide</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Find contract address on block explorer (Etherscan)</li>
                  <li>Get event topic by hashing: keccak256("EventName(type1,type2,...)")</li>
                  <li>Click "Start Listening" to begin monitoring</li>
                  <li>Logs appear in real-time as events are emitted</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Event Logs Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Event Logs
              </CardTitle>
              <CardDescription>{logs.length} events captured</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-96">
                <div className="p-4 space-y-2">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
                      No logs yet. Start listening to see events here.
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs ${
                          log.type === 'log'
                            ? 'bg-primary/5 border-primary/20'
                            : log.type === 'status'
                              ? 'bg-status-away/5 border-status-away/20'
                              : log.type === 'error'
                                ? 'bg-status-busy/5 border-status-busy/20'
                                : 'bg-status-online/5 border-status-online/20'
                        }`}
                      >
                        <div className="text-muted-foreground mb-2">
                          {log.timestamp.toLocaleTimeString()}
                          {' '}
                          {log.type === 'log' && '📨 Event'}
                          {log.type === 'status' && '📊 Status'}
                          {log.type === 'error' && '❌ Error'}
                          {log.type === 'connected' && '✓ Connected'}
                        </div>
                        {formatLogData(log)}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
