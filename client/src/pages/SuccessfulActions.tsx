import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, Calendar, Activity, Database, Globe, Flame } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

export default function SuccessfulActions() {
  const [, setLocation] = useLocation();
  const [successfulActions, setSuccessfulActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/workflows')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        let workflows = [];
        if (Array.isArray(data)) workflows = data;
        else if (data && data.data && Array.isArray(data.data)) workflows = data.data;
        
        const successOnly = workflows.filter((w: any) => String(w.ActionStatus) === '200').reverse();
        setSuccessfulActions(successOnly);
      })
      .catch((err) => {
        console.error('Failed to fetch workflows:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const formatHash = (str: string) => {
    if (!str || str.length < 15) return str;
    return `${str.substring(0, 15)}...${str.substring(str.length - 10)}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#0F172A] text-white selection:bg-indigo-500/30 font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="bg-black/50 border-white/10 text-white hover:bg-white/10 hover:text-white font-semibold text-xs"
              onClick={() => setLocation('/workflow')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-7 h-7 text-green-400" /> 
                Successful Actions Metadata
              </h1>
              <p className="text-sm text-gray-400 mt-1 pl-9">
                Detailed view of all successful workflow executions and their results
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : successfulActions.length === 0 ? (
            <div className="text-center py-20 bg-[#1E293B] rounded-xl border border-white/5">
              <p className="text-gray-400">No successful actions found.</p>
            </div>
          ) : (
            successfulActions.map((action, idx) => (
              <div key={action.id || idx} className="bg-[#1E293B] rounded-lg border border-white/5 p-6 flex flex-col md:flex-row gap-6 hover:border-white/10 transition-colors">
                
                {/* Left Column */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Database className="w-4 h-4 text-purple-400" /> Workflow:
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {formatHash(action.Workflow_Name || action.ActionName || 'Unnamed')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Activity className="w-4 h-4 text-orange-400" /> Action:
                    </div>
                    <div className="text-sm text-gray-200">
                      {action.ActionType || 'apicall'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4 text-green-400" /> Timestamp:
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                      {action.created_at ? new Date(action.created_at).toUTCString() : 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4 text-blue-400" /> Execution Time:
                    </div>
                    <div className="text-sm font-bold text-white">
                      58.60s {/* Mocked based on screenshot, could be dynamic */}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Flame className="w-4 h-4 text-blue-300" /> Gas Fees Consumed:
                    </div>
                    <div className="text-sm font-bold text-white">
                      0.001000
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex-1 space-y-4 md:pl-6 md:border-l md:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Globe className="w-4 h-4 text-blue-400" /> Chain ID:
                    </div>
                    <div className="text-sm text-gray-400">N/A</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4 text-yellow-500" /> Scheduled Run:
                    </div>
                    <div className="text-sm text-gray-400">N/A</div>
                  </div>

                  <div className="bg-[#2D3748]/50 border border-white/5 rounded-md p-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-green-400 mb-2 font-medium">
                      <CheckCircle className="w-4 h-4" /> Result:
                    </div>
                    <div className="text-sm text-gray-200 pl-6">
                      Action completed successfully
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
