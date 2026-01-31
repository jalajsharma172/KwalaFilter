import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Copy, Save, Play, Settings, FileText, ChevronLeft, Check, AlertTriangle, Upload, Box, Code } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import { cn } from "@/lib/utils";

export default function WorkflowDetail() {
    const [, params] = useRoute("/workflow/:id");
    const [, setLocation] = useLocation();
    const [workflow, setWorkflow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [yamlContent, setYamlContent] = useState("");

    const id = params?.id;

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        // Fetch all records and find the one with matching ID
        // (Optimization: In a real app, we'd have a specific GET /api/subscription-latest-blocks/:id endpoint)
        fetch('/api/subscription-latest-blocks')
            .then(r => r.json())
            .then(data => {
                const found = Array.isArray(data)
                    ? data.find((w: any) => String(w.id) === String(id))
                    : (data.data && Array.isArray(data.data) ? data.data.find((w: any) => String(w.id) === String(id)) : null);

                if (found) {
                    setWorkflow(found);
                    generateYaml(found);
                }
            })
            .catch(err => console.error("Failed to fetch workflow details:", err))
            .finally(() => setLoading(false));
    }, [id]);

    const generateYaml = (w: any) => {
        // Construct YAML string to match the user's design
        const yaml = `Name: ${w.Workflow_Name || w.ActionName || 'Unnamed'}
Trigger:
  TriggerSourceContract: ${w.address || 'NA'}
  TriggerChainID: 11155111
  TriggerEventName: ${w.event_signature || 'NA'}
  TriggerEventFilter: NA
  TriggerSourceContractABI: ${w.abi ? JSON.stringify(w.abi) : 'NA'}
  TriggerPrice: NA
  RecurringSourceContract: ${w.address || 'NA'}
  RecurringChainID: 11155111
  RecurringEventName: ${w.event_signature || 'NA'}
  RecurringEventFilter: NA
  RecurringSourceContractABI: ${w.abi ? JSON.stringify(w.abi) : 'NA'}
  RecurringPrice: NA
  RepeatEvery: ${w.times ? 'time' : 'event'}
  ExecuteAfter: event
  ExpiresIn: 1765947600
  Meta: NA
  ActionStatusNotificationPOSTURL: https://workflow-notification-test.kalp.network/push_notification
  ActionStatusNotificationAPIKey: NA
Actions:
  - Name: sc
    Type: call
    APIEndpoint: ${w.api || 'NA'}
    APIPayload:
      Message: NA
    TargetContract: ${w.TargetContract || 'NA'}
    TargetFunction: ${w.TargetFunction || 'NA'}
    TargetParams:
      ${w.TargetFunctionParameters || '- NA'}
    ChainID: 11155111
    EncodedABI: NA
    Bytecode: NA
    Metadata: NA
    RetriesUntilSuccess: 5
Execution:
  Mode: parallel
`;
        setYamlContent(yaml);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!workflow) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Workflow not found.</div>;
    }

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white selection:bg-indigo-500/30">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
                {/* HEADER */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white hover:bg-white/5 -ml-2"
                            onClick={() => setLocation('/workflow')}
                        >
                            <ChevronLeft className="h-5 w-5 mr-1" /> Back
                        </Button>
                        <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Box className="w-6 h-6 text-indigo-500" />
                                {workflow.Workflow_Name || workflow.ActionName || 'Unnamed Workflow'}
                            </h1>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono uppercase tracking-wider">
                                {workflow.times ? 'Interval' : 'Event'}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 gap-2 flex-1 md:flex-none">
                            <Upload className="h-4 w-4" /> Import
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 flex-1 md:flex-none shadow-lg shadow-indigo-500/20">
                            <Settings className="h-4 w-4" /> Builder
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN - YAML EDITOR */}
                    <div className="lg:col-span-8 bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden flex flex-col h-[70vh] shadow-2xl relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                        <div className="flex justify-between items-center px-4 py-3 bg-white/5 border-b border-white/5 relative z-10">
                            <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">configuration.yaml</span>
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                                Read-only • {yamlContent.split('\n').length} lines
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden relative font-mono text-sm bg-[#050505]">
                            <div className="flex min-h-full font-mono text-[13px] leading-6">
                                {/* Line Numbers */}
                                <div className="bg-[#0a0a0a] text-gray-600 text-right pr-4 pl-3 py-4 select-none border-r border-white/5 shrink-0 select-none w-[50px]">
                                    {yamlContent.split('\n').map((_, i) => (
                                        <div key={i}>{i + 1}</div>
                                    ))}
                                </div>

                                {/* Code Content */}
                                <div className="flex-1 p-4 overflow-auto whitespace-pre-wrap break-all text-gray-300">
                                    {yamlContent.split('\n').map((line, i) => {
                                        const match = line.match(/^(\s*)([^:]+)(:\s*)(.*)$/);
                                        if (match) {
                                            const [, indent, key, separator, value] = match;
                                            const isListItem = key.trim().startsWith('-');
                                            return (
                                                <div key={i} className="w-full hover:bg-white/[0.02]">
                                                    <span className="text-gray-500">{indent}</span>
                                                    <span className={isListItem ? "text-yellow-400" : "text-blue-400"}>{key}</span>
                                                    <span className="text-gray-500">{separator}</span>
                                                    <span className="text-[#ce9178]">{value}</span>
                                                </div>
                                            );
                                        }
                                        return <div key={i} className="text-gray-500 w-full min-h-[1.5em]">{line}</div>;
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 border-t border-white/5 flex flex-wrap justify-end gap-3 relative z-10">
                            <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
                                <Copy className="h-4 w-4" /> Copy
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-500 text-white gap-2 border border-green-500/20">
                                <Save className="h-4 w-4" /> Save Changes
                            </Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-500/20">
                                <Play className="h-4 w-4 fill-current" /> Deploy
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - SIDEBAR */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Status Card */}
                        <Card className="bg-white/5 border-white/10 shadow-lg">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                        <Check className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">Active & Running</div>
                                        <div className="text-xs text-gray-500">Last synced 2 mins ago</div>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[95%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                    <Settings className="h-4 w-4 mr-3 text-gray-500" /> Configure Keys
                                </Button>
                                <Button variant="outline" className="w-full justify-start border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                    <FileText className="h-4 w-4 mr-3 text-gray-500" /> View Logs
                                </Button>
                                <Button variant="outline" className="w-full justify-start border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                    <AlertTriangle className="h-4 w-4 mr-3 text-gray-500" /> Report Issue
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Details */}
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Contract Address</div>
                                    <div className="text-xs font-mono text-gray-300 bg-black/40 p-2 rounded border border-white/5 truncate">
                                        {workflow.address || '0x...'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Workflow ID</div>
                                    <div className="text-xs font-mono text-gray-300 bg-black/40 p-2 rounded border border-white/5">
                                        {workflow.id}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
