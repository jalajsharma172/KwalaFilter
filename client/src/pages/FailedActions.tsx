import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle, Clock, Calendar, Activity, Database, Globe, AlertTriangle } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

export default function FailedActions() {
  const [, setLocation] = useLocation();
  const [failedActions, setFailedActions] = useState<any[]>([]);
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
        
        // Filter out everything except 200
        const failedOnly = workflows.filter((w: any) => String(w.ActionStatus) !== '200').reverse();
        setFailedActions(failedOnly);
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
                <XCircle className="w-7 h-7 text-red-500" /> 
                Failed Actions Analysis
              </h1>
              <p className="text-sm text-gray-400 mt-1 pl-9">
                Detailed view of failed workflow executions with error analysis and resolution steps
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : failedActions.length === 0 ? (
            <div className="text-center py-20 bg-[#1E293B] rounded-xl border border-white/5">
              <p className="text-gray-400">No failed actions found.</p>
            </div>
          ) : (
            failedActions.map((action, idx) => (
              <div key={action.id || idx} className="bg-[#1E293B] rounded-lg border border-white/5 p-6 flex flex-col gap-6 hover:border-white/10 transition-colors">
                
                {/* Top Section: 2 Columns */}
                <div className="flex flex-col md:flex-row gap-6">
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
                        {action.ActionType || 'sc'}
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
                        20.49s
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> Error Code:
                      </div>
                      <div className="text-[10px] font-bold text-red-400 px-2 py-0.5 border border-red-500/50 rounded-full uppercase">
                        {action.ActionStatus || 'UNKNOWN'}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex-1 space-y-4 md:pl-6 md:border-l md:border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Globe className="w-4 h-4 text-blue-400" /> Chain ID:
                      </div>
                      <div className="text-sm font-bold text-white">11155111</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4 text-yellow-500" /> Scheduled Run:
                      </div>
                      <div className="text-sm text-gray-400">N/A</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> Severity:
                      </div>
                      <div className="text-[10px] font-bold text-red-400 px-2 py-0.5 border border-red-500/50 bg-red-500/10 rounded-full uppercase">
                        Error
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Error Message */}
                <div className="bg-[#451A22] border border-red-500/20 rounded-md p-4">
                  <div className="flex items-center gap-2 text-sm text-red-400 mb-2 font-medium">
                    <XCircle className="w-4 h-4" /> Error Message:
                  </div>
                  <div className="text-sm text-red-200">
                    {action.ActionResponse || 'Request failed: HTTP 500 from endpoint. Body preview: {"success":false,"er".'}
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
