import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Copy, Check, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface YamlGeneratorProps {
    onBack: () => void;
}

interface Action {
    name: string;
    type: string;
    apiEndpoint: string;
    apiPayload: string; // JSON string for simplicity in editing
    targetContract: string;
    targetFunction: string;
    targetParams: string;
    chainId: string;
    encodedABI: string;
    bytecode: string;
    metadata: string;
    retriesUntilSuccess: number;
}

export function YamlGenerator({ onBack }: YamlGeneratorProps) {
    const [formData, setFormData] = useState({
        name: "UpdateWeatherReport_v2",
        trigger: {
            triggerSourceContract: "NA",
            triggerChainID: "NA",
            triggerEventName: "NA",
            triggerEventFilter: "NA",
            triggerSourceContractABI: "NA",
            triggerPrice: "NA",
            recurringSourceContract: "NA",
            recurringChainID: "NA",
            recurringEventName: "NA",
            recurringEventFilter: "NA",
            recurringSourceContractABI: "NA",
            recurringPrice: "NA",
            repeatEvery: "1h",
            executeAfter: "1762484400",
            expiresIn: "1762560000",
            meta: "NA",
            actionStatusNotificationPOSTURL: "https://workflow-notification-test.kalp.network/push_notification",
            actionStatusNotificationAPIKey: "NA"
        },
        execution: {
            mode: "parallel"
        }
    });

    const [actions, setActions] = useState<Action[]>([
        {
            name: "apicall",
            type: "post",
            apiEndpoint: "https://earthclaim1.onrender.com/api/UpdateallCoordinates/WeatherReport",
            apiPayload: '{\n  "msg": "run"\n}',
            targetContract: "NA",
            targetFunction: "NA",
            targetParams: "",
            chainId: "NA",
            encodedABI: "NA",
            bytecode: "NA",
            metadata: "NA",
            retriesUntilSuccess: 5
        }
    ]);

    const [yamlOutput, setYamlOutput] = useState("");
    const [copied, setCopied] = useState(false);

    // Handle Trigger and Top-level changes
    const handleTriggerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "name") {
            setFormData(prev => ({ ...prev, name: value }));
        } else if (name === "mode") {
            setFormData(prev => ({ ...prev, execution: { ...prev.execution, mode: value } }));
        } else {
            setFormData(prev => ({ ...prev, trigger: { ...prev.trigger, [name]: value } }));
        }
    };

    // Handle Actions changes
    const handleActionChange = (index: number, field: keyof Action, value: string | number) => {
        const newActions = [...actions];
        if (field === "retriesUntilSuccess") {
            newActions[index] = { ...newActions[index], [field]: Number(value) };
        } else {
            newActions[index] = { ...newActions[index], [field]: value };
        }
        setActions(newActions);
    };

    const addAction = () => {
        setActions(prev => [...prev, {
            name: "",
            type: "post",
            apiEndpoint: "",
            apiPayload: "{}",
            targetContract: "NA",
            targetFunction: "NA",
            targetParams: "",
            chainId: "NA",
            encodedABI: "NA",
            bytecode: "NA",
            metadata: "NA",
            retriesUntilSuccess: 3
        }]);
    };

    const removeAction = (index: number) => {
        setActions(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const actionsYaml = actions.map(action => {
            // Indent payload lines
            const payloadLines = action.apiPayload.split('\n').map(line => `      ${line}`).join('\n').trim();
            let payloadBlock = "";
            try {
                // Attempt to verify if it's valid JSON to format nicely, otherwise just dump string
                const parsed = JSON.parse(action.apiPayload);
                // Simple object to YAML-ish usually just keys
                payloadBlock = Object.entries(parsed).map(([k, v]) => `      ${k}: ${v}`).join('\n');
            } catch (e) {
                payloadBlock = `      ${action.apiPayload.replace(/\n/g, '\n      ')}`;
            }

            return `  - Name: ${action.name}
    Type: ${action.type}
    APIEndpoint: ${action.apiEndpoint}
    APIPayload:
${payloadBlock}
    TargetContract: ${action.targetContract}
    TargetFunction: ${action.targetFunction}
    TargetParams: ${action.targetParams || ""}
    ChainID: ${action.chainId}
    EncodedABI: ${action.encodedABI}
    Bytecode: ${action.bytecode}
    Metadata: ${action.metadata}
    RetriesUntilSuccess: ${action.retriesUntilSuccess}`;
        }).join('\n');

        const yaml = `Name: ${formData.name}
Trigger:
  TriggerSourceContract: ${formData.trigger.triggerSourceContract}
  TriggerChainID: ${formData.trigger.triggerChainID}
  TriggerEventName: ${formData.trigger.triggerEventName}
  TriggerEventFilter: ${formData.trigger.triggerEventFilter}
  TriggerSourceContractABI: ${formData.trigger.triggerSourceContractABI}
  TriggerPrice: ${formData.trigger.triggerPrice}
  RecurringSourceContract: ${formData.trigger.recurringSourceContract}
  RecurringChainID: ${formData.trigger.recurringChainID}
  RecurringEventName: ${formData.trigger.recurringEventName}
  RecurringEventFilter: ${formData.trigger.recurringEventFilter}
  RecurringSourceContractABI: ${formData.trigger.recurringSourceContractABI}
  RecurringPrice: ${formData.trigger.recurringPrice}
  RepeatEvery: ${formData.trigger.repeatEvery}
  ExecuteAfter: ${formData.trigger.executeAfter}
  ExpiresIn: ${formData.trigger.expiresIn}
  Meta: ${formData.trigger.meta}
  ActionStatusNotificationPOSTURL: ${formData.trigger.actionStatusNotificationPOSTURL}
  ActionStatusNotificationAPIKey: ${formData.trigger.actionStatusNotificationAPIKey}
Actions:
${actionsYaml}
Execution:
  Mode: ${formData.execution.mode}
`;
        setYamlOutput(yaml);
    }, [formData, actions]);

    const handleCopy = () => {
        navigator.clipboard.writeText(yamlOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="p-0 hover:bg-transparent text-gray-400 hover:text-white" onClick={onBack}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Workflow Editor</h2>
                    <p className="text-gray-400">Build your automation workflow with YAML</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Side */}
                <div className="space-y-6 h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                    <Card className="bg-gray-900 border-gray-700">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-semibold mb-4">Trigger Configuration</h3>

                            <div className="space-y-2">
                                <Label>Workflow Name</Label>
                                <Input name="name" value={formData.name} onChange={handleTriggerChange} className="bg-gray-800 border-gray-600" />
                            </div>

                            <Separator className="bg-gray-700 my-4" />
                            <h4 className="text-sm font-medium text-gray-400">Recurring Settings</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Repeat Every</Label>
                                    <Input name="repeatEvery" value={formData.trigger.repeatEvery} onChange={handleTriggerChange} className="bg-gray-800 border-gray-600" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Execute After</Label>
                                    <Input name="executeAfter" value={formData.trigger.executeAfter} onChange={handleTriggerChange} className="bg-gray-800 border-gray-600" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expires In</Label>
                                    <Input name="expiresIn" value={formData.trigger.expiresIn} onChange={handleTriggerChange} className="bg-gray-800 border-gray-600" />
                                </div>
                            </div>

                            <Separator className="bg-gray-700 my-4" />
                            <div className="space-y-2">
                                <Label>Notification POST URL</Label>
                                <Input name="actionStatusNotificationPOSTURL" value={formData.trigger.actionStatusNotificationPOSTURL} onChange={handleTriggerChange} className="bg-gray-800 border-gray-600" />
                            </div>
                            <div className="space-y-2">
                                <Label>Notification API Key</Label>
                                <Input name="actionStatusNotificationAPIKey" value={formData.trigger.actionStatusNotificationAPIKey} onChange={handleTriggerChange} className="bg-gray-800 border-gray-600" />
                            </div>

                            <div className="space-y-2 mt-4">
                                <Label>Execution Mode</Label>
                                <Input name="mode" value={formData.execution.mode} onChange={handleTriggerChange} className="bg-gray-800 border-gray-600" />
                            </div>

                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Actions</h3>
                        <Button size="sm" onClick={addAction} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" /> Add Action</Button>
                    </div>

                    {actions.map((action, index) => (
                        <Card key={index} className="bg-gray-900 border-gray-700">
                            <CardContent className="p-6 space-y-4 relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    onClick={() => removeAction(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <h4 className="font-semibold text-blue-400">Action #{index + 1}</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input value={action.name} onChange={(e) => handleActionChange(index, "name", e.target.value)} className="bg-gray-800 border-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select
                                            value={action.type}
                                            onChange={(e) => handleActionChange(index, "type", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="POST">POST (API Call)</option>
                                            <option value="CALL">CALL (Smart Contract)</option>
                                            <option value="DEPLOY">Deploy (Smart Contract)</option>
                                        </select>
                                    </div>                 </div>

                                <div className="space-y-2">
                                    <Label>API Endpoint</Label>
                                    <Input value={action.apiEndpoint} onChange={(e) => handleActionChange(index, "apiEndpoint", e.target.value)} className="bg-gray-800 border-gray-600" />
                                </div>

                                <div className="space-y-2">
                                    <Label>API Payload (JSON)</Label>
                                    <Textarea
                                        value={action.apiPayload}
                                        onChange={(e) => handleActionChange(index, "apiPayload", e.target.value)}
                                        className="bg-gray-800 border-gray-600 font-mono text-xs min-h-[100px]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Target Contract</Label>
                                        <Input value={action.targetContract} onChange={(e) => handleActionChange(index, "targetContract", e.target.value)} className="bg-gray-800 border-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target Function</Label>
                                        <Input value={action.targetFunction} onChange={(e) => handleActionChange(index, "targetFunction", e.target.value)} className="bg-gray-800 border-gray-600" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Retries</Label>
                                    <Input type="number" value={action.retriesUntilSuccess} onChange={(e) => handleActionChange(index, "retriesUntilSuccess", e.target.value)} className="bg-gray-800 border-gray-600" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* YAML Output Side */}
                <div className="flex flex-col h-[80vh]">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-t-lg border-t border-x border-gray-700">YAML Preview</div>
                        <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs border-gray-600 hover:bg-gray-800">
                            {copied ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy YAML</>}
                        </Button>
                    </div>
                    <div className="flex-1 bg-[#0d1117] border border-gray-700 rounded-b-lg rounded-tr-lg p-4 font-mono text-sm overflow-auto text-green-400 shadow-inner">
                        <pre>{yamlOutput}</pre>
                    </div>

                    <div className="flex gap-4 mt-4">
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Save Workflow</Button>
                        <Button variant="secondary" className="flex-1">Deploy</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
