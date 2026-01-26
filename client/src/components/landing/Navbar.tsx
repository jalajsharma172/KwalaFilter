import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export default function Navbar() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [twitterid, setTwitterid] = useState("");
    const [walletaddress, setWalletaddress] = useState("");
    const [step, setStep] = useState(1);
    const [scoreData, setScoreData] = useState<any>(null);
    const [numberofTokens, setNumberOfTokens] = useState(0);
    const [tokenBalance, setTokenBalance] = useState<number | null>(null);

    const MINT_ADDRESS = new PublicKey("jCKxk3E8yEjGX8WmWA7m3ShcqX6yTwiSJF9R5QzP5pv");

    useEffect(() => {
        const fetchBalance = async () => {
            if (publicKey && connection) {
                try {
                    const ata = await getAssociatedTokenAddress(MINT_ADDRESS, publicKey);
                    const balance = await connection.getTokenAccountBalance(ata);
                    setTokenBalance(balance.value.uiAmount);
                } catch (e) {
                    console.log("Error fetching balance (likely no ATA):", e);
                    setTokenBalance(0);
                }
            } else {
                setTokenBalance(null);
            }
        };

        fetchBalance();
        const id = setInterval(fetchBalance, 10000); // Verify every 10s
        return () => clearInterval(id);
    }, [publicKey, connection]);

    useEffect(() => {
        if (publicKey) {
            setWalletaddress(publicKey.toBase58());
        }
    }, [publicKey]);

    const handleNext = async () => {
        if (!walletaddress || !twitterid) {
            setStatus("Please fill in all fields.");
            return;
        }

        try {
            setLoading(true);
            setStatus("Checking score...");

            const res = await fetch("/checkscore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletaddress, twiter_id: twitterid, optionname: 'both' }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Check checkscore failed");

            setScoreData(data);

            let tokens = 0;
            if (data.fairscore_base < 30) {
                tokens = 1;
            } else if (data.fairscore < 60) {
                tokens = 2;
            } else if (data.fairscore < 80) {
                tokens = 3;
            } else if (data.fairscore < 100) {
                tokens = 4;
            }
            setNumberOfTokens(tokens);

            setStep(2);
            setStatus("");
        } catch (err: any) {
            console.error("Check Score Error:", err);
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleMint = async () => {
        if (!publicKey) {
            setStatus("Please connect your wallet first.");
            return;
        }
        // Note: amount and recipient checks might need adjustment if not set in UI
        if (!amount || !recipient) {
            // For now allowing proceed to see if user wants to fix this separately or if logic is implied
            // setStatus("Please fill in all fields."); 
            // return; 
        }

        try {
            setLoading(true);
            setStatus("Requesting mint signature...");

            // 1. Request Partial Tx from Backend
            const res = await fetch("/api/mint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: walletaddress, amount: numberofTokens || "1" }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Mint failed");

            const { transaction } = data;

            // 2. Deserialize
            setStatus("Please sign the transaction...");
            const tx = Transaction.from(Buffer.from(transaction, 'base64'));

            // 3. User Signs & Sends (Pays for gas)
            const signature = await sendTransaction(tx, connection);

            setStatus(`Confirming transaction...`);
            await connection.confirmTransaction(signature, 'confirmed');

            setStatus(`Mint Successful! Sig: ${signature.slice(0, 8)}...`);
            setAmount("");
            setRecipient("");
            setStep(1); // Reset to step 1
        } catch (err: any) {
            console.error("Mint Error:", err);
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

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
                    {tokenBalance !== null && (
                        <div className="hidden md:block text-sm font-medium text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                            {tokenBalance} Tokens
                        </div>
                    )}
                    <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700 !h-9 !px-4 !py-2 !text-sm" />
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 hover:text-white">
                                Mint Token
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Mint Tokens</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Enter the details to mint new tokens.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                {step === 1 && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="walletaddress" className="text-right">
                                                Wallet Address
                                            </Label>
                                            <Input
                                                id="walletaddress"
                                                placeholder="0x0000000000000000000000000000000000000000"
                                                className="col-span-3 bg-black/50 border-white/20 text-white"
                                                type="text"
                                                value={walletaddress}
                                                onChange={(e) => setWalletaddress(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="recipient" className="text-right">
                                                Twitter ID
                                            </Label>
                                            <Input
                                                id="recipient"
                                                placeholder="@twitterid"
                                                className="col-span-3 bg-black/50 border-white/20 text-white"
                                                value={twitterid}
                                                onChange={(e) => setTwitterid(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                {step === 2 && scoreData && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="p-2 bg-white/5 rounded">
                                                <div className="text-gray-400">Fair Score</div>
                                                <div className="text-xl font-bold">{scoreData.fairscore}</div>
                                            </div>
                                            <div className="p-2 bg-white/5 rounded">
                                                <div className="text-gray-400">Social Score</div>
                                                <div className="text-xl font-bold">{scoreData.social_score}</div>
                                            </div>
                                            <div className="p-2 bg-white/5 rounded">
                                                <div className="text-gray-400">Base Score</div>
                                                <div className="text-xl font-bold">{scoreData.fairscore_base}</div>
                                            </div>
                                            <div className="p-2 bg-white/5 rounded">
                                                <div className="text-gray-400">Badges</div>
                                                <div className="text-xl font-bold">{scoreData.badges_count}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-center text-yellow-400">"{numberofTokens} {numberofTokens === 1 ? 'Token' : 'Tokens'}"</p>
                                        </div>
                                    </div>
                                )}

                                {status && <p className="text-xs text-center text-yellow-400">{status}</p>}
                            </div>
                            <DialogFooter>
                                {step === 1 ? (
                                    <Button
                                        type="button"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={handleNext}
                                        disabled={loading}
                                    >
                                        {loading ? "Checking..." : "Next"}
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-white border-white/20 hover:bg-white/10"
                                            onClick={() => setStep(1)}
                                            disabled={loading}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={handleMint}
                                            disabled={loading}
                                        >
                                            {loading ? "Minting..." : "Mint Now"}
                                        </Button>
                                    </div>
                                )}
                            </DialogFooter>
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
