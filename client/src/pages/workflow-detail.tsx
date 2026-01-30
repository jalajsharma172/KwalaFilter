import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Copy, Save, Play, Settings, FileText, ChevronLeft } from "lucide-react";

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
        return <div className="p-10 text-white">Loading workflow details...</div>;
    }

    if (!workflow) {
        return <div className="p-10 text-white">Workflow not found.</div>;
    }

    return (
        <div className="min-h-screen w-full bg-[#0d1117] text-white p-4">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setLocation('/workflow')}>
                        <ChevronLeft className="h-5 w-5 mr-1" /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <b><h1>Kwala </h1>  </b>
                        <img src="/logo.jpg" alt="Kwala Logo" className="h-8 w-8 rounded-full object-cover" />
                        <span className="text-gray-600 text-2xl font-light">/</span>
                        <h1 className="text-xl font-bold">{workflow.Workflow_Name || workflow.ActionName || 'Unnamed Workflow'}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-600">Import</Button>
                    <Button className="bg-gray-800 border border-gray-600 hover:bg-gray-700">
                        <Settings className="h-4 w-4 mr-2" /> Workflow Builder
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* LEFT COLUMN - YAML EDITOR */}
                <div className="col-span-8 bg-[#161b22] rounded-lg border border-gray-700 overflow-hidden flex flex-col h-[80vh]">
                    <div className="flex justify-between items-center px-4 py-2 bg-[#0d1117] border-b border-gray-700">
                        <div className="text-xs text-gray-400 font-mono">YAML • Lines: {yamlContent.split('\n').length} • Editable</div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto relative font-mono text-sm">
                        {/* Custom Syntax Highlighter & Line Numbers */}
                        <div className="flex min-h-full font-mono text-sm leading-6">
                            {/* Line Numbers */}
                            <div className="bg-[#0d1117] text-gray-600 text-right pr-3 pl-2 py-4 select-none border-r border-gray-800 shrink-0 select-none">
                                {yamlContent.split('\n').map((_, i) => (
                                    <div key={i}>{i + 1}</div>
                                ))}
                            </div>

                            {/* Code Content */}
                            <div className="flex-1 bg-transparent p-4 overflow-x-auto whitespace-pre-wrap break-all">
                                {yamlContent.split('\n').map((line, i) => {
                                    // Simple regex to parse "key: value"
                                    // This is naive but works for the generated YAML structure
                                    const match = line.match(/^(\s*)([^:]+)(:\s*)(.*)$/);
                                    if (match) {
                                        const [, indent, key, separator, value] = match;
                                        // Heuristic: If it starts with '-', it's a list item, maybe color differently
                                        const isListItem = key.trim().startsWith('-');
                                        return (
                                            <div key={i} className="w-full">
                                                <span className="text-gray-500">{indent}</span>
                                                <span className={isListItem ? "text-yellow-400" : "text-blue-400"}>{key}</span>
                                                <span className="text-gray-400">{separator}</span>
                                                <span className="text-green-400">{value}</span>
                                            </div>
                                        );
                                    }
                                    // If no match (e.g. empty line or just a value), render as is
                                    return (
                                        <div key={i} className="text-gray-300 w-full min-h-[1.5em]">{line}</div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#0d1117] p-3 border-t border-gray-700 flex justify-end gap-3">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Save className="h-4 w-4" /> Save
                        </Button>
                        <Button className="border border-gray-600 text-gray-300 gap-2">
                            <Play className="h-4 w-4" /> Compile
                        </Button>
                        <Button className="border border-purple-500/50 text-purple-400 bg-purple-900/20 gap-2">
                            Deploy
                        </Button>
                        <Button className="bg-green-700/20 text-green-400 border border-green-700/50 gap-2">
                            Activated
                        </Button>
                    </div>
                </div>

                {/* RIGHT COLUMN - SIDEBAR */}
                <div className="col-span-4 space-y-6">
                    {/* Validation */}
                    <Card className="bg-[#161b22] border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-lg">Validation</CardTitle>
                            <p className="text-xs text-gray-500">Real-time workflow validation</p>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                            <Play className="h-12 w-12 text-gray-700 mb-4" />
                            <p className="text-sm text-gray-500">Click Compile to validate your workflow</p>
                            <p className="text-xs text-gray-600">Get syntax and schema validation from the API</p>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-[#161b22] border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-800">
                                <Copy className="h-4 w-4 mr-2" /> Import from File
                            </Button>
                            <Button variant="outline" className="w-full justify-start border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-800">
                                <Settings className="h-4 w-4 mr-2" /> Configure Keys
                            </Button>
                            <Button variant="outline" className="w-full justify-start border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-800">
                                <FileText className="h-4 w-4 mr-2" /> View Documentation
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Workflow Information */}
                    <Card className="bg-[#161b22] border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-lg">Workflow Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-500">Workflow Name</div>
                                <div className="text-white font-medium">{workflow.Workflow_Name || workflow.ActionName || 'Unnamed'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Status</div>
                                <div className="inline-block px-2 py-0.5 rounded text-xs bg-green-900/40 text-green-400 border border-green-500/30">
                                    WORKFLOW DEPLOYED
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Workflow Address</div>
                                <div className="text-gray-300 text-xs font-mono break-all">
                                    4fad5686ae11279fbc23ebec7bd484eb5ebd5784
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Expires In</div>
                                <div className="flex gap-2">
                                    <input type="text" value="e.g., in uint format 1749739300" disabled className="bg-gray-800 border border-gray-700 text-gray-500 text-xs rounded px-3 py-2 w-full" />
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-auto">Update</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
