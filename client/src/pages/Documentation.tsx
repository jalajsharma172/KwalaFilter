import Navbar from "@/components/landing/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Documentation() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-6">Documentation</h1>
                    <p className="text-xl text-gray-400 mb-10">
                        Everything you need to integrate with KwalaFilter.
                    </p>

                    <Tabs defaultValue="overview" className="space-y-8">
                        <TabsList className="bg-white/5 border border-white/10 p-1">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="api">API Reference</TabsTrigger>
                            <TabsTrigger value="setup">Backend Setup</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <Card className="bg-white/5 border-white/10 text-white">
                                <CardHeader>
                                    <CardTitle>Architecture</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-300">
                                        KwalaFilter uses a hybrid approach to event monitoring:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-300">
                                        <li><strong>Real-Time:</strong> WebSocket/SSE for sub-second latency.</li>
                                        <li><strong>Historical:</strong> Automatic catch-up for missed blocks.</li>
                                        <li><strong>Persistence:</strong> Supabase for storing subscriptions and workflows.</li>
                                    </ul>
                                    <div className="p-4 bg-black/50 rounded-lg border border-white/10 font-mono text-sm">
                                        Client &lt;-&gt; Server &lt;-&gt; Blockchain (RPC)
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="api" className="space-y-6">
                            <Card className="bg-white/5 border-white/10 text-white">
                                <CardHeader>
                                    <CardTitle>Endpoints</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-indigo-400 mb-2">GET /listen</h3>
                                        <p className="text-gray-300 mb-2">Stream logs via Server-Sent Events.</p>
                                        <pre className="bg-black/50 p-4 rounded-lg border border-white/10 overflow-x-auto">
                                            <code>GET /listen?address=0x...&topic0=0x...</code>
                                        </pre>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-indigo-400 mb-2">POST /api/subscriptions</h3>
                                        <p className="text-gray-300 mb-2">Save a new subscription.</p>
                                        <pre className="bg-black/50 p-4 rounded-lg border border-white/10 overflow-x-auto">
                                            <code>
                                                {`{
  "address": "0x...",
  "topic0": "0x...",
  "ActionName": "Webhook",
  "api": "https://..."
}`}
                                            </code>
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="setup" className="space-y-6">
                            <Card className="bg-white/5 border-white/10 text-white">
                                <CardHeader>
                                    <CardTitle>Quick Start</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-300">
                                        1. Clone the repo.<br />
                                        2. Copy <code>.env.example</code> to <code>.env</code>.<br />
                                        3. Run <code>npm run dev</code>.
                                    </p>
                                    <p className="text-gray-300">
                                        Required Environment Variables:
                                    </p>
                                    <pre className="bg-black/50 p-4 rounded-lg border border-white/10 overflow-x-auto">
                                        <code>
                                            RPC_URL=https://...
                                            ETHERSCAN_API_KEY=...
                                            SUPABASE_URL=...
                                        </code>
                                    </pre>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
