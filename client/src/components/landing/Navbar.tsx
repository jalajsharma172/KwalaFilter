import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 hover:text-white">
                                Mint Token
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-white text-black">
                            <DialogHeader>
                                <DialogTitle>Mint Token</DialogTitle>
                                <DialogDescription>
                                    Enter the details to mint your token.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="amount" className="text-right">
                                        Amount
                                    </Label>
                                    <Input
                                        id="amount"
                                        defaultValue="100"
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="address" className="text-right">
                                        Address
                                    </Label>
                                    <Input
                                        id="address"
                                        placeholder="0x..."
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit">Mint</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
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
