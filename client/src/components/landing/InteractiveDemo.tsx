import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Circle } from "lucide-react";

const MOCK_LOGS = [
    { type: "info", msg: "Listening for USDC Transfer events...", time: "0ms" },
    { type: "success", msg: "Connected to Ethereum Mainnet (wss://...)", time: "120ms" },
    { type: "event", msg: "Transfer: 0x123... -> 0x456... (500 USDC)", time: "2.4s" },
    { type: "event", msg: "Transfer: 0xabc... -> 0xdef... (1250 USDC)", time: "3.1s" },
    { type: "event", msg: "Approval: 0x789... approved 0x123...", time: "4.8s" },
    { type: "event", msg: "Transfer: 0x456... -> 0x789... (100 USDC)", time: "5.2s" },
];

export default function InteractiveDemo() {
    const [logs, setLogs] = useState<typeof MOCK_LOGS>([]);

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < MOCK_LOGS.length) {
                setLogs(prev => [...prev, MOCK_LOGS[currentIndex]]);
                currentIndex++;
            } else {
                setLogs([]);
                currentIndex = 0;
            }
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <section id="demo" className="py-24 relative">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">

                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            See it in <span className="text-indigo-500">Action</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            Experience the power of real-time event monitoring. Our engine processes blocks instantly, decoding logs and triggering your custom workflows in milliseconds.
                        </p>

                        <div className="flex gap-4 pt-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-3xl font-bold text-white">100ms</span>
                                <span className="text-sm text-gray-500">Latency</span>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div className="flex flex-col gap-2">
                                <span className="text-3xl font-bold text-white">99.9%</span>
                                <span className="text-sm text-gray-500">Uptime</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-lg">
                        <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0f0f0f] shadow-2xl shadow-indigo-500/10">
                            {/* Terminal Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                    </div>
                                    <span className="ml-2 text-xs text-gray-500 font-mono">kwala-listener — zsh</span>
                                </div>
                                <Terminal className="w-4 h-4 text-gray-600" />
                            </div>

                            {/* Terminal Body */}
                            <div className="p-4 h-[300px] overflow-hidden font-mono text-sm relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f0f0f]/80 z-10 pointer-events-none" />

                                <AnimatePresence mode="popLayout">
                                    {logs.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-2 flex gap-3"
                                        >
                                            <span className="text-gray-600 shrink-0">[{log?.time}]</span>
                                            <span className={
                                                log?.type === 'info' ? 'text-blue-400' :
                                                    log?.type === 'success' ? 'text-green-400' :
                                                        'text-gray-300'
                                            }>
                                                {log?.type === 'event' && <span className="text-purple-400 mr-2">➜</span>}
                                                {log?.msg}
                                            </span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {logs.length === 0 && (
                                    <div className="flex items-center gap-2 text-gray-500 animate-pulse">
                                        <Circle className="w-2 h-2 fill-current" />
                                        Initializing...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
