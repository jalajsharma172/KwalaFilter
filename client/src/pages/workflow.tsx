import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Globe } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [subscriptionBlocks, setSubscriptionBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importYamlContent, setImportYamlContent] = useState("");


  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/workflows')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        // Supabase returns an array of records
        if (Array.isArray(data)) setWorkflows(data);
        else if (data && data.data && Array.isArray(data.data)) setWorkflows(data.data);
        else setWorkflows([]);
      })
      .catch((err) => {
        console.error('Failed to fetch workflows:', err);
        if (mounted) setError(String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch subscription_latest_blocks for the list
  useEffect(() => {
    let mounted = true;
    fetch('/api/subscription-latest-blocks')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setSubscriptionBlocks(data);
        else if (data && data.data && Array.isArray(data.data)) setSubscriptionBlocks(data.data);
        else setSubscriptionBlocks([]);
      })
      .catch((err) => {
        console.error('Failed to fetch subscription blocks:', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const [, setLocation] = useLocation();

  // Task 2: Dynamic stats based on status codes
  const successfulActions = workflows.filter((w) => String(w.ActionStatus) === '200').length;
  // User explicitly asked for counts with status code 404 for failed actions
  const failedActions = workflows.filter((w) => String(w.ActionStatus) === '404').length;

  // Task 1: New static stats placeholders
  const avgExecutionTime = "18.56s";
  const chainsUsed = 2; // Base Sepolia, Ethereum Sepolia

  // Helper to calculate "time ago"
  const timeAgo = (dateString: string) => {
    if (!dateString) return 'NA';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  return (
    <div className="min-h-screen w-full bg-[#0d1117] text-white p-6">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8">
        <div className="text-3xl font-bold">
          <span className="text-purple-400">Start Building</span> on Platform
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-1 bg-green-900/40 text-green-400 rounded-lg border border-green-500/40">
            Connected: 0xd454e131...d4d598a3b5
          </div>

          <Button variant="outline" className="border-gray-600">
            Docs
          </Button>
          <Button
            variant="outline"
            className="border-gray-600"
            onClick={async () => {
              try {
                toast({ title: "Triggering Price Alerts...", description: "Processing..." });
                const res = await fetch('/api/price-alerts');
                const data = await res.json();
                if (res.ok) {
                  toast({
                    title: "Success",
                    description: `Processed Alerts. ETH Price: $${data.eth_data?.eth_usd}`,
                  });
                } else {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: data.error || "Failed to trigger alerts",
                  });
                }
              } catch (err) {
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Network error occurred",
                });
              }
            }}
          >
            Price Triggered
          </Button>
        </div>
      </header>

      {/* SUBTEXT */}
      <p className="text-gray-400 max-w-2xl mb-6">
        Your backendless Web3 automation workspace. Build, deploy, and monitor smart contract workflows using YAML.
      </p>

      {/* STATS GRID */}
      <div className="grid grid-cols-4 gap-4">
        {/* Successful Actions */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <div>
              <div className="text-sm text-gray-400">Successful Actions</div>
              <div className="text-2xl font-bold text-white mt-1">{successfulActions}</div>
              <div className="text-xs text-gray-500">total</div>
            </div>
          </CardContent>
        </Card>

        {/* Failed Actions */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6 flex items-center gap-4">
            <XCircle className="h-10 w-10 text-red-500" />
            <div>
              <div className="text-sm text-gray-400">Failed Actions</div>
              <div className="text-2xl font-bold text-white mt-1">{failedActions}</div>
              <div className="text-xs text-gray-500">total</div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Execution Time */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6 flex items-center gap-4">
            <Clock className="h-10 w-10 text-blue-500" />
            <div>
              <div className="text-sm text-gray-400">Avg Execution Time</div>
              <div className="text-2xl font-bold text-white mt-1">{avgExecutionTime}</div>
              <div className="text-xs text-gray-500">average</div>
            </div>
          </CardContent>
        </Card>

        {/* Chains Used */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6 flex items-center gap-4">
            <Globe className="h-10 w-10 text-purple-500" />
            <div>
              <div className="text-sm text-gray-400">Chains Used</div>
              <div className="text-2xl font-bold text-white mt-1">{chainsUsed}</div>
              <div className="text-xs text-gray-500">Base Sepolia, Ethereum Sepolia</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <Tabs defaultValue="workflows" className="mt-8">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="bounty" className="px-6 data-[state=active]:bg-gray-700">
            Bounty
          </TabsTrigger>
          <TabsTrigger value="workflows" className="px-6 data-[state=active]:bg-gray-700">
            My Workflows
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* WORKFLOWS HEADER */}
      <div className="flex justify-between items-center mt-8 mb-4">
        <div className="text-2xl font-semibold">Your Workflows Actions </div>

        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setLocation('/dashboard')}>+ New Workflow</Button>
          <Button variant="outline" className="border-gray-600" onClick={() => setIsImportModalOpen(true)}>Import YAML</Button>
          <Button variant="outline" className="border-gray-600">Browse Templates</Button>
        </div>
      </div>

      {/* WORKFLOW LIST */}
      <div className="space-y-4">
        {loading && (
          <div className="text-gray-400">Loading workflows...</div>
        )}

        {error && (
          <div className="text-red-400">Error loading workflows: {error}</div>
        )}

        {!loading && !error && workflows.length === 0 && (
          <div className="text-gray-400">No workflows found.</div>
        )}

        {!loading && subscriptionBlocks.map((w, i) => (
          <Card
            key={w.id ?? i}
            className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => setLocation(`/workflow/${w.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                {/* Left Side: Name and Trigger/Frequency */}
                <div className="flex flex-col gap-1">
                  <div className="text-lg font-semibold text-white">
                    {w.Workflow_Name || w.ActionName || 'Unnamed Workflow'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {w.times ? `${w.times} (Frequency)` : (w.event_signature ? 'Event Trigger' : '1h')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expired: NA
                  </div>
                </div>

                {/* Right Side: Timing Stats */}
                <div className="text-right flex flex-col gap-1">
                  <div className="text-sm text-gray-400">
                    <span className="text-gray-500">Last:</span> {w.created_at ? timeAgo(w.created_at) : 'NA'}
                  </div>
                  <div className="text-sm text-gray-400">
                    <span className="text-gray-500">Next:</span> NA
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* NEED HELP BUTTON */}
      <div className="fixed bottom-6 right-6">
        <Button className="bg-teal-500 text-black hover:bg-teal-600 px-6 py-2 rounded-full shadow-lg">
          Need Help?
        </Button>
      </div>

      {/* IMPORT YAML OVERLAY */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-[#0d1117] border-gray-700 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Import YAML Workflow</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsImportModalOpen(false)}>
                <XCircle className="h-5 w-5 text-gray-400 hover:text-white" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">
                Paste your workflow YAML configuration below.
              </p>
              <Textarea
                value={importYamlContent}
                onChange={(e) => setImportYamlContent(e.target.value)}
                placeholder="Paste YAML here..."
                className="font-mono text-sm min-h-[300px] bg-gray-900 border-gray-700 text-white"
              />
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setIsImportModalOpen(false)} className="border-gray-600">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    // Reset content if desired, or keep it. Keeping it for now.
                    // setImportYamlContent(""); 
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Import Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
