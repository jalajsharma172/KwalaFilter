import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import { Upload, Settings, Play, Copy, Save, Rocket, MessageSquare, FileText, X, Zap, Bell, Calendar, ChevronDown, Check, Plus, Trash2, AlertTriangle, CheckCircle2, XCircle, Loader2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function YamlEditor() {
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  // Form State
  const [workflowName, setWorkflowName] = useState("");
  const [triggerData, setTriggerData] = useState({
    executeAfter: "Immediate",
    repeatEvery: "NA",
    expiresIn: "1791713400",
    meta: "NA",
    notificationUrl: "https://workflow-notification-test.kalp.network/push_notification",
    apiKey: "NA"
  });
  const [actions, setActions] = useState([
    { id: 1, name: "", type: "POST (API Call)", endpoint: "https://dev-api.kalp.network/webhook", payload: "{}", retries: "5" }
  ]);
  const [executionMode, setExecutionMode] = useState("Sequential");
  const [triggerSourceData, setTriggerSourceData] = useState({
    contract: "",
    chainId: "",
    smartContract: "",
    abi: `[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"}, ... ]`,
    eventName: "",
    eventFilter: "NA"
  });

  // Compile State
  const [compileResult, setCompileResult] = useState<null | { success: boolean; errors: string[]; warnings: string[] }>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleCompile = () => {
    setIsCompiling(true);
    setCompileResult(null);

    // Simulate a compile check with slight delay for realism
    setTimeout(() => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check Name field
      const nameLine = yamlLines.find(l => l.startsWith("Name:"));
      const nameValue = nameLine ? nameLine.replace("Name:", "").trim() : "";
      if (!nameValue || nameValue === "<Workflow-Name>" || nameValue === "") {
        errors.push("Name field is required and cannot be empty.");
      }

      // Check if Trigger section exists
      if (!yamlLines.some(l => l.trim() === "Trigger:")) {
        errors.push("Trigger section is missing.");
      }

      // Check if Actions section exists
      if (!yamlLines.some(l => l.trim() === "Actions:")) {
        errors.push("Actions section is missing.");
      }

      // Check APIEndpoint for each action
      const apiEndpointLines = yamlLines.filter(l => l.trim().startsWith("APIEndpoint:"));
      if (apiEndpointLines.length === 0) {
        errors.push("At least one Action must have an APIEndpoint defined.");
      } else {
        apiEndpointLines.forEach((line, idx) => {
          const val = line.replace(/^\s*APIEndpoint:\s*/, "").trim();
          if (!val || val === "<API endpoint to call for action>") {
            errors.push(`Action ${idx + 1}: APIEndpoint cannot be empty.`);
          }
        });
      }

      // Check if Execution section exists
      if (!yamlLines.some(l => l.trim() === "Execution:")) {
        warnings.push("Execution section not found. Defaults will be applied.");
      }

      setIsCompiling(false);
      setCompileResult({ success: errors.length === 0, errors, warnings });

      // Auto-dismiss after 6 seconds
      setTimeout(() => setCompileResult(null), 6000);
    }, 1200);
  };

  const handleDeploy = async () => {
    // Guard: must compile first
    if (!compileResult) {
      toast({
        variant: "destructive",
        title: "Compile First",
        description: "Please compile your YAML workflow before deploying.",
      });
      return;
    }
    if (!compileResult.success) {
      toast({
        variant: "destructive",
        title: "Fix Errors First",
        description: "Compilation failed. Fix all errors before deploying.",
      });
      return;
    }

    // Extract WorkFlowName from yaml lines
    const nameLine = yamlLines.find(l => l.startsWith("Name:"));
    const workflowNameValue = nameLine ? nameLine.replace("Name:", "").trim() : "Untitled";
    const yamlString = yamlLines.join("\n");

    setIsDeploying(true);
    try {
      const resp = await fetch("/api/yaml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ WorkFlowName: workflowNameValue, YAML: yamlString }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Deploy failed");
      toast({
        title: "✅ Deployed Successfully",
        description: `Workflow "${workflowNameValue}" has been saved to the database.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Deploy Failed",
        description: err.message || "An error occurred while saving.",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Editor State
  const [yamlLines, setYamlLines] = useState<string[]>([
    `Name: <Workflow-Name>`,
    `Trigger:`,
    `  TriggerSourceContract: <Address of contract to listen for trigger event>`,
    `  TriggerChainID: <Chain ID where trigger contract is deployed>`,
    `  TriggerEventName: <Event name to trigger workflow>`,
    `  TriggerEventFilter: <Event filter for trigger>`,
    `  TriggerSourceContractABI: <ABI of trigger source contract>`,
    `  RecurringSourceContract: <Contract for recurring trigger>`,
    `  RecurringChainID: <Chain ID for recurring contract>`,
    `  RecurringEventName: <Event for recurring trigger>`,
    `  RecurringEventFilter: <Recurring event filter>`,
    `  RecurringSourceContractABI: <ABI for recurring contract>`,
    `  RepeatEvery: <Repeat trigger condition or interval>`,
    `  ExecuteAfter: <Condition to execute after>`,
    `  ExpiresIn: <Unix timestamp after which trigger expires>`,
    `  Meta: <Additional trigger info or comments>`,
    `  ActionStatusNotificationPOSTURL: <Notification URL for action status updates>`,
    `  ActionStatusNotificationAPIKey: <API key for notification endpoint>`,
    `Actions:`,
    `  - Name: <Action name>`,
    `    Type: <Type of action post/call/deploy>`,
    `    APIEndpoint: <API endpoint to call for action>`,
    `    APIPayload:`,
    `      <key1>: <value1>`,
    `      <key2>: <value2>`,
    `    TargetContract: <Target contract address for action>`,
    `    TargetFunction: <Function to call on contract>`,
    `    TargetParams:`,
    `      - <param1>`,
    `      - <param2>`,
    `    ChainID: <Target chain ID>`,
    `    EncodedABI: <Encoded ABI for contract call>`,
    `    Bytecode: <Bytecode if needed>`,
    `    Metadata: <Extra metadata for action>`,
    `    RetriesUntilSuccess: <Number of retries on failure>`,
    `Execution:`,
    `  Mode: <Workflow execution mode parallel/sequential>`
  ]);

  const generateYaml = () => {
    const lines = [
      `Name: ${workflowName || "My-New-Workflow"}`,
      `Trigger:`,
      `  ExecuteAfter: ${triggerData.executeAfter}`,
      `  RepeatEvery: ${triggerData.repeatEvery}`,
      `  ExpiresIn: ${triggerData.expiresIn}`,
      `  Meta: ${triggerData.meta}`,
      `  ActionStatusNotificationPOSTURL: ${triggerData.notificationUrl}`,
      `  ActionStatusNotificationAPIKey: ${triggerData.apiKey}`,
      `Actions:`,
    ];

    actions.forEach(action => {
      lines.push(`  - Name: ${action.name || "Untitled Action"}`);
      lines.push(`    Type: ${action.type}`);
      lines.push(`    APIEndpoint: ${action.endpoint}`);
      lines.push(`    APIPayload:`);
      try {
        const payloadObj = JSON.parse(action.payload);
        Object.entries(payloadObj).forEach(([key, val]) => {
          lines.push(`      ${key}: ${val}`);
        });
      } catch (e) {
        lines.push(`      data: ${action.payload}`);
      }
      lines.push(`    RetriesUntilSuccess: ${action.retries}`);
    });

    lines.push(`Execution:`);
    lines.push(`  Mode: ${executionMode}`);

    return lines;
  };

  const addAction = () => {
    if (actions.length < 6) {
      setActions([...actions, { id: Date.now(), name: "", type: "POST (API Call)", endpoint: "https://dev-api.kalp.network/webhook", payload: "{}", retries: "5" }]);
    } else {
      toast({
        title: "Limit Reached",
        description: "You can only add up to 6 actions.",
      });
    }
  };

  const removeAction = (id: number) => {
    if (actions.length > 1) {
      setActions(actions.filter(a => a.id !== id));
    }
  };

  const updateAction = (id: number, field: string, value: string) => {
    setActions(actions.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  useEffect(() => {
    if (isBuilderModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isBuilderModalOpen]);

  const handleNext = () => {
    if (currentStep === 1 && !workflowName.trim()) {
      toast({
        variant: "destructive",
        title: "Workflow Name Required",
        description: "Please enter a workflow name",
      });
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalize and Update Editor
      const newYaml = generateYaml();
      setYamlLines(newYaml);
      setIsBuilderModalOpen(false);
      setCurrentStep(1);
      toast({
        title: "Workflow Generated",
        description: "The YAML content has been updated based on your builder configuration.",
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };



  return (
    <div className="min-h-screen w-full bg-[#0B1120] text-white font-sans pb-20">
      <Navbar />

      {/* Floating Need Help Button */}
      <button className="fixed bottom-6 right-6 z-50 bg-[#2dd4bf] hover:bg-[#14b8a6] text-black font-semibold px-4 py-2.5 rounded-full flex items-center gap-2 shadow-lg transition-colors text-sm">
        <MessageSquare className="w-4 h-4" /> Need Help?
      </button>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pt-28 px-6">

        {/* Left Column - Editor */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-[#151B2B] border-slate-800/60 shadow-2xl overflow-hidden rounded-xl">
            <CardHeader className="flex flex-row justify-between items-center border-b border-slate-800/60 pb-4 bg-[#151B2B]">
              <div>
                <CardTitle className="text-xl font-bold text-white mb-1 tracking-tight">Workflow Editor</CardTitle>
                <p className="text-sm text-slate-400">Build your automation workflow with YAML</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="bg-[#0B1120] border-slate-700/50 text-slate-200 hover:bg-slate-800 hover:text-white h-9 px-4 rounded-lg font-medium">
                  <Upload className="w-4 h-4 mr-2" /> Import
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsBuilderModalOpen(true)}
                  className="bg-[#0B1120] border-slate-700/50 text-slate-200 hover:bg-slate-800 hover:text-white h-9 px-4 rounded-lg font-medium"
                >
                  <Settings className="w-4 h-4 mr-2" /> Workflow Builder
                </Button>
              </div>
            </CardHeader>
            <div className="bg-[#0D1117] flex flex-col">
              {/* Editor Header Bar */}
              <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-800/60 text-[11px] text-slate-400 bg-[#0D1117]">
                <div className="flex items-center gap-5">
                  <span className="font-semibold text-slate-300">YAML</span>
                  <span>Lines: {yamlLines.length}</span>
                  <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div> Editable</span>
                </div>
                <button className="hover:text-white transition-colors"><Copy className="w-4 h-4 text-slate-500" /></button>
              </div>

              {/* Editor Content Area */}
              <div className="p-4 font-mono text-[13px] leading-[1.6] overflow-x-auto overflow-y-auto max-h-[600px] bg-[#0D1117] flex scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {/* Line Numbers */}
                <div className="text-slate-600 select-none pr-4 text-right border-r border-slate-800/60 min-w-[2.5rem] opacity-60">
                  {yamlLines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Code Lines */}
                <div className="pl-4 whitespace-pre">
                  {yamlLines.map((line, i) => {
                    const colonIndex = line.indexOf(':');
                    if (colonIndex !== -1 && !line.trim().startsWith('-')) {
                      const key = line.substring(0, colonIndex + 1);
                      const value = line.substring(colonIndex + 1);
                      return (
                        <div key={i}>
                          <span className="text-[#f43f5e]">{key}</span>
                          <span className="text-slate-200">{value}</span>
                        </div>
                      );
                    } else if (line.trim().startsWith('- Name:')) {
                      const key = line.substring(0, line.indexOf(':') + 1);
                      const value = line.substring(line.indexOf(':') + 1);
                      return (
                        <div key={i}>
                          <span className="text-slate-300">- </span>
                          <span className="text-[#f43f5e]">{key.replace('- ', '')}</span>
                          <span className="text-slate-200">{value}</span>
                        </div>
                      );
                    } else if (line.trim().startsWith('-')) {
                      return <div key={i} className="text-slate-200">{line}</div>;
                    }
                    return <div key={i} className="text-[#f43f5e]">{line}</div>;
                  })}
                </div>
              </div>

              {/* Editor Footer Actions */}
              <div className="flex justify-end gap-3 p-4 bg-[#151B2B] border-t border-slate-800/60">
                <Button className="bg-[#2563eb] hover:bg-blue-600 text-white shadow-sm gap-2 h-9 px-5 rounded-md font-medium border border-blue-500/20">
                  <Save className="w-4 h-4" /> Save
                </Button>
                <Button
                  onClick={handleCompile}
                  disabled={isCompiling}
                  className="bg-[#0B1120] hover:bg-slate-800 border border-slate-700/50 text-slate-200 shadow-sm gap-2 h-9 px-5 rounded-md font-medium disabled:opacity-60"
                >
                  {isCompiling ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Play className="w-4 h-4 text-slate-400" />}
                  {isCompiling ? "Compiling..." : "Compile"}
                </Button>
                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying || !compileResult?.success}
                  className="bg-[#6366f1] hover:bg-indigo-500 text-white shadow-sm gap-2 h-9 px-5 rounded-md font-medium border border-indigo-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!compileResult?.success ? "Compile successfully before deploying" : ""}
                >
                  {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {isDeploying ? "Deploying..." : "Deploy"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-[#151B2B] border-slate-800/60 shadow-xl overflow-hidden rounded-xl h-40">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold text-white tracking-tight">Workflow Information</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Validation Card */}
          <Card className="bg-[#151B2B] border-slate-800/60 shadow-xl rounded-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold text-white mb-1 tracking-tight">Validation</CardTitle>
              <p className="text-sm text-slate-400">Real-time workflow validation</p>
            </CardHeader>
            <CardContent className="mx-4 mb-4">
              {isCompiling ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-[#192033]/50 rounded-lg border border-slate-800/50">
                  <Loader2 className="w-10 h-10 text-blue-400 mb-4 animate-spin" />
                  <p className="text-[13px] text-blue-300 font-medium">Compiling YAML...</p>
                  <p className="text-[11px] text-slate-500 mt-1">Checking syntax and schema</p>
                </div>
              ) : compileResult ? (
                <div className={cn(
                  "rounded-lg border p-4 space-y-3",
                  compileResult.success ? "bg-green-950/30 border-green-800/50" : "bg-red-950/30 border-red-800/50"
                )}>
                  <div className="flex items-center gap-2">
                    {compileResult.success
                      ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                      : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    }
                    <p className={cn("text-[13px] font-bold", compileResult.success ? "text-green-300" : "text-red-300")}>
                      {compileResult.success ? "Compilation Successful" : "Compilation Failed"}
                    </p>
                  </div>
                  {compileResult.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-red-300">{e}</p>
                    </div>
                  ))}
                  {compileResult.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-yellow-300">{w}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-[#192033]/50 rounded-lg border border-slate-800/50">
                  <Play className="w-12 h-12 text-slate-600 mb-5 opacity-40" strokeWidth={1} />
                  <p className="text-[13px] text-slate-400 mb-1">Click Compile to validate your workflow</p>
                  <p className="text-[11px] text-slate-500">Get syntax and schema validation from the API</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-[#151B2B] border-slate-800/60 shadow-xl rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-white tracking-tight">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-[#0D1117] border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 h-11 font-medium rounded-lg shadow-sm">
                <Upload className="w-4 h-4 mr-3 text-slate-400" /> Import from File
              </Button>
              <Button variant="outline" className="w-full justify-start bg-[#0D1117] border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 h-11 font-medium rounded-lg shadow-sm">
                <Settings className="w-4 h-4 mr-3 text-slate-400" /> Configure Keys
              </Button>
              <Button variant="outline" className="w-full justify-start bg-[#0D1117] border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 h-11 font-medium rounded-lg shadow-sm">
                <FileText className="w-4 h-4 mr-3 text-slate-400" /> View Documentation
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Compile Result Popup - Bottom Right */}
      {compileResult && !isCompiling && (
        <div className="fixed bottom-20 right-6 z-[200] w-80 animate-in slide-in-from-right-5 duration-300">
          <div className={cn(
            "rounded-xl border shadow-2xl p-4",
            compileResult.success
              ? "bg-[#0d2118] border-green-800/60"
              : "bg-[#1e0a0a] border-red-800/60"
          )}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {compileResult.success
                  ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                }
                <p className={cn("text-[14px] font-bold", compileResult.success ? "text-green-300" : "text-red-300")}>
                  {compileResult.success ? "✓ Compilation Successful" : "✗ Compilation Failed"}
                </p>
              </div>
              <button onClick={() => setCompileResult(null)} className="text-slate-500 hover:text-white transition-colors ml-2 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {compileResult.errors.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {compileResult.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-red-300 leading-snug">{e}</p>
                  </div>
                ))}
              </div>
            )}

            {compileResult.warnings.length > 0 && (
              <div className="space-y-1.5">
                {compileResult.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-yellow-300 leading-snug">{w}</p>
                  </div>
                ))}
              </div>
            )}

            {compileResult.success && (
              <p className="text-[12px] text-green-400/70 mt-2">All required fields are present. Ready to deploy.</p>
            )}
          </div>
        </div>
      )}

      {/* Workflow Builder Modal */}
      {isBuilderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0e0e11] w-full max-w-4xl max-h-[90vh] rounded-xl border border-slate-800/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/60 relative shrink-0">
              <button
                onClick={() => setIsBuilderModalOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Create New Workflow</h2>
              <p className="text-[13px] text-slate-400 mb-6">
                Build your workflow step by step using this form-based interface. Configure triggers, actions, and execution settings.
              </p>

              {/* Tabs */}
              <div className="flex bg-[#18181b] rounded-lg p-1.5 border border-slate-800/40">
                {[
                  { id: 1, label: "Basic Info" },
                  { id: 2, label: "Trigger" },
                  { id: 3, label: "Actions" },
                  { id: 4, label: "Execution" },
                ].map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex-1 text-center py-2 text-[13px] font-semibold rounded-md transition-all",
                      currentStep === step.id
                        ? "bg-[#27272a] text-slate-200 shadow-sm border border-slate-700/50"
                        : "text-slate-500"
                    )}
                  >
                    {step.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div
              className="flex-1 overflow-y-auto p-6 bg-[#09090b] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
            >
              <div className="border border-slate-800/60 rounded-xl p-6 bg-[#0e0e11] min-h-full">
                {currentStep === 1 && (
                  <>
                    <h3 className="text-xl font-bold text-white mb-8 tracking-tight">Workflow Information (Step 1 of 4)</h3>
                    <div className="space-y-3">
                      <label className="text-[13px] font-bold text-white block">Workflow Name *</label>
                      <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        placeholder="Enter workflow name"
                        className="w-full bg-[#09090b] border border-slate-800/80 rounded-md p-3.5 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Trigger Configuration (Step 2 of 4)</h3>

                    {/* Execution Settings Card */}
                    <div className="bg-[#151B2B] border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                      <div className="flex items-center gap-2 mb-6">
                        <Zap className="w-4 h-4 text-green-500" fill="currentColor" />
                        <h4 className="text-sm font-semibold text-green-500 uppercase tracking-wider">Execution Settings</h4>
                      </div>
                      <div className="h-[1px] bg-slate-800 w-full mb-6"></div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-white block">Execute After *</label>
                          <div className="relative group">
                            <select
                              value={triggerData.executeAfter}
                              onChange={(e) => setTriggerData({ ...triggerData, executeAfter: e.target.value })}
                              className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3.5 text-[13px] text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                            >
                              <option>Immediate</option>
                              <option>Timestamp</option>
                              <option>Event</option>
                              <option>Address Tracking</option>
                              <option>Oracle Price</option>
                              <option>Block Number</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-white block">Repeat Every *</label>
                          <div className="relative">
                            <select
                              value={triggerData.repeatEvery}
                              onChange={(e) => setTriggerData({ ...triggerData, repeatEvery: e.target.value })}
                              className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3.5 text-[13px] text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                            >
                              <option>NA</option>
                              <option>Daily</option>
                              <option>Weekly</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-white block">Expires In *</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={triggerData.expiresIn}
                              onChange={(e) => setTriggerData({ ...triggerData, expiresIn: e.target.value })}
                              className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3.5 text-[13px] text-white focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-white block">Meta</label>
                          <input
                            type="text"
                            value={triggerData.meta}
                            onChange={(e) => setTriggerData({ ...triggerData, meta: e.target.value })}
                            className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3.5 text-[13px] text-white focus:outline-none focus:border-blue-500/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trigger Source Configuration Card — appears when Execute After is set */}
                    {triggerData.executeAfter !== "Immediate" && (
                      <div className="bg-[#151B2B] border border-slate-800 rounded-xl p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-rose-400" />
                          <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Trigger Source Configuration</h4>
                        </div>
                        <div className="h-[1px] bg-slate-800 w-full"></div>

                        {/* Contract + Chain ID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[13px] font-bold text-white block">Trigger Source Contract *</label>
                            <input
                              type="text"
                              value={triggerSourceData.contract}
                              onChange={(e) => setTriggerSourceData({ ...triggerSourceData, contract: e.target.value })}
                              placeholder="0xb7cf7ab91c847e529a438f3620c5b58b5f37aeb..."
                              className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[13px] font-bold text-white block">Trigger Chain ID</label>
                            <div className="relative">
                              <select
                                value={triggerSourceData.chainId}
                                onChange={(e) => setTriggerSourceData({ ...triggerSourceData, chainId: e.target.value })}
                                className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-white appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer"
                              >
                                <option value="">Select trigger chain...</option>
                                <option value="1">Ethereum Mainnet (1)</option>
                                <option value="137">Polygon (137)</option>
                                <option value="56">BNB Chain (56)</option>
                                <option value="42161">Arbitrum One (42161)</option>
                                <option value="10">Optimism (10)</option>
                                <option value="8453">Base (8453)</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Smart Contract */}
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-white block">Smart Contract <span className="text-slate-500 font-normal">(Optional)</span></label>
                          <textarea
                            value={triggerSourceData.smartContract}
                            onChange={(e) => setTriggerSourceData({ ...triggerSourceData, smartContract: e.target.value })}
                            rows={5}
                            placeholder="Paste Solidity contract code or upload .sol file"
                            className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-slate-400 font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
                          />
                          <button className="flex items-center gap-2 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-[13px] font-medium px-4 py-2.5 rounded-lg transition-all">
                            <Upload className="w-4 h-4" /> Upload .sol
                          </button>
                        </div>

                        {/* ABI */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-[13px] font-bold text-white block">Trigger Source Contract ABI</label>
                            <span className="text-[11px] font-semibold bg-slate-700/60 border border-slate-600/50 text-slate-300 px-2 py-0.5 rounded-full">Default</span>
                          </div>
                          <textarea
                            value={triggerSourceData.abi}
                            onChange={(e) => setTriggerSourceData({ ...triggerSourceData, abi: e.target.value })}
                            rows={4}
                            className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-slate-300 font-mono focus:outline-none focus:border-blue-500/50 resize-none"
                          />
                        </div>

                        {/* Event Name + Filter */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[13px] font-bold text-white block">Trigger Event Signature</label>
                            <input
                              type="text"
                              value={triggerSourceData.eventName}
                              onChange={(e) => setTriggerSourceData({ ...triggerSourceData, eventName: e.target.value })}
                              placeholder="e.g. Transfer(address,address,uint256)"
                              className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[13px] font-bold text-white block">Latest Block Number</label>
                            <input
                              type="text"
                              value={triggerSourceData.eventFilter}
                              onChange={(e) => setTriggerSourceData({ ...triggerSourceData, eventFilter: e.target.value })}
                              placeholder="e.g. 19500000"
                              className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notification Settings Card */}
                    <div className="bg-[#151B2B] border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                      <div className="flex items-center gap-2 mb-6">
                        <Bell className="w-4 h-4 text-orange-400" fill="currentColor" />
                        <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Notification Settings</h4>
                      </div>
                      <div className="h-[1px] bg-slate-800 w-full mb-6"></div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-white block">Action Status Notification POST URL</label>
                          <input
                            type="text"
                            value={triggerData.notificationUrl}
                            onChange={(e) => setTriggerData({ ...triggerData, notificationUrl: e.target.value })}
                            className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3.5 text-[13px] text-white focus:outline-none focus:border-blue-500/50 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-white block">Action Status Notification API Key</label>
                          <input
                            type="text"
                            value={triggerData.apiKey}
                            onChange={(e) => setTriggerData({ ...triggerData, apiKey: e.target.value })}
                            className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3.5 text-[13px] text-white focus:outline-none focus:border-blue-500/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-white tracking-tight">Actions ({actions.length}/10)</h3>
                      <Button
                        onClick={addAction}
                        className="bg-[#2196f3] hover:bg-[#1e88e5] text-white text-xs font-bold gap-2 px-4 h-9 rounded-lg shadow-md"
                      >
                        <Plus className="w-4 h-4" /> Add Action
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {actions.map((action, index) => (
                        <div key={action.id} className="bg-[#0e0e11] border border-slate-800 rounded-xl relative overflow-hidden flex">
                          {/* Blue Accent Line */}
                          <div className="w-[4px] bg-[#3b82f6] shrink-0"></div>

                          <div className="flex-1 p-6 space-y-6">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-bold text-white tracking-tight">Action {index + 1}</h4>
                              <button
                                onClick={() => removeAction(action.id)}
                                className="text-red-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[13px] font-bold text-white block">Action Name *</label>
                                <input
                                  type="text"
                                  value={action.name}
                                  onChange={(e) => updateAction(action.id, 'name', e.target.value)}
                                  placeholder="Enter action name"
                                  className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[13px] font-bold text-white block">Action Type *</label>
                                <div className="relative">
                                  <select
                                    value={action.type}
                                    onChange={(e) => updateAction(action.id, 'type', e.target.value)}
                                    className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-white appearance-none focus:outline-none focus:border-blue-500/50 cursor-pointer"
                                  >
                                    <option>POST (API Call)</option>
                                    <option>CALL (Smart Contract)</option>
                                    <option>Deploy (Smart Contract)</option>
                                  </select>
                                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[13px] font-bold text-white block">API Endpoint *</label>
                              <input
                                type="text"
                                value={action.endpoint}
                                onChange={(e) => updateAction(action.id, 'endpoint', e.target.value)}
                                className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[13px] font-bold text-white block">API Payload (JSON) *</label>
                              <textarea
                                value={action.payload}
                                onChange={(e) => updateAction(action.id, 'payload', e.target.value)}
                                rows={4}
                                className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-white font-mono focus:outline-none focus:border-blue-500/50 resize-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[13px] font-bold text-white block">Retries Until Success *</label>
                              <input
                                type="text"
                                value={action.retries}
                                onChange={(e) => updateAction(action.id, 'retries', e.target.value)}
                                className="w-full bg-[#09090b] border border-slate-800 rounded-md p-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white mb-8 tracking-tight">Execution Settings (Step 4 of 4)</h3>
                    <div className="space-y-4">
                      <div
                        onClick={() => setExecutionMode("Sequential")}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                          executionMode === "Sequential" ? "bg-[#18181b] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "bg-[#09090b] border-slate-800 hover:border-slate-700"
                        )}
                      >
                        <div className={cn("w-4 h-4 rounded-full border-2", executionMode === "Sequential" ? "border-blue-500 bg-blue-500" : "border-slate-700")}></div>
                        <div>
                          <p className="text-sm font-bold text-white">Sequential Mode</p>
                          <p className="text-xs text-slate-500">Actions are executed one after another</p>
                        </div>
                      </div>
                      <div
                        onClick={() => setExecutionMode("Parallel")}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                          executionMode === "Parallel" ? "bg-[#18181b] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "bg-[#09090b] border-slate-800 hover:border-slate-700"
                        )}
                      >
                        <div className={cn("w-4 h-4 rounded-full border-2", executionMode === "Parallel" ? "border-blue-500 bg-blue-500" : "border-slate-700")}></div>
                        <div>
                          <p className="text-sm font-bold text-white">Parallel Mode</p>
                          <p className="text-xs text-slate-500">All actions are executed simultaneously</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-800/60 flex justify-between items-center bg-[#0e0e11] shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsBuilderModalOpen(false)}
                className="bg-[#09090b] border-slate-800 text-white hover:bg-slate-800 hover:text-white h-10 px-6 rounded-lg font-medium"
              >
                Cancel
              </Button>
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="bg-[#09090b] border-slate-800 text-white hover:bg-slate-800 h-10 px-6 rounded-lg font-medium"
                  >
                    Previous
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="bg-[#2196f3] hover:bg-[#1e88e5] text-white h-10 px-8 rounded-lg font-semibold shadow-md"
                >
                  {currentStep === 4 ? "Finish" : "Next"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
