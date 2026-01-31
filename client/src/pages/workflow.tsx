import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Globe, Plus, FileText, Upload, ChevronRight, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";

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
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white selection:bg-indigo-500/30">
      <Navbar />

      {/* Main Content Container with Padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Start Building <span className="text-indigo-400">on Platform</span>
            </h1>
            <p className="text-gray-400 mt-2 max-w-xl text-sm leading-relaxed">
              Your backendless Web3 automation workspace. Build, deploy, and monitor smart contract workflows using simple YAML configurations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-mono rounded-full border border-green-500/20 backdrop-blur-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              0xd45...98a3b5
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 hover:bg-white/5 hover:text-white text-gray-300 transition-all font-medium"
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
              <Zap className="w-3.5 h-3.5 mr-2 text-yellow-400" />
              Test Trigger
            </Button>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Successful Actions", value: successfulActions, sub: "Total Executions", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/20" },
            { label: "Failed Actions", value: failedActions, sub: "Total Errors", icon: XCircle, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
            { label: "Avg Execution Time", value: avgExecutionTime, sub: "Per Workflow", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20" },
            { label: "Chains Active", value: chainsUsed, sub: "Base, Sepolia", icon: Globe, color: "text-purple-400", bg: "bg-purple-500/5", border: "border-purple-500/20" },
          ].map((stat, i) => (
            <Card key={i} className="bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 group">
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
                  <p className="text-[10px] text-gray-500">{stat.sub}</p>
                </div>
                <div className={cn("p-2.5 rounded-lg border", stat.bg, stat.border)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TABS & ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
          <Tabs defaultValue="workflows" className="w-full md:w-auto">
            <TabsList className="bg-white/5 border border-white/10 p-1 h-auto rounded-lg">
              <TabsTrigger
                value="workflows"
                className="px-6 py-2 text-xs font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 rounded-md transition-all"
              >
                My Workflows
              </TabsTrigger>
              <TabsTrigger
                value="bounty"
                className="px-6 py-2 text-xs font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 rounded-md transition-all"
              >
                Bounty Hunter
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="ghost"
              className="gap-2 text-gray-400 hover:text-white hover:bg-white/5 text-sm"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Upload className="w-4 h-4" /> Import YAML
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-500/20 transition-all font-medium"
              onClick={() => setLocation('/dashboard')}
            >
              <Plus className="w-4 h-4" /> New Workflow
            </Button>
          </div>
        </div>

        {/* WORKFLOW LIST */}
        <div className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              Error loading workflows: {error}
            </div>
          )}

          {!loading && !error && workflows.length === 0 && (
            <div className="text-center py-20 rounded-xl border border-dashed border-white/10 bg-white/5">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No workflows yet</h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">Get started by creating your first automation workflow or importing a configuration.</p>
              <Button variant="outline" onClick={() => setLocation('/dashboard')} className="border-white/10 hover:bg-white/5">
                Create Workflow
              </Button>
            </div>
          )}

          {!loading && subscriptionBlocks.map((w, i) => (
            <div
              key={w.id ?? i}
              className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer"
              onClick={() => setLocation(`/workflow/${w.id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {w.Workflow_Name || w.ActionName || 'Unnamed Workflow'}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-500 font-mono bg-black/30 px-2 py-0.5 rounded border border-white/5">
                        {w.times ? `Frequency: ${w.times}` : (w.event_signature ? 'Event Trigger' : 'Interval: 1h')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 md:pr-4">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Last Run</p>
                    <p className="text-sm text-gray-300 font-mono">{w.created_at ? timeAgo(w.created_at) : 'Never'}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Status</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                      <span className="text-sm text-green-400 font-medium">Active</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IMPORT YAML MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)} />
          <Card className="w-full max-w-2xl bg-[#0a0a0a] border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" /> Import Workflow YAML
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsImportModalOpen(false)} className="hover:bg-white/10 rounded-full h-8 w-8">
                <XCircle className="h-5 w-5 text-gray-400" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm text-gray-400">
                Paste your workflow configuration below. Supported formats: YAML, JSON.
              </p>
              <div className="relative">
                <Textarea
                  value={importYamlContent}
                  onChange={(e) => setImportYamlContent(e.target.value)}
                  placeholder="name: MyWorkflow..."
                  className="font-mono text-sm min-h-[300px] bg-[#050505] border-white/10 text-gray-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none p-4"
                />
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-white/10 text-[10px] text-gray-500 font-mono">YAML</div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setIsImportModalOpen(false)} className="hover:text-white">
                  Cancel
                </Button>
                <Button
                  onClick={() => setIsImportModalOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[120px]"
                >
                  Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
