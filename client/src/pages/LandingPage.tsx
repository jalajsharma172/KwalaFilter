import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import InteractiveDemo from "@/components/landing/InteractiveDemo";
import { Github, Twitter } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30">
            <Navbar />

            <main>
                <HeroSection />
                <InteractiveDemo />
                <FeaturesGrid />
            </main>

            <footer className="py-12 border-t border-white/10 bg-black">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-sm text-gray-500">
                        © 2025 KwalaFilter. All rights reserved.
                    </div>

                    <div className="flex items-center gap-6">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
