import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  let balance = 1.083033;

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

  const [, setLocation] = useLocation();

  const successfulActions = workflows.filter((w) => Number(w.ActionStatus) === 200).length;
  const failedActions = workflows.length - successfulActions;
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
          <div className="px-4 py-1 bg-gray-800 rounded-lg border border-gray-700">
             {balance} KWALA
          </div>
          <Button variant="outline" className="border-gray-600">
            Docs
          </Button>
          <Button variant="outline" className="border-gray-600">
            Settings
          </Button>
        </div>
      </header>

      {/* SUBTEXT */}
      <p className="text-gray-400 max-w-2xl mb-6">
        Your backendless Web3 automation workspace. Build, deploy, and monitor smart contract workflows using YAML.
      </p>  

      {/* STATS GRID */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-lg">Successful Actions</div>
            <div className="text-3xl font-bold text-green-400 mt-1">{successfulActions}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-lg">Failed Actions</div>
            <div className="text-3xl font-bold text-red-400 mt-1">{failedActions}</div>
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
        <div className="text-2xl font-semibold">Your Deployed Workflows</div>

        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setLocation('/')}>+ New Workflow</Button>
          <Button variant="outline" className="border-gray-600">Import YAML</Button>
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

        {!loading && workflows.map((w, i) => (
          <Card key={w.id ?? i} className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl">{w.ActionName || w.name || 'Unnamed Workflow'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Separator className="bg-gray-700 my-2" />
              <div className="flex justify-between text-sm text-gray-400">
                <div>Status: {Number(w.ActionStatus) === 200 ? 'Success' : `Failed (${w.ActionStatus})`}</div>
                <div>{w.created_at ? `Created: ${new Date(w.created_at).toLocaleString()}` : ''}</div>
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
    </div>
  );
}
