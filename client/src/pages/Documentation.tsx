import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import { ChevronRight, FileText, Code, Server, Hash, Zap, Search, Box, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Data Structure ---
const docSections = [
    {
        id: "overview",
        title: "Overview",
        items: [
            { id: "introduction", title: "Introduction" },
            { id: "architecture", title: "Architecture" },
            { id: "features", title: "Key Features" },
        ]
    },
    {
        id: "getting-started",
        title: "Getting Started",
        items: [
            { id: "prerequisites", title: "Prerequisites" },
            { id: "installation", title: "Installation" },
            { id: "configuration", title: "Configuration" },
        ]
    },
    {
        id: "workflows",
        title: "Workflows",
        items: [
            { id: "creating-workflows", title: "Creating Workflows" },
            { id: "yaml-config", title: "YAML Configuration" },
        ]
    },
    {
        id: "api-reference",
        title: "API Reference",
        items: [
            { id: "api-listen", title: "Real-time Stream" },
            { id: "api-subscriptions", title: "Subscriptions" },
            { id: "api-price-alerts", title: "Price Alerts" },
        ]
    },
];

export default function Documentation() {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
    const y2 = useTransform(scrollY, [0, 1000], [0, -150]);

    const [activeSection, setActiveSection] = useState("introduction");

    // Smooth scroll to section
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // Header height + padding
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveSection(id);
        }
    };

    // Update active section on scroll
    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll("section[id]");
            let current = "";
            sections.forEach((section) => {
                const sectionTop = section.getBoundingClientRect().top;
                if (sectionTop < 150) {
                    current = section.getAttribute("id") || "";
                }
            });
            if (current) setActiveSection(current);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30">
            <Navbar />

            {/* Background Parallax Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <motion.div
                    style={{ y: y1 }}
                    className="absolute top-[10%] left-[5%] w-[30vw] h-[30vw] rounded-full bg-indigo-500/5 blur-[120px]"
                />
                <motion.div
                    style={{ y: y2 }}
                    className="absolute top-[40%] right-[5%] w-[25vw] h-[25vw] rounded-full bg-purple-500/5 blur-[120px]"
                />
            </div>

            <div className="container mx-auto px-4 pt-28 pb-12 relative z-10 flex items-start gap-12">

                {/* --- Left Sidebar (Navigation) --- */}
                <aside className="w-64 shrink-0 hidden lg:block sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="mb-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            className="w-full bg-white/5 border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                    </div>

                    <div className="space-y-8">
                        {docSections.map((section) => (
                            <div key={section.id}>
                                <h4 className="text-sm font-semibold text-white mb-3 tracking-wider uppercase opacity-80 pl-3 border-l-2 border-transparent">
                                    {section.title}
                                </h4>
                                <ul className="space-y-1">
                                    {section.items.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => scrollToSection(item.id)}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 border-l-2",
                                                    activeSection === item.id
                                                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500"
                                                        : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                                                )}
                                            >
                                                {item.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* --- Main Content --- */}
                <main className="flex-1 min-w-0">
                    <div className="prose prose-invert max-w-none">

                        {/* Introduction */}
                        <section id="introduction" className="mb-16 scroll-mt-28">
                            <div className="flex items-center gap-2 text-indigo-400 mb-4">
                                <FileText className="w-5 h-5" />
                                <span className="text-sm font-medium uppercase tracking-wider">Doc Overview</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6">
                                Introduction
                            </h1>
                            <p className="text-xl text-gray-300 leading-relaxed mb-8">
                                KwalaFilter is a comprehensive decentralized event listening and automation platform. It empowers developers to monitor blockchain events in real-time and trigger automated workflows, bridging the gap between on-chain activity and off-chain actions.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 not-prose">
                                <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors">
                                    <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">Real-Time</h3>
                                    <p className="text-gray-400 text-sm">Sub-second latency event streaming via WebSocket/SSE.</p>
                                </div>
                                <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors">
                                    <Box className="w-8 h-8 text-blue-400 mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">Workflow Builder</h3>
                                    <p className="text-gray-400 text-sm">Create automation logic using simple YAML configurations.</p>
                                </div>
                            </div>
                        </section>

                        {/* Architecture */}
                        <section id="architecture" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                <Hash className="w-6 h-6 text-indigo-500" />
                                Architecture
                            </h2>
                            <p className="text-gray-300 mb-6">
                                KwalaFilter operates on a robust architecture designed for reliability and scalability.
                            </p>
                            <div className="p-4 rounded-lg bg-black/40 border border-white/10 font-mono text-sm text-gray-300 overflow-x-auto">
                                <div className="flex items-center justify-between min-w-[600px]">
                                    <div className="text-center">
                                        <div className="text-purple-400 font-bold mb-2">Blockchain</div>
                                        <div className="text-xs text-gray-500">RPC Nodes (Sepolia/Mainnet)</div>
                                    </div>
                                    <div className="text-gray-500">→</div>
                                    <div className="text-center">
                                        <div className="text-blue-400 font-bold mb-2">Event Engine</div>
                                        <div className="text-xs text-gray-500">Polls & Listens (ogl/ethers)</div>
                                    </div>
                                    <div className="text-gray-500">→</div>
                                    <div className="text-center">
                                        <div className="text-green-400 font-bold mb-2">API Gateway</div>
                                        <div className="text-xs text-gray-500">REST & SSE Endpoints</div>
                                    </div>
                                    <div className="text-gray-500">→</div>
                                    <div className="text-center">
                                        <div className="text-yellow-400 font-bold mb-2">Client</div>
                                        <div className="text-xs text-gray-500">Dashboard & Webhooks</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Features */}
                        <section id="features" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                <Activity className="w-6 h-6 text-indigo-500" />
                                Key Features
                            </h2>
                            <ul className="space-y-4 text-gray-300 list-disc pl-5">
                                <li><strong>Event Monitoring:</strong> Track smart contract events (logs) in real-time.</li>
                                <li><strong>Historical Backfill:</strong> Automatically catch up on missed blocks.</li>
                                <li><strong>Price Alerts:</strong> Trigger actions based on token price movements.</li>
                                <li><strong>Custom Workflows:</strong> Define logic using YAML to automate tasks (e.g., Webhooks, Database updates).</li>
                                <li><strong>Billing Integration:</strong> Built-in mechanism to charge users for service usage.</li>
                            </ul>
                        </section>

                        {/* Prerequisites */}
                        <section id="prerequisites" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6">Prerequisites</h2>
                            <p className="text-gray-300 mb-4">Before running KwalaFilter, ensure you have:</p>
                            <ul className="list-disc pl-5 text-gray-300 space-y-2">
                                <li>Node.js v16+ installed.</li>
                                <li>A Supabase project for database persistence.</li>
                                <li>An RPC URL (e.g., Alchemy/Infura) for the chains you want to monitor.</li>
                            </ul>
                        </section>

                        {/* Installation */}
                        <section id="installation" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6">Installation</h2>
                            <p className="text-gray-300 mb-4">Clone the repository and install dependencies:</p>
                            <pre className="bg-[#111] p-4 rounded-lg border border-white/10 text-gray-300 overflow-x-auto">
                                <code>
                                    {`git clone https://github.com/your-repo/kwalafilter.git
cd kwalafilter
npm install`}
                                </code>
                            </pre>
                        </section>

                        {/* Configuration */}
                        <section id="configuration" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6">Configuration</h2>
                            <p className="text-gray-300 mb-4">Create a <code>.env</code> file in the root directory with the following variables:</p>
                            <pre className="bg-[#111] p-4 rounded-lg border border-white/10 text-gray-300 overflow-x-auto">
                                <code>
                                    {`RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_KEY
PORT=5000`}
                                </code>
                            </pre>
                        </section>

                        {/* Creating Workflows */}
                        <section id="creating-workflows" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6">Creating Workflows</h2>
                            <p className="text-gray-300 mb-4">
                                Workflows allow you to define what happens when an event is detected. You can configure them via the Dashboard or by importing a YAML file.
                            </p>
                            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
                                <p className="text-sm text-blue-300">
                                    <strong>Tip:</strong> Use the "Import YAML" feature in the dashboard for bulk configuration.
                                </p>
                            </div>
                        </section>

                        {/* YAML Config */}
                        <section id="yaml-config" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6">YAML Configuration</h2>
                            <p className="text-gray-300 mb-4">Example structure for a subscription workflow:</p>
                            <pre className="bg-[#111] p-4 rounded-lg border border-white/10 text-gray-300 overflow-x-auto">
                                <code>
                                    {`name: MyEventWorkflow
address: "0x123..."
topic0: "0xabc..."
actions:
  - type: webhook
    url: "https://api.myapp.com/events"
    method: "POST"`}
                                </code>
                            </pre>
                        </section>

                        {/* API: Listen */}
                        <section id="api-listen" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                <Code className="w-6 h-6 text-indigo-500" />
                                GET /listen
                            </h2>
                            <p className="text-gray-300 mb-6">
                                Stream logs in real-time using Server-Sent Events (SSE).
                            </p>
                            <div className="space-y-4">
                                <div className="bg-[#111] rounded-xl border border-white/10 p-4">
                                    <div className="text-sm text-gray-400 mb-2 font-mono">Query Parameters</div>
                                    <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
                                        <li><code>address</code>: Contract address to listen to.</li>
                                        <li><code>topic0</code>: Event signature hash.</li>
                                        <li><code>abi</code>: Base64 encoded JSON ABI of the event.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* API: Subscriptions */}
                        <section id="api-subscriptions" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                <Code className="w-6 h-6 text-indigo-500" />
                                POST /api/subscriptions
                            </h2>
                            <p className="text-gray-300 mb-6">
                                Save a new event subscription to the database.
                            </p>
                            <pre className="bg-[#111] p-4 rounded-lg border border-white/10 text-gray-300 overflow-x-auto">
                                <code>
                                    {`{
  "address": "0x...",
  "topic0": "0x...",
  "api": "https://callback.url",
  "ActionName": "MyAlert"
}`}
                                </code>
                            </pre>
                        </section>

                        {/* API: Price Alerts */}
                        <section id="api-price-alerts" className="mb-16 scroll-mt-28">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                <Code className="w-6 h-6 text-indigo-500" />
                                POST /api/price-alerts
                            </h2>
                            <p className="text-gray-300 mb-6">
                                Create an alert that triggers when a token price hits a target.
                            </p>
                            <pre className="bg-[#111] p-4 rounded-lg border border-white/10 text-gray-300 overflow-x-auto">
                                <code>
                                    {`{
  "workflowName": "ETH Alert",
  "targetPrice": "3000",
  "chain": "ethereum",
  "api": "https://callback.url"
}`}
                                </code>
                            </pre>
                        </section>

                    </div>

                    <footer className="mt-20 pt-10 border-t border-white/10 flex justify-between items-center text-sm text-gray-500">
                        <div>
                            Last updated on <span className="text-gray-400">January 31, 2026</span>
                        </div>
                        <a href="#" className="flex items-center gap-1 hover:text-white transition-colors">
                            Edit this page <ChevronRight className="w-4 h-4" />
                        </a>
                    </footer>
                </main>

                {/* --- Right Sidebar (TOC) --- */}
                <aside className="w-56 shrink-0 hidden xl:block sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto">
                    <h5 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">On this page</h5>
                    <ul className="space-y-3 border-l border-white/10">
                        {docSections.flatMap(s => s.items).map((item) => (
                            <li key={item.id} className="-ml-[1px]">
                                <button
                                    onClick={() => scrollToSection(item.id)}
                                    className={cn(
                                        "block w-full text-left pl-4 text-sm transition-colors border-l-2",
                                        activeSection === item.id
                                            ? "border-indigo-500 text-indigo-400 font-medium"
                                            : "border-transparent text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    {item.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </div>
    );
}
