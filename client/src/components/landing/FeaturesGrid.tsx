import { motion } from "framer-motion";
import { Zap, Clock, Settings, Layers, Shield, BarChart } from "lucide-react";

const features = [
    {
        title: "Real-Time Streaming",
        description: "Listen to events as they happen with sub-second latency via WebSocket.",
        icon: Zap,
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
        colSpan: "col-span-1 md:col-span-2",
    },
    {
        title: "Historical Catch-up",
        description: "Automatically fetch past logs to ensure no event is missed during downtime.",
        icon: Clock,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        colSpan: "col-span-1",
    },
    {
        title: "Workflow Automation",
        description: "Trigger webhooks or database updates instantly when specific events occur.",
        icon: Settings,
        color: "text-green-400",
        bg: "bg-green-400/10",
        colSpan: "col-span-1",
    },
    {
        title: "Multi-Chain Ready",
        description: "Compatible with Ethereum, Polygon, Arbitrum, and any EVM chain.",
        icon: Layers,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        colSpan: "col-span-1 md:col-span-2",
    },
];

export default function FeaturesGrid() {
    return (
        <section id="features" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Everything you need to <span className="text-indigo-500">monitor the chain</span>
                    </h2>
                    <p className="text-gray-400">
                        Built for developers who need reliable, real-time blockchain data without the overhead of running your own node.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`${feature.colSpan} group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors overflow-hidden`}
                        >
                            <div className={`absolute top-0 right-0 p-32 rounded-full blur-[80px] opacity-20 ${feature.bg}`} />

                            <div className={`inline-flex p-3 rounded-lg ${feature.bg} ${feature.color} mb-6`}>
                                <feature.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
