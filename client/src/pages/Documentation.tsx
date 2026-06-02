import { useState, useEffect } from "react";
import { Search, ChevronRight, Menu, List, X, Box, Sun, ExternalLink, Rocket, Lightbulb, Globe, Code, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Data Structures ---
const docSections = [
    {
        id: "overview",
        title: "Overview",
        items: [
            { id: "what-is-kwala", title: "What is Kwala?" },
        ]
    },
    {
        id: "getting-started",
        title: "Getting started",
        items: [
            { id: "quickstart", title: "Quickstart" },
            { id: "get-kwala-credits", title: "Get Kwala Credits" },
        ]
    },
    {
        id: "workflow-builder",
        title: "Use the Workflow Builder",
        items: [
            { id: "explore-playground", title: "Explore the Playground" },
            { id: "create-workflow", title: "Create workflow" },
            { id: "configure-workflow", title: "Configure workflow" },
            { id: "deploy-workflow", title: "Deploy workflow" },
            { id: "monitor-workflow", title: "Monitor workflow" },
            { id: "workflow-templates", title: "Workflow templates" },
            { id: "best-practices", title: "Best practices" },
        ]
    },
    {
        id: "concepts",
        title: "Concepts",
        items: [
            { id: "yaml-workflow-basics", title: "Kwalang language" },
            { id: "workflow-execution", title: "Workflow execution" },
            { id: "triggers", title: "Triggers" },
            { id: "event-listeners", title: "Event listeners" },
            { id: "token-price-triggers", title: "Token price triggers" },
            { id: "actions", title: "Actions" },
            { id: "contract-deployer", title: "Contract deployer" },
            { id: "api-integrations", title: "API integrations" },
            { id: "transaction-manager", title: "Transaction manager" },
            { id: "kwala-functions", title: "Kwala functions" },
            { id: "address-tracking", title: "Address tracking" },
            { id: "smart-wallets", title: "Smart wallets" },
        ]
    },
    {
        id: "use-cases",
        title: "Use cases",
        items: [
            { id: "real-time-telegram", title: "Real-time Telegram notifications" },
            { id: "low-wallet-balance", title: "Low wallet balance notifier" },
            { id: "blockchain-block-count", title: "Blockchain block count alert notifier" },
            { id: "oracle-price-alerts", title: "Real-time oracle price alerts" },
            { id: "auto-top-up", title: "Auto top-up wallet" },
            { id: "instant-alerts", title: "Instant alerts for crypto or stablecoin deposits" },
            { id: "blockchain-game-reward", title: "Blockchain game reward payouts using Telegram" },
            { id: "onboard-users", title: "Onboard users on-chain" },
            { id: "automated-certificate", title: "Automated on-chain certificate issuance" },
        ]
    }
];

const archSections = [
    {
        id: "architecture",
        title: "Architecture",
        items: [
            { id: "system-overview", title: "System overview" },
            { id: "node-architecture", title: "Node architecture" },
            { id: "workflow-execution-lifecycle", title: "Workflow execution lifecycle" },
            { id: "verifier-nodes", title: "Verifier nodes" },
            { id: "public-verifiability", title: "Public verifiability" },
            { id: "security-model", title: "Security model" },
        ]
    }
];

export default function Documentation() {
    const [activeTab, setActiveTab] = useState<"docs" | "arch">("docs");
    const [activeSection, setActiveSection] = useState("what-is-kwala");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const activeSectionsData = activeTab === "docs" ? docSections : archSections;

    // Smooth scroll to section
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 120; // Header height + padding
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveSection(id);
            setIsMobileMenuOpen(false);
        }
    };

    // Update active section on scroll
    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll("section[id]");
            let current = "";
            sections.forEach((section) => {
                const sectionTop = section.getBoundingClientRect().top;
                if (sectionTop < 200) {
                    current = section.getAttribute("id") || "";
                }
            });
            if (current) setActiveSection(current);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Change tab handling
    const handleTabChange = (tab: "docs" | "arch") => {
        setActiveTab(tab);
        if (tab === "docs") {
            scrollToSection("what-is-kwala");
        } else {
            scrollToSection("system-overview");
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] text-gray-800 font-sans selection:bg-violet-200">
            
            {/* Custom Mintlify Header */}
            <header className="sticky top-0 z-50 bg-[#fafafa]/90 backdrop-blur-md border-b border-gray-200 w-full h-16 flex items-center px-4 sm:px-6 lg:px-8 justify-between">
                <div className="flex items-center gap-2 text-[#2A086A] font-bold text-2xl tracking-tight cursor-pointer">
                    <div className="bg-[#2A086A] rounded-md p-1.5 flex items-center justify-center">
                        <Box className="w-5 h-5 text-white" />
                    </div>
                    kwala
                </div>

                <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-gray-100 border border-transparent hover:border-gray-300 focus:bg-white focus:border-violet-500 rounded-lg pl-9 pr-12 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="hidden sm:inline-block border border-gray-200 bg-white rounded px-1.5 text-[10px] font-medium text-gray-500 shadow-sm">Ctrl</kbd>
                        <kbd className="hidden sm:inline-block border border-gray-200 bg-white rounded px-1.5 text-[10px] font-medium text-gray-500 shadow-sm">K</kbd>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <a href="#" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Support</a>
                    <button className="hidden sm:flex items-center gap-1 bg-[#3c096c] hover:bg-[#240046] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                        Dashboard <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                        <Sun className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-500 hover:text-gray-900">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Sub-header mimics the Mintlify Documentation / Architecture tabs */}
            <div className="sticky top-16 z-40 bg-[#fafafa]/90 backdrop-blur-md border-b border-gray-200 w-full pt-4 px-4 sm:px-6 lg:px-8 hidden md:block">
                <div className="max-w-[1400px] mx-auto flex items-end gap-8">
                    <button 
                        onClick={() => handleTabChange("docs")}
                        className={cn("pb-3 border-b-2 font-medium text-sm transition-colors", activeTab === "docs" ? "border-violet-600 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900")}
                    >
                        Documentation
                    </button>
                    <button 
                        onClick={() => handleTabChange("arch")}
                        className={cn("pb-3 border-b-2 font-medium text-sm transition-colors", activeTab === "arch" ? "border-violet-600 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900")}
                    >
                        Architecture
                    </button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-start gap-8 pt-8 pb-24 relative">

                {/* --- Left Sidebar (Navigation) --- */}
                <aside className={cn(
                    "w-[280px] shrink-0 fixed inset-y-0 left-0 z-50 bg-[#fafafa] border-r border-gray-200 pt-20 pb-10 px-4 overflow-y-auto transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0 md:bg-transparent md:border-none md:pt-0 md:px-0 md:block md:sticky md:top-32 md:h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="mb-6 md:hidden flex justify-between items-center">
                        <div className="flex gap-4">
                            <button onClick={() => handleTabChange("docs")} className={cn("text-sm font-semibold", activeTab === "docs" ? "text-violet-700" : "text-gray-500")}>Documentation</button>
                            <button onClick={() => handleTabChange("arch")} className={cn("text-sm font-semibold", activeTab === "arch" ? "text-violet-700" : "text-gray-500")}>Architecture</button>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>

                    <div className="mb-8 space-y-2">
                        <a href="#" className="flex items-center gap-3 text-[14px] text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors font-medium">
                            <span className="w-[22px] h-[22px] rounded border border-gray-200 flex items-center justify-center bg-white"><Globe className="w-3 h-3 text-gray-400"/></span>
                            Kwala Website
                        </a>
                        <a href="#" className="flex items-center gap-3 text-[14px] text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors font-medium">
                            <span className="w-[22px] h-[22px] rounded border border-gray-200 flex items-center justify-center bg-white"><Code className="w-3 h-3 text-gray-400"/></span>
                            Playground
                        </a>
                        <a href="#" className="flex items-center gap-3 text-[14px] text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors font-medium">
                            <span className="w-[22px] h-[22px] rounded border border-gray-200 flex items-center justify-center bg-white"><MessageSquare className="w-3 h-3 text-gray-400"/></span>
                            Community
                        </a>
                    </div>

                    <div className="space-y-6">
                        {activeSectionsData.map((section) => (
                            <div key={section.id}>
                                <h4 className="text-sm font-bold text-gray-900 mb-2 px-3">
                                    {section.title}
                                </h4>
                                <ul className="space-y-1">
                                    {section.items.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => scrollToSection(item.id)}
                                                className={cn(
                                                    "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors",
                                                    activeSection === item.id
                                                        ? "bg-violet-100 text-violet-700 font-medium"
                                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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

                {/* Overlay for mobile sidebar */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-gray-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
                )}

                {/* --- Main Content --- */}
                <main className="flex-1 min-w-0 max-w-4xl mx-auto w-full">
                    <div className="prose prose-gray max-w-none">
                        
                        {/* ONLY RENDER THE TAB CONTENT THAT IS ACTIVE */}
                        {activeTab === "docs" && (
                            <>
                                {/* What is Kwala */}
                                <section id="what-is-kwala" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                                        What is Kwala?
                                    </h1>
                                    <div className="border-l-4 border-violet-500 bg-violet-50/50 rounded-r-lg p-4 mb-8">
                                        <p className="text-violet-900 m-0 font-medium">
                                            Introducing Kwala, the accessibility layer for blockchains
                                        </p>
                                    </div>
                                    <p className="text-gray-700 leading-7 mb-10">
                                        Kwala is a decentralized automation network designed to make blockchains usable, programmable, and accessible for developers and enterprises. It provides the missing infrastructure layer that transforms passive blockchain state changes into active, automated workflows.
                                    </p>

                                    <hr className="my-10 border-gray-200" />
                                    
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4" id="1-learn-the-basics">
                                        1. Learn the basics
                                    </h2>
                                    <p className="text-gray-700 leading-7 mb-8">
                                        Follow this developer journey to get started with Kwala.
                                    </p>

                                    <div className="grid sm:grid-cols-2 gap-6 mb-10">
                                        {/* Card 1: Quickstart */}
                                        <button 
                                            onClick={() => scrollToSection('quickstart')} 
                                            className="text-left border border-gray-200 rounded-xl p-6 hover:border-violet-500 transition-colors group bg-white flex flex-col shadow-sm"
                                        >
                                            <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center text-violet-700 mb-4">
                                                <Rocket className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 m-0 group-hover:text-violet-700 transition-colors">Quickstart guide</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed m-0">
                                                Set up your wallet and create your first workflow in minutes.
                                            </p>
                                        </button>

                                        {/* Card 2: Core concepts */}
                                        <button 
                                            onClick={() => scrollToSection('yaml-workflow-basics')} 
                                            className="text-left border border-gray-200 rounded-xl p-6 hover:border-violet-500 transition-colors group bg-white flex flex-col shadow-sm"
                                        >
                                            <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center text-violet-700 mb-4">
                                                <Lightbulb className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 m-0 group-hover:text-violet-700 transition-colors">Core concepts</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed m-0">
                                                Understand workflows, triggers, actions, and the Kwala architecture.
                                            </p>
                                        </button>
                                    </div>
                                </section>

                                {/* Quickstart */}
                                <section id="quickstart" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                                        Quickstart
                                    </h1>
                                    <p className="text-gray-700 leading-7 mb-8">
                                        Before you can create and run Kwala workflows, you need to set up your wallet and get Kwala credits.
                                    </p>
                                    
                                    <div className="space-y-8">
                                        {/* Step 1 */}
                                        <div className="flex gap-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm border border-gray-200 shrink-0">1</div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 m-0 mb-2">Connect your Web3 wallet</h3>
                                                <p className="text-gray-700 m-0 leading-7">Kwala currently supports MetaMask for wallet connections. Install MetaMask, configure it for BNB Smart Chain network, navigate to the Kwala dashboard, and select Connect Wallet.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* YAML Workflow Basics */}
                                <section id="yaml-workflow-basics" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                                        Kwalang language
                                    </h1>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        Kwala workflows are defined using YAML, a human-readable data serialization language.
                                    </p>

                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 relative group">
                                        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-gray-200 bg-white px-2 py-1 rounded shadow-sm">Copy</button>
                                        <pre className="font-mono text-sm text-gray-800 m-0 overflow-x-auto whitespace-pre">
<span className="text-indigo-600">Name:</span> <span className="text-green-600">my_token_monitor</span>
<span className="text-indigo-600">ChainID:</span> <span className="text-orange-600">1</span>
                                        </pre>
                                    </div>
                                </section>

                                {/* Placeholders for other sections to allow smooth scroll */}
                                <section id="get-kwala-credits" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Get Kwala Credits</h1>

                                    <div className="border-l-4 border-violet-500 bg-violet-50/50 rounded-r-lg p-4 mb-8">
                                        <p className="text-violet-900 m-0 font-medium">
                                            KWALA tokens are the native credit unit of the KwalaFilter platform. Every workflow execution consumes credits — get yours to start automating.
                                        </p>
                                    </div>

                                    <p className="text-gray-700 leading-7 mb-8">
                                        KwalaFilter uses <strong>KWALA tokens</strong> as its internal billing currency. Each workflow execution, trigger evaluation, and API call deducts a small amount of KWALA from your balance. To keep your automations running, you need to maintain a sufficient token balance in your connected wallet.
                                    </p>

                                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Two Ways to Get KWALA</h2>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        The platform automatically determines which minting process applies to you based on your current KWALA balance.
                                    </p>

                                    {/* Process 1 */}
                                    <div className="border border-green-200 rounded-xl p-6 bg-green-50/40 mb-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="w-7 h-7 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-green-700 font-bold text-sm">1</span>
                                            <h3 className="text-lg font-bold text-gray-900 m-0">Free Mint — For New Users</h3>
                                            <span className="ml-auto text-xs font-semibold bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Balance ≤ 2 KWALA</span>
                                        </div>
                                        <p className="text-gray-700 leading-7 mb-4">
                                            If your wallet holds <strong>2 or fewer KWALA tokens</strong>, you qualify for a free mint. You receive KWALA tokens at no cost — you only pay the standard Sepolia ETH gas fee for the on-chain claim transaction.
                                        </p>
                                        <div className="space-y-3">
                                            <div className="flex gap-3 items-start">
                                                <span className="text-green-600 font-bold shrink-0">→</span>
                                                <p className="text-gray-600 text-sm m-0">Connect your wallet and click <strong>Mint Token</strong> in the top navigation bar.</p>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <span className="text-green-600 font-bold shrink-0">→</span>
                                                <p className="text-gray-600 text-sm m-0">Enter your Twitter / X handle to verify social presence — this determines how many tokens you receive.</p>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <span className="text-green-600 font-bold shrink-0">→</span>
                                                <p className="text-gray-600 text-sm m-0">Your score is evaluated. Click <strong>Mint Now — Free</strong> and confirm the gas transaction in MetaMask. Tokens arrive instantly.</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 bg-white rounded-lg border border-green-200 p-4 text-sm text-gray-600 space-y-1">
                                            <p className="font-semibold text-gray-800 mb-2">Token allocation by score:</p>
                                            <p>Base Score &lt; 30 → <strong>1 KWALA</strong></p>
                                            <p>30 ≤ Base Score &lt; 60 → <strong>2 KWALA</strong></p>
                                            <p>60 ≤ Base Score &lt; 80 → <strong>3 KWALA</strong></p>
                                            <p>Base Score ≥ 80 → <strong>4 KWALA</strong></p>
                                        </div>
                                    </div>

                                    {/* Process 2 */}
                                    <div className="border border-amber-200 rounded-xl p-6 bg-amber-50/40 mb-10">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-bold text-sm">2</span>
                                            <h3 className="text-lg font-bold text-gray-900 m-0">Paid Mint — Buy More Credits</h3>
                                            <span className="ml-auto text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Balance &gt; 2 KWALA</span>
                                        </div>
                                        <p className="text-gray-700 leading-7 mb-4">
                                            Once your wallet holds more than 2 KWALA tokens, you switch to the paid tier. You can purchase any number of additional tokens by paying Sepolia ETH at a fixed rate.
                                        </p>

                                        <div className="bg-white rounded-lg border border-amber-200 p-4 mb-4">
                                            <div className="flex justify-between text-sm mb-2 text-gray-600">
                                                <span>Rate</span>
                                                <span className="font-mono font-semibold">0.0001 ETH per KWALA</span>
                                            </div>
                                            <div className="h-px bg-gray-100 my-2"></div>
                                            <p className="text-xs text-gray-500 m-0">Example: Purchasing 10 KWALA = <strong>0.001 ETH</strong> (+ gas). The ETH payment is processed first, then tokens are minted automatically to your wallet in the same session.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex gap-3 items-start">
                                                <span className="text-amber-600 font-bold shrink-0">→</span>
                                                <p className="text-gray-600 text-sm m-0">Click <strong>Mint Token</strong> — the dialog detects your balance and shows the <em>Paid Mint</em> mode automatically.</p>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <span className="text-amber-600 font-bold shrink-0">→</span>
                                                <p className="text-gray-600 text-sm m-0">Enter the <strong>number of KWALA tokens</strong> you want. The bill updates in real-time.</p>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <span className="text-amber-600 font-bold shrink-0">→</span>
                                                <p className="text-gray-600 text-sm m-0">Click <strong>Pay &amp; Mint</strong>. Confirm two wallet transactions: one ETH transfer, one token claim. Both complete within seconds.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">How Credits Are Used</h2>
                                    <p className="text-gray-700 leading-7 mb-4">
                                        KWALA tokens are automatically deducted from your wallet whenever the platform executes a workflow on your behalf. The deduction happens via an on-chain ERC-20 transfer authorized through the <strong>Enable Auto-Charge</strong> approval you grant during setup.
                                    </p>
                                    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm mb-8">
                                        <table className="w-full text-sm text-left text-gray-700 m-0">
                                            <thead className="text-xs text-gray-900 uppercase bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold">Action</th>
                                                    <th className="px-6 py-4 font-semibold">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                <tr className="bg-white"><td className="px-6 py-4 font-medium text-gray-900">Workflow trigger evaluation</td><td className="px-6 py-4">0.001 KWALA</td></tr>
                                                <tr className="bg-white"><td className="px-6 py-4 font-medium text-gray-900">API action execution</td><td className="px-6 py-4">0.005 KWALA</td></tr>
                                                <tr className="bg-white"><td className="px-6 py-4 font-medium text-gray-900">Smart contract call</td><td className="px-6 py-4">0.01 KWALA</td></tr>
                                                <tr className="bg-white"><td className="px-6 py-4 font-medium text-gray-900">Notification dispatch</td><td className="px-6 py-4">0.002 KWALA</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                        <p className="text-blue-900 text-sm font-semibold mb-1">💡 Tip: Enable Auto-Charge</p>
                                        <p className="text-blue-800 text-sm leading-relaxed m-0">
                                            To avoid interruptions, approve the platform to auto-deduct tokens by clicking <strong>Enable Auto-Charge</strong> in the navbar. This grants a one-time ERC-20 allowance so workflows run seamlessly without manual approval on each execution.
                                        </p>
                                    </div>
                                </section>
                                <section id="explore-playground" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Explore the Playground</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="create-workflow" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Create Workflow</h1>

                                    <div className="border-l-4 border-violet-500 bg-violet-50/50 rounded-r-lg p-4 mb-8">
                                        <p className="text-violet-900 m-0 font-medium">
                                            A workflow is a declarative automation that listens to on-chain events and executes one or more actions in response — all without writing backend code.
                                        </p>
                                    </div>

                                    <p className="text-gray-700 leading-7 mb-8">
                                        KwalaFilter provides a no-code <strong>YAML Workflow Builder</strong> that guides you through the full workflow creation process step by step. You define your trigger source, configure the actions to execute, and compile everything into a deployable YAML configuration — which is then saved to the Kwala network.
                                    </p>

                                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Step-by-Step: Using the Workflow Builder</h2>

                                    {/* Step 1 */}
                                    <div className="flex gap-4 mb-8">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-sm font-bold border border-violet-200 shrink-0 mt-1">1</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Open the Workflow Builder</h3>
                                            <p className="text-gray-700 leading-7 m-0">
                                                Navigate to the <strong>Dashboard → Workflows</strong> and click <strong>"+ New Workflow"</strong>, or go directly to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-violet-700">/yaml-editor</code>. The builder opens a multi-step wizard that collects all the information needed to generate your workflow's YAML configuration.
                                            </p>
                                            <div className="mt-4 rounded-xl overflow-hidden border-4 border-black shadow-xl cursor-zoom-in group relative"
                                                onClick={() => {
                                                    const modal = document.getElementById('img-zoom-modal-dashboard');
                                                    if (modal) modal.style.display = 'flex';
                                                }}>
                                                <img
                                                    src="/kwala-dashboard.avif"
                                                    alt="Kwala Workflow Dashboard"
                                                    className="w-full object-cover rounded-lg group-hover:scale-[1.01] transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-lg flex items-center justify-center">
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-medium">Click to zoom</span>
                                                </div>
                                            </div>
                                            {/* Zoom Modal */}
                                            <div
                                                id="img-zoom-modal-dashboard"
                                                style={{ display: 'none' }}
                                                className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                                                onClick={() => {
                                                    const modal = document.getElementById('img-zoom-modal-dashboard');
                                                    if (modal) modal.style.display = 'none';
                                                }}>
                                                <img
                                                    src="/kwala-dashboard.avif"
                                                    alt="Kwala Workflow Dashboard Zoomed"
                                                    className="max-w-5xl w-full rounded-xl shadow-2xl border-4 border-black"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="flex gap-4 mb-8">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-sm font-bold border border-violet-200 shrink-0 mt-1">2</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Name Your Workflow</h3>
                                            <p className="text-gray-700 leading-7 mb-3">
                                                Give your workflow a clear, descriptive name. This becomes the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-violet-700">Name:</code> field in the generated YAML and is used to identify it in your dashboard.
                                            </p>
                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                                <pre className="font-mono text-sm text-gray-800 m-0 overflow-x-auto whitespace-pre">
<span className="text-indigo-600">Name:</span> <span className="text-green-600">my_token_transfer_monitor</span></pre>
                                            </div>
                                            <p className="text-gray-500 text-xs mt-2">⚠️ The Name field is required. Compilation will fail if it is left empty.</p>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="flex gap-4 mb-8">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-sm font-bold border border-violet-200 shrink-0 mt-1">3</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Configure the Trigger</h3>
                                            <p className="text-gray-700 leading-7 mb-4">
                                                Select the <strong>Trigger Source</strong> — the event or condition that activates your workflow. KwalaFilter supports two primary trigger types:
                                            </p>
                                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                                    <p className="font-bold text-gray-900 mb-1 text-sm">⚡ Execute After Event</p>
                                                    <p className="text-gray-600 text-sm leading-relaxed m-0">Fires when a specific smart contract emits a defined event. You provide the <strong>Trigger Event Signature</strong> (e.g. <code className="text-xs bg-gray-100 px-1 rounded">Transfer(address,address,uint256)</code>) and the <strong>Latest Block Number</strong> to begin monitoring from.</p>
                                                </div>
                                                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                                    <p className="font-bold text-gray-900 mb-1 text-sm">🔁 Execute After Time</p>
                                                    <p className="text-gray-600 text-sm leading-relaxed m-0">Fires on a recurring schedule (e.g. every hour or every N blocks). Ideal for periodic checks, balance monitors, and scheduled contract interactions.</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 leading-7">
                                                You also configure the <strong>Trigger Source Contract</strong> address (the contract to watch), <strong>Chain ID</strong>, and an optional <strong>Contract ABI</strong> for advanced filtering.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 4 */}
                                    <div className="flex gap-4 mb-8">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-sm font-bold border border-violet-200 shrink-0 mt-1">4</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Add Actions</h3>
                                            <p className="text-gray-700 leading-7 mb-4">
                                                Actions are what your workflow <em>does</em> when the trigger fires. Click <strong>"+ Add Action"</strong> to add up to 6 sequential actions. Each action requires:
                                            </p>
                                            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm mb-4">
                                                <table className="w-full text-sm text-left text-gray-700 m-0">
                                                    <thead className="text-xs text-gray-900 uppercase bg-gray-50 border-b border-gray-200">
                                                        <tr>
                                                            <th className="px-5 py-3 font-semibold">Field</th>
                                                            <th className="px-5 py-3 font-semibold">Description</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        <tr className="bg-white"><td className="px-5 py-3 font-medium text-gray-900 font-mono text-xs">Action Name</td><td className="px-5 py-3">A label for this action (e.g. <em>send_alert</em>)</td></tr>
                                                        <tr className="bg-white"><td className="px-5 py-3 font-medium text-gray-900 font-mono text-xs">Action Type</td><td className="px-5 py-3">The operation type: <em>call</em> (API), <em>contract</em> (on-chain), or <em>notify</em></td></tr>
                                                        <tr className="bg-white"><td className="px-5 py-3 font-medium text-gray-900 font-mono text-xs">API Endpoint</td><td className="px-5 py-3">The URL to POST to when the action executes (required)</td></tr>
                                                        <tr className="bg-white"><td className="px-5 py-3 font-medium text-gray-900 font-mono text-xs">Target Contract</td><td className="px-5 py-3">Smart contract address to call (for on-chain actions)</td></tr>
                                                        <tr className="bg-white"><td className="px-5 py-3 font-medium text-gray-900 font-mono text-xs">Target Function</td><td className="px-5 py-3">The function to invoke on the target contract</td></tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <p className="text-gray-500 text-xs">⚠️ The API Endpoint field is required. Compilation will fail if an action is missing an endpoint.</p>
                                        </div>
                                    </div>

                                    {/* Step 5 */}
                                    <div className="flex gap-4 mb-8">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-sm font-bold border border-violet-200 shrink-0 mt-1">5</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Compile &amp; Validate</h3>
                                            <p className="text-gray-700 leading-7 mb-3">
                                                Once all fields are filled, click <strong>Compile</strong>. The builder validates your configuration and generates the full YAML. If any required field is missing, a toast notification appears at the bottom-right indicating the exact issue.
                                            </p>
                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
                                                <pre className="font-mono text-xs text-gray-800 m-0 overflow-x-auto whitespace-pre leading-5">
<span className="text-indigo-600">Name:</span> <span className="text-green-600">my_token_transfer_monitor</span>{"\n"}<span className="text-indigo-600">Trigger:</span>{"\n"}  <span className="text-indigo-600">TriggerSourceContract:</span> <span className="text-orange-600">0xabc...123</span>{"\n"}  <span className="text-indigo-600">TriggerChainID:</span> <span className="text-orange-600">11155111</span>{"\n"}  <span className="text-indigo-600">TriggerEventSignature:</span> <span className="text-green-600">Transfer(address,address,uint256)</span>{"\n"}<span className="text-indigo-600">Actions:</span>{"\n"}  <span className="text-yellow-600">- Name:</span> <span className="text-green-600">notify</span>{"\n"}    <span className="text-indigo-600">Type:</span> <span className="text-green-600">call</span>{"\n"}    <span className="text-indigo-600">APIEndpoint:</span> <span className="text-green-600">https://your-api.com/webhook</span></pre>
                                            </div>
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                                A successful compilation displays a <strong className="text-green-700">✅ Compilation Successful</strong> toast and unlocks the Deploy button.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 6 */}
                                    <div className="flex gap-4 mb-10">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-sm font-bold border border-violet-200 shrink-0 mt-1">6</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Deploy</h3>
                                            <p className="text-gray-700 leading-7">
                                                Click <strong>Deploy</strong> (only available after a successful compile). The workflow name and full YAML are saved to the Kwala database. Your workflow immediately appears in the <strong>YAML Workflows</strong> section of the dashboard and is queued for execution by the Kwala network.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                        <p className="text-blue-900 text-sm font-semibold mb-1">💡 Tip: You can also import YAML directly</p>
                                        <p className="text-blue-800 text-sm leading-relaxed m-0">
                                            If you already have a YAML workflow file, use the <strong>Import YAML</strong> button on the Workflows page to paste or upload it directly — skipping the builder wizard entirely.
                                        </p>
                                    </div>
                                </section>
                                <section id="configure-workflow" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Configure workflow</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="deploy-workflow" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Deploy workflow</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="monitor-workflow" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Monitor workflow</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="workflow-execution" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Workflow execution</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="triggers" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Triggers</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="event-listeners" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Event listeners</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="token-price-triggers" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Token price triggers</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="actions" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Actions</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="contract-deployer" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Contract deployer</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="api-integrations" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">API integrations</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="transaction-manager" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Transaction manager</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="kwala-functions" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Kwala functions</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="address-tracking" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Address tracking</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="smart-wallets" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Smart wallets</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="real-time-telegram" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Real-time Telegram notifications</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="low-wallet-balance" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Low wallet balance notifier</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="blockchain-block-count" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Blockchain block count alert notifier</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="oracle-price-alerts" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Real-time oracle price alerts</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="auto-top-up" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Auto top-up wallet</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="instant-alerts" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Instant alerts for crypto or stablecoin deposits</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="blockchain-game-reward" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Blockchain game reward payouts using Telegram</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="onboard-users" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Onboard users on-chain</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                                <section id="automated-certificate" className="mb-20 scroll-mt-32"><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Automated on-chain certificate issuance</h1><p className="text-gray-700 leading-7">Documentation coming soon.</p></section>
                            </>
                        )}

                        {activeTab === "arch" && (
                            <>
                                <section id="system-overview" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">System Overview</h1>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        Kwala is a verifiable, event-driven Web3 workflow automation platform that enables developers to build backend-less decentralized applications through declarative YAML-based workflow definitions. The platform provides a permissioned, decentralized infrastructure powered by Kalp Network, delivering cryptographically verifiable execution, regulatory compliance, and deterministic automation for production environments.
                                    </p>
                                    
                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Kwala Architecture</h2>
                                    <p className="text-gray-700 mb-6">
                                        Kwala's architecture consists of interconnected components that work together to enable stateless, decentralized workflow execution:
                                    </p>

                                    <div className="overflow-x-auto mb-10 border border-gray-200 rounded-xl shadow-sm">
                                        <table className="w-full text-sm text-left text-gray-700 m-0">
                                            <thead className="text-xs text-gray-900 uppercase bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold">Component</th>
                                                    <th className="px-6 py-4 font-semibold">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                <tr className="bg-white">
                                                    <td className="px-6 py-4 font-medium text-gray-900">Stateless automation layer</td>
                                                    <td className="px-6 py-4">Processes workflows off-chain while retaining cryptographic guarantees</td>
                                                </tr>
                                                <tr className="bg-white">
                                                    <td className="px-6 py-4 font-medium text-gray-900">Kwala Virtual Machine (KVM)</td>
                                                    <td className="px-6 py-4">Deterministic runtime that interprets and executes workflow definitions</td>
                                                </tr>
                                                <tr className="bg-white">
                                                    <td className="px-6 py-4 font-medium text-gray-900">Event trigger engine</td>
                                                    <td className="px-6 py-4">Monitors blockchain activity and detects workflow activation conditions</td>
                                                </tr>
                                                <tr className="bg-white">
                                                    <td className="px-6 py-4 font-medium text-gray-900">Cross-chain action engine</td>
                                                    <td className="px-6 py-4">Executes on-chain operations across multiple networks</td>
                                                </tr>
                                                <tr className="bg-white">
                                                    <td className="px-6 py-4 font-medium text-gray-900">Web2 integration layer</td>
                                                    <td className="px-6 py-4">Connects workflows to external APIs and enterprise systems</td>
                                                </tr>
                                                <tr className="bg-white">
                                                    <td className="px-6 py-4 font-medium text-gray-900">Verifiable execution layer</td>
                                                    <td className="px-6 py-4">Provides cryptographic proof of execution through verifier nodes</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Stateless automation layer</h2>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        Kwala shifts workflow logic off-chain while maintaining cryptographic guarantees. This allows for complex, multi-step automation that would be too expensive or technically impossible to execute entirely on-chain.
                                    </p>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        The layer operates on the principle of stateless logic, stateful execution. While the workflow logic is processed in a decentralized off-chain environment, the final actions and execution proofs are recorded on the blockchain.
                                    </p>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Kwala Virtual Machine (KVM)</h2>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        The Kwala Virtual Machine (KVM) is the execution engine responsible for interpreting Kwala workflows. It ensures that every action is executed deterministically, meaning the same input will always produce the same output across any node in the network.
                                    </p>
                                    <p className="text-gray-700 leading-7 mb-4">Key functions of the KVM include:</p>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li><strong className="text-gray-900">Workflow validation:</strong> Validates workflow structure and logic before execution.</li>
                                        <li><strong className="text-gray-900">Deterministic runtime:</strong> Executes workflow steps in a sandboxed, isolated environment.</li>
                                        <li><strong className="text-gray-900">Proof generation:</strong> Generates the necessary data for verifiers to audit the execution.</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Event trigger engine</h2>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        The event trigger engine monitors blockchain activity and detects when the conditions for a workflow are met. It acts as the "listening" component of the Kwala network.
                                    </p>
                                    <p className="text-gray-700 leading-7 mb-4">Supported trigger types include:</p>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Smart contract events</li>
                                        <li>Price changes</li>
                                        <li>Time-based intervals</li>
                                        <li>Webhook inputs</li>
                                        <li>Wallet activity</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Cross-chain action engine</h2>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        The cross-chain action engine executes on-chain operations across multiple supported networks. Once a trigger is detected and the KVM processes the logic, this engine carries out the final actions.
                                    </p>
                                    <p className="text-gray-700 leading-7 mb-8">
                                        Developers define all of these operations in a single YAML file, and Kwala handles the underlying complexity of interacting with different blockchain networks.
                                    </p>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Web2 integration layer</h2>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        The Web2 integration layer enables workflows to interact with traditional internet services and APIs. This bridge allows developers to create hybrid automations that span both Web2 and Web3.
                                    </p>
                                    <p className="text-gray-700 leading-7 mb-4">Integration capabilities include:</p>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>REST APIs</li>
                                        <li>Webhooks</li>
                                        <li>Database queries</li>
                                        <li>Cloud functions</li>
                                        <li>External services</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Verifiable execution layer</h2>
                                    <p className="text-gray-700 leading-7 mb-6">
                                        Kwala ensures that every workflow execution is cryptographically verifiable. This is achieved through an independent verification layer that separates execution from validation.
                                    </p>
                                    <p className="text-gray-700 leading-7 mb-4">The verification model consists of two distinct node types:</p>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li><strong className="text-gray-900">Executor Nodes:</strong> Responsible for workflow execution and state updates.</li>
                                        <li><strong className="text-gray-900">Verifier Nodes:</strong> Audit the executor nodes and provide proof of correct execution.</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Key architectural principles</h2>
                                    <p className="text-gray-700 leading-7 mb-4">Kwala's architecture is built on four foundational principles:</p>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li><strong className="text-gray-900">Permissioned decentralization:</strong> Kwala operates on a permissioned network of nodes, ensuring high performance and regulatory compliance while maintaining a decentralized architecture.</li>
                                        <li><strong className="text-gray-900">Verifiable automation:</strong> All workflow executions are traceable to a user-signed intent, and logs are publicly auditable on Kalp Chain. Every action taken by the network can be cryptographically verified against the original workflow definition.</li>
                                        <li><strong className="text-gray-900">KMS-backed signing:</strong> Nodes sign transactions using private keys stored securely in Key Management Systems (KMS). These keys are not directly accessible even to the nodes themselves, providing an additional layer of security for automated transaction signing.</li>
                                        <li><strong className="text-gray-900">Self-custody:</strong> Every user retains control over their private keys and signs automation workflows themselves. No custodial control is imposed by Kwala. Users authorize specific actions through signed intents, maintaining full sovereignty over their assets.</li>
                                    </ul>
                                </section>
                                
                                <section id="node-architecture" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Node architecture</h1>
                                    <p className="text-gray-700 leading-7 mb-8">Understanding Kwala node architecture and security model</p>
                                    
                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Node security</h2>
                                    <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Permissioned participation</h3>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                                        <li>Known and accountable node operators</li>
                                        <li>Compliance with network policies</li>
                                        <li>Geographic distribution requirements</li>
                                        <li>Uptime and performance standards</li>
                                    </ul>

                                    <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Secure key access</h3>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                                        <li>Node operators cannot access raw private keys</li>
                                        <li>Key material remains protected even if a node is compromised</li>
                                        <li>Audit trails exist for all key usage</li>
                                    </ul>

                                    <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">TLS and mutual authentication</h3>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Man-in-the-middle attacks</li>
                                        <li>Unauthorized nodes from joining the network</li>
                                        <li>Data interception during transmission</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Workflow execution</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Workflow claiming</li>
                                        <li>Intent verification</li>
                                        <li>Condition evaluation</li>
                                        <li>Action execution</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Node components</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                                        <li>Subscribes to smart contract events via WebSocket connections</li>
                                        <li>Polls time-based triggers according to cron schedules</li>
                                        <li>Receives webhook inputs from external systems</li>
                                        <li>Parses YAML workflow definitions</li>
                                        <li>Extracts event parameters using <code className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200">re.event(n)</code> syntax</li>
                                        <li>Orchestrates multi-step action sequences</li>
                                        <li>Submits transactions to blockchain networks</li>
                                        <li>Calls external APIs and webhooks</li>
                                        <li>Manages retry logic for failed operations</li>
                                        <li>Records all inputs, outputs, and state transitions</li>
                                        <li>Generates verifiable execution traces</li>
                                        <li>Submits proofs to Kalp Chain for verification</li>
                                    </ul>
                                </section>

                                <section id="workflow-execution-lifecycle" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Workflow execution lifecycle</h1>
                                    <p className="text-gray-700 leading-7 mb-8">How workflows are executed in Kwala</p>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Execution steps</h2>
                                    <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>User-signed intent</li>
                                        <li>Trigger detection</li>
                                        <li>KVM processing</li>
                                        <li>Execution and proof generation</li>
                                        <li>Verifier node audit</li>
                                    </ol>
                                </section>

                                <section id="verifier-nodes" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Verifier nodes</h1>
                                    <p className="text-gray-700 leading-7 mb-8">Learn about verifier nodes in the Kwala network</p>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Verification process</h2>
                                    <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Execution proof retrieval</li>
                                        <li>Intent reconstruction</li>
                                        <li>Independent re-computation</li>
                                        <li>Result comparison</li>
                                        <li>Dispute or attestation</li>
                                    </ol>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Security guarantees</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li><strong className="text-gray-900">Non-repudiation:</strong> Users cannot deny their signed intents</li>
                                        <li><strong className="text-gray-900">Execution fidelity:</strong> Executors cannot deviate from defined workflows</li>
                                        <li><strong className="text-gray-900">Transparency:</strong> All verifications are recorded on-chain</li>
                                        <li><strong className="text-gray-900">Accountability:</strong> Malicious actors face economic penalties</li>
                                    </ul>
                                </section>

                                <section id="public-verifiability" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Public verifiability</h1>
                                    <p className="text-gray-700 leading-7 mb-8">Understanding public verifiability in Kwala</p>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Intent hashing</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Proves the user authorized the specific workflow</li>
                                        <li>Cannot be altered after submission</li>
                                        <li>Serves as the reference for all verification</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Verifier reports</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Reference to the original intent hash</li>
                                        <li>Execution proof from the executor node</li>
                                        <li>Verifier’s independent computation result</li>
                                        <li>Attestation or dispute status</li>
                                        <li>Verifier node signature</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Auditability</h2>
                                    <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Retrieve intent</li>
                                        <li>Retrieve execution logs</li>
                                        <li>Replay execution</li>
                                        <li>Compare results</li>
                                    </ol>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Benefits of public verifiability</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li><strong className="text-gray-900">Transparency:</strong> See exactly what actions were taken on your behalf</li>
                                        <li><strong className="text-gray-900">Accountability:</strong> Hold execution nodes responsible for their actions</li>
                                        <li><strong className="text-gray-900">Trust:</strong> Verify without relying on any single party</li>
                                        <li><strong className="text-gray-900">Compliance:</strong> Meet regulatory requirements for audit trails</li>
                                        <li><strong className="text-gray-900">Risk management:</strong> Independently verify automated operations</li>
                                        <li><strong className="text-gray-900">Due diligence:</strong> Audit third-party workflow providers</li>
                                        <li><strong className="text-gray-900">Integrity:</strong> Ensure all participants follow the rules</li>
                                        <li><strong className="text-gray-900">Decentralization:</strong> Remove reliance on trusted intermediaries</li>
                                        <li><strong className="text-gray-900">Security:</strong> Detect and penalize malicious behavior</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Accessing verification data</h2>
                                    <p className="text-gray-700 leading-7 mb-4">You can access this data via the Kwala Explorer:</p>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>View workflow execution history</li>
                                        <li>Inspect execution logs and proofs</li>
                                        <li>Verify specific transactions</li>
                                        <li>Download audit reports</li>
                                        <li>Retrieve raw execution proofs</li>
                                        <li>Verify Merkle proofs programmatically</li>
                                        <li>Build custom audit tools</li>
                                        <li>Integrate verification into applications</li>
                                    </ul>
                                </section>

                                <section id="security-model" className="mb-20 scroll-mt-32">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Security model</h1>
                                    <p className="text-gray-700 leading-7 mb-8">Understanding Kwala security model and best practices</p>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Sandboxed execution</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Each workflow executes in its own container</li>
                                        <li>No access to host filesystem or network outside defined actions</li>
                                        <li>Resource limits prevent denial-of-service attacks</li>
                                        <li>Execution environments are destroyed after completion</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Deterministic workflows</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Same inputs always produce same outputs</li>
                                        <li>No reliance on node-specific state or randomness</li>
                                        <li>Enables independent verification by any party</li>
                                        <li>Ensures fair and predictable execution</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Independent verifier nodes</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Operate independently from execution nodes</li>
                                        <li>Randomly assigned to prevent collusion</li>
                                        <li>File disputes when deviations detected</li>
                                        <li>Participate in slashing decisions</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Permissioned nodes with KMS-backed keys</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>Node operators cannot access raw private keys</li>
                                        <li>Signing happens inside hardware security modules</li>
                                        <li>Keys are bound to specific node identities</li>
                                        <li>Audit trails for all signing operations</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">Encrypted inter-node communication</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li>TLS 1.3 encryption for all traffic</li>
                                        <li>Mutual authentication prevents impersonation</li>
                                        <li>Certificate-based node identity verification</li>
                                        <li>Protection against man-in-the-middle attacks</li>
                                    </ul>

                                    <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">User layer security</h2>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
                                        <li><strong className="text-gray-900">Self-custody:</strong> Users hold their own private keys—Kwala never has access</li>
                                        <li><strong className="text-gray-900">Signed intents:</strong> Every workflow requires explicit user signature</li>
                                        <li><strong className="text-gray-900">Non-repudiation:</strong> Cryptographic proof of user authorization</li>
                                        <li><strong className="text-gray-900">Revocation:</strong> Users can deactivate workflows at any time</li>
                                    </ul>
                                </section>
                            </>
                        )}
                        

                    </div>

                    <footer className="mt-20 pt-8 pb-12 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                        <div>
                            Last updated on <span className="text-gray-700">May 07, 2026</span>
                        </div>
                        <a href="#" className="flex items-center gap-1 hover:text-gray-900 transition-colors">
                            Edit this page <ChevronRight className="w-4 h-4" />
                        </a>
                    </footer>
                </main>

                {/* --- Right Sidebar (TOC) --- */}
                <aside className="w-[200px] shrink-0 hidden xl:block sticky top-32 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    <h5 className="text-[13px] font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <List className="w-3.5 h-3.5" /> On this page
                    </h5>
                    {activeTab === "docs" ? (
                        <ul className="space-y-4">
                            <li>
                                <a href="#how-kwala-works" className="block text-[14px] font-semibold text-[#8b5cf6]">How Kwala works</a>
                                <ul className="mt-3 space-y-3 pl-3 ml-1">
                                    <li><a href="#1-learn-the-basics" className="block text-[13px] text-gray-500 hover:text-gray-900">1. Learn the basics</a></li>
                                    <li><a href="#2-build" className="block text-[13px] text-gray-500 hover:text-gray-900">2. Build your first workflow</a></li>
                                    <li><a href="#3-explore" className="block text-[13px] text-gray-500 hover:text-gray-900">3. Explore use cases</a></li>
                                    <li><a href="#4-monitor" className="block text-[13px] text-gray-500 hover:text-gray-900">4. Monitor and explore</a></li>
                                </ul>
                            </li>
                            <li>
                                <a href="#need-help" className="block text-[14px] font-semibold text-gray-700 hover:text-gray-900">Need help?</a>
                            </li>
                        </ul>
                    ) : (
                        <ul className="space-y-2.5">
                            {activeSectionsData.flatMap(s => s.items).map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => scrollToSection(item.id)}
                                        className={cn(
                                            "block w-full text-left text-[13px] transition-colors",
                                            activeSection === item.id
                                                ? "text-violet-700 font-medium"
                                                : "text-gray-500 hover:text-gray-900"
                                        )}
                                    >
                                        {item.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            </div>
        </div>
    );
}
