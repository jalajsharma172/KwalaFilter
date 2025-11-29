import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.jpg" alt="KwalaFilter Logo" className="h-8 w-8 object-contain" />
                    <span className="font-bold text-xl tracking-tight text-white">
                        Kwala<span className="text-indigo-500">Filter</span>
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                    <a href="/#features" className="hover:text-white transition-colors">Features</a>
                    <a href="/#demo" className="hover:text-white transition-colors">Live Demo</a>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                            Launch App
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
