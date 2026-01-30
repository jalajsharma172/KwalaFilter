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
import { createThirdwebClient, defineChain } from "thirdweb";
import { ConnectButton, useActiveAccount, useSendTransaction, useReadContract } from "thirdweb/react";
import { createWallet, walletConnect } from "thirdweb/wallets";
import { getContract, prepareContractCall, toEther } from "thirdweb";

// Initialize Thirdweb Client
// NOTE: You should replace 'YOUR_CLIENT_ID' with your actual Thirdweb Client ID in a .env file
const client = createThirdwebClient({
    clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "c5539fa07b461327170133887c33158f",
});

const sepoliaChain = defineChain(11155111);

export default function Navbar() {
    // Thirdweb Hook for active account
    const activeAccount = useActiveAccount();
    const { mutate: sendTransaction, isPending: isMinting } = useSendTransaction();

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

    const TOKEN_ADDRESS = "0x807a8c2664c116259ba2af0a070D0B477498b12f";
    const SERVER_WALLET = "0x1B96Ad5aE222c4e7F6Eb9a5d772aDB7974E0a652"; // Hardcoded for demo, usually from env or API

    // Read Balance
    const { data: balanceData } = useReadContract({
        contract: getContract({
            client,
            chain: sepoliaChain,
            address: TOKEN_ADDRESS,
        }),
        method: "function balanceOf(address) view returns (uint256)",
        params: [activeAccount?.address || "0x0000000000000000000000000000000000000000"],
    });

    // Read Allowance
    const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
        contract: getContract({
            client,
            chain: sepoliaChain,
            address: TOKEN_ADDRESS,
        }),
        method: "function allowance(address owner, address spender) view returns (uint256)",
        params: [
            activeAccount?.address || "0x0000000000000000000000000000000000000000",
            SERVER_WALLET
        ],
    });

    // Approval Transaction
    const handleApprove = () => {
        if (!activeAccount) return;
        setLoading(true);
        const contract = getContract({ client, chain: sepoliaChain, address: TOKEN_ADDRESS });
        const transaction = prepareContractCall({
            contract,
            method: "function approve(address spender, uint256 amount)",
            params: [SERVER_WALLET, BigInt(10000000000000000000)], // 10 Tokens
        });
        sendTransaction(transaction, {
            onSuccess: () => {
                setStatus("Approval Successful! Auto-charge enabled.");
                refetchAllowance();
                setLoading(false);
            },
            onError: (err) => {
                setStatus(`Approval Failed: ${err.message}`);
                setLoading(false);
            }
        });
    };

    const MINT_ADDRESS = "0x6327d40E71b742Bb55477B1A950f54af7fdf320E";

    const wallets = [
        createWallet("io.metamask"),
        createWallet("com.coinbase.wallet"),
        walletConnect(),
    ];

    // Sync active account to local state for existing logic compatibility
    useEffect(() => {
        if (activeAccount) {
            setWalletaddress(activeAccount.address);
        } else {
            setWalletaddress("");
        }
    }, [activeAccount]);

    const handleNext = async () => {
        if (!walletaddress || !twitterid) {
            setStatus("Please fill in all fields (Connect Wallet first).");
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
            const score = data.fairscore_base;

            if (score < 30) {
                tokens = 1;
            } else if (score < 60) {
                tokens = 2;
            } else if (score < 80) {
                tokens = 3;
            } else {
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
        if (!walletaddress) {
            setStatus("Please connect your wallet first.");
            return;
        }

        try {
            setLoading(true);
            setStatus("Requesting signature from server...");

            // Call Backend API
            const res = await fetch("/api/mint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: walletaddress, amount: numberofTokens || "1" }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Mint failed");

            setStatus("Signature received. Confirm transaction in wallet...");

            // Prepare Transaction
            const contract = getContract({
                client,
                chain: sepoliaChain,
                address: data.distributorAddress,
            });

            const transaction = prepareContractCall({
                contract,
                method: "function claim(uint256 amount, uint256 deadline, bytes calldata signature)",
                params: [BigInt(data.amount), BigInt(data.deadline), data.signature as `0x${string}`],
            });

            // Send Transaction
            sendTransaction(transaction, {
                onSuccess: (tx) => {
                    setStatus(`Claim Successful! TX: ${tx.transactionHash}`);
                    setStep(1);
                    setLoading(false);
                },
                onError: (error) => {
                    console.error("Claim Error:", error);
                    setStatus(`Error: ${error.message}`);
                    setLoading(false);
                },
            });

        } catch (err: any) {
            console.error("Mint Error:", err);
            setStatus(`Error: ${err.message}`);
            setLoading(false);
        }
    };

    const formatAddress = (addr: string) => {
        return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
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
                    {activeAccount && balanceData !== undefined && (
                        <div className="hidden sm:flex items-center gap-3">
                            {/* Balance Badge */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
                                <span className="text-gray-400">Bal:</span>
                                <span className="text-white font-medium">
                                    {Number(toEther(balanceData)).toFixed(2)} KWALA
                                </span>
                            </div>

                            {/* Allowance / Billing Status */}
                            {allowanceData !== undefined && (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${Number(toEther(allowanceData)) > 0.1
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                    }`}>
                                    <span>Billing:</span>
                                    <span className="font-bold">
                                        {Number(toEther(allowanceData)) > 0.1 ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>
                            )}

                            {/* Enable Billing Button (if inactive) */}
                            {allowanceData !== undefined && Number(toEther(allowanceData)) < 0.1 && (
                                <Button
                                    onClick={handleApprove}
                                    variant="ghost"
                                    className="text-xs h-8 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-600/30"
                                    disabled={loading}
                                >
                                    Enable Auto-Charge
                                </Button>
                            )}
                        </div>
                    )}
                    {/* Thirdweb Connect Button */}
                    <div className="custom-thirdweb-btn">
                        <ConnectButton
                            client={client}
                            wallets={wallets}
                            chain={sepoliaChain}
                            connectButton={{
                                label: "Select Wallet",
                                className: "!bg-indigo-600 !hover:bg-indigo-700 !text-white !h-9 !px-4 !py-2 !text-sm !rounded-md !font-medium"
                            }}
                        />
                    </div>

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
                                                placeholder="0x..."
                                                className="col-span-3 bg-black/50 border-white/20 text-white"
                                                type="text"
                                                value={walletaddress}
                                                readOnly // Address comes from wallet now
                                            // onChange={(e) => setWalletaddress(e.target.value)}
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
                                            <div className="text-xs text-gray-400 space-y-1 mt-4 p-2 bg-white/5 rounded border border-white/10">
                                                <p>If Base Score &lt; 30 , you will get 1 token.</p>
                                                <p>If Base 30 &lt; Score &lt; 60, you will get 2 tokens.</p>
                                                <p>If Base 60 &lt; Score &lt; 80, you can take 3 tokens.</p>
                                                <p>If Base 80 &lt; Score , you will get 4 tokens.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {status && <p className="text-xs text-center text-yellow-400 break-all">{status}</p>}
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
                    <Link href="/workflow">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                            View Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
