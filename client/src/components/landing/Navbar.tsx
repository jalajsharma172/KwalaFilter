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
import { createThirdwebClient, defineChain, toWei } from "thirdweb";
import { ConnectButton, useActiveAccount, useSendTransaction, useReadContract } from "thirdweb/react";
import { createWallet, walletConnect } from "thirdweb/wallets";
import { getContract, prepareContractCall, toEther, prepareTransaction } from "thirdweb";

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

    // Paid mint: number of tokens user wants to buy
    const [buyTokenCount, setBuyTokenCount] = useState("1");

    const [tokenAddress, setTokenAddress] = useState("");
    const [serverWallet, setServerWallet] = useState("");

    useEffect(() => {
        fetch("/api/config/billing")
            .then(res => res.json())
            .then(data => {
                if (data.tokenAddress) setTokenAddress(data.tokenAddress);
                if (data.serverWalletAddress) setServerWallet(data.serverWalletAddress);
            })
            .catch(err => console.error("Failed to fetch billing config:", err));
    }, []);

    // Read Balance
    const { data: balanceData } = useReadContract({
        contract: getContract({
            client,
            chain: sepoliaChain,
            address: tokenAddress || "0x0000000000000000000000000000000000000000",
        }),
        method: "function balanceOf(address) view returns (uint256)",
        params: [activeAccount?.address || "0x0000000000000000000000000000000000000000"],
        queryOptions: {
            enabled: !!tokenAddress && !!activeAccount,
            refetchInterval: 2000
        }
    });

    // Read Allowance
    const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
        contract: getContract({
            client,
            chain: sepoliaChain,
            address: tokenAddress || "0x0000000000000000000000000000000000000000",
        }),
        method: "function allowance(address owner, address spender) view returns (uint256)",
        params: [
            activeAccount?.address || "0x0000000000000000000000000000000000000000",
            serverWallet || "0x0000000000000000000000000000000000000000"
        ],
        queryOptions: {
            enabled: !!tokenAddress && !!serverWallet && !!activeAccount,
            refetchInterval: 2000
        }
    });

    // Approval Transaction
    const handleApprove = () => {
        if (!activeAccount || !tokenAddress || !serverWallet) return;
        setLoading(true);
        const contract = getContract({ client, chain: sepoliaChain, address: tokenAddress });
        const transaction = prepareContractCall({
            contract,
            method: "function approve(address spender, uint256 amount)",
            params: [serverWallet, BigInt(10000000000000000000)], // 10 Tokens
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

        // Instantly move to next form with dummy score data without stopping or waiting for API
        setScoreData({
            fairscore: 85,
            social_score: 90,
            fairscore_base: 88,
            badges_count: 3
        });
        setNumberOfTokens(4); // Base score > 80 gets 4 tokens
        setStep(2);
        setStatus("");
    };

    // ─── Derived values ────────────────────────────────────────────────────────
    const kwalaBalance = balanceData !== undefined ? Number(toEther(balanceData)) : 0;
    const isPaidMintUser = kwalaBalance > 2;          // > 2 tokens → paid flow
    const ETH_PER_TOKEN = 0.0001;                     // 0.0001 ETH per Kwala token
    const buyCount = Math.max(1, parseInt(buyTokenCount) || 1);
    const totalEthCost = (buyCount * ETH_PER_TOKEN).toFixed(4);

    // ─── Free Mint (≤2 KWALA) ─────────────────────────────────────────────────
    const handleFreeMint = async () => {
        if (!walletaddress) { setStatus("Please connect your wallet first."); return; }
        try {
            setLoading(true);
            setStatus("Requesting signature from server...");
            const res = await fetch("/api/mint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: walletaddress, amount: numberofTokens || "1" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Mint failed");
            setStatus("Signature received. Confirm transaction in wallet...");
            const contract = getContract({ client, chain: sepoliaChain, address: data.distributorAddress });
            const transaction = prepareContractCall({
                contract,
                method: "function claim(uint256 amount, uint256 deadline, bytes calldata signature)",
                params: [BigInt(data.amount), BigInt(data.deadline), data.signature as `0x${string}`],
            });
            sendTransaction(transaction, {
                onSuccess: (tx) => {
                    setStatus(`✅ Mint Successful! TX: ${tx.transactionHash.slice(0, 16)}...`);
                    setStep(1); setLoading(false);
                },
                onError: (error) => {
                    setStatus(`Error: ${error.message}`);
                    setLoading(false);
                },
            });
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
            setLoading(false);
        }
    };

    // ─── Paid Mint (>2 KWALA): pay ETH → server mints tokens ─────────────────
    const handlePaidMint = async () => {
        if (!walletaddress) { setStatus("Please connect your wallet first."); return; }
        const PAYMENT_WALLET = "0x681048cb4717823c4085aabb3A23F166DEc54F02";
        if (buyCount < 1) { setStatus("Enter at least 1 token."); return; }
        try {
            setLoading(true);
            const ethWei = BigInt(Math.round(buyCount * ETH_PER_TOKEN * 1e18));
            setStatus(`Sending ${totalEthCost} ETH — confirm in wallet...`);

            // Step 1: Send ETH to server wallet
            const ethTx = prepareTransaction({
                to: PAYMENT_WALLET as `0x${string}`,
                value: ethWei,
                chain: sepoliaChain,
                client,
            });
            sendTransaction(ethTx, {
                onSuccess: async (tx) => {
                    setStatus(`Payment confirmed ✅ TX: ${tx.transactionHash.slice(0, 16)}...`);
                    // Step 2: Get mint signature from server and mint
                    try {
                        const res = await fetch("/api/mint", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ walletAddress: walletaddress, amount: String(buyCount) }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Mint failed");
                        setStatus("Minting your tokens — confirm in wallet...");
                        const contract = getContract({ client, chain: sepoliaChain, address: data.distributorAddress });
                        const mintTx = prepareContractCall({
                            contract,
                            method: "function claim(uint256 amount, uint256 deadline, bytes calldata signature)",
                            params: [BigInt(data.amount), BigInt(data.deadline), data.signature as `0x${string}`],
                        });
                        sendTransaction(mintTx, {
                            onSuccess: (mintReceipt) => {
                                setStatus(`🎉 ${buyCount} KWALA minted! TX: ${mintReceipt.transactionHash.slice(0, 16)}...`);
                                setLoading(false);
                            },
                            onError: (err) => {
                                setStatus(`Mint error: ${err.message}`);
                                setLoading(false);
                            },
                        });
                    } catch (mintErr: any) {
                        setStatus(`Mint error: ${mintErr.message}`);
                        setLoading(false);
                    }
                },
                onError: (err) => {
                    setStatus(`Payment failed: ${err.message}`);
                    setLoading(false);
                },
            });
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
            setLoading(false);
        }
    };

    // Legacy handleMint kept for step-2 button compatibility
    const handleMint = isPaidMintUser ? handlePaidMint : handleFreeMint;

    const formatAddress = (addr: string) => {
        return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
    };

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 ml-10">
                    <a href="/">
                    <span className="font-bold text-xl tracking-tight text-white">
                        Kwala<span className="text-indigo-500">Filter</span>
                    </span>

                    </a>
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
                        <DialogContent className="sm:max-w-[440px] bg-[#0d0d0d] border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold">
                                    {isPaidMintUser ? "Buy KWALA Tokens" : "Mint KWALA Tokens"}
                                </DialogTitle>
                                <DialogDescription className="text-gray-400 text-xs">
                                    {isPaidMintUser
                                        ? `Your balance is ${kwalaBalance.toFixed(2)} KWALA (>2). Pay 0.0001 ETH per token.`
                                        : `Your balance is ${kwalaBalance.toFixed(2)} KWALA (≤2). Free mint — only gas required.`}
                                </DialogDescription>
                            </DialogHeader>

                            {/* ── Mode badge ── */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
                                isPaidMintUser
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    : "bg-green-500/10 border-green-500/20 text-green-400"
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${isPaidMintUser ? "bg-amber-400" : "bg-green-400"}`}></span>
                                {isPaidMintUser
                                    ? "Paid Mint — ETH payment required"
                                    : "Free Mint — Only gas fee"}
                            </div>

                            <div className="grid gap-4 py-2">
                                {/* ── Step 1 (free flow) — Twitter + Wallet ── */}
                                {!isPaidMintUser && step === 1 && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-3">
                                            <Label className="text-right text-xs text-gray-400">Wallet</Label>
                                            <Input
                                                className="col-span-3 bg-black/50 border-white/10 text-white text-xs h-9"
                                                value={walletaddress}
                                                readOnly
                                                placeholder="Connect wallet above"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-3">
                                            <Label className="text-right text-xs text-gray-400">Twitter</Label>
                                            <Input
                                                className="col-span-3 bg-black/50 border-white/10 text-white text-xs h-9"
                                                placeholder="@twitterid"
                                                value={twitterid}
                                                onChange={(e) => setTwitterid(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* ── Step 2 (free flow) — Score summary ── */}
                                {!isPaidMintUser && step === 2 && scoreData && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {[
                                                { label: "Fair Score", value: scoreData.fairscore },
                                                { label: "Social Score", value: scoreData.social_score },
                                                { label: "Base Score", value: scoreData.fairscore_base },
                                                { label: "Badges", value: scoreData.badges_count },
                                            ].map((s) => (
                                                <div key={s.label} className="p-2 bg-white/5 rounded border border-white/5">
                                                    <div className="text-gray-400 text-xs">{s.label}</div>
                                                    <div className="text-xl font-bold">{s.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-center text-sm font-semibold text-indigo-400">
                                            You will receive: {numberofTokens} KWALA Token{numberofTokens !== 1 ? "s" : ""}
                                        </div>
                                    </div>
                                )}

                                {/* ── Paid Mint flow ── */}
                                {isPaidMintUser && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-4 items-center gap-3">
                                            <Label className="text-right text-xs text-gray-400">Tokens</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                className="col-span-3 bg-black/50 border-white/10 text-white h-9"
                                                value={buyTokenCount}
                                                onChange={(e) => setBuyTokenCount(e.target.value)}
                                                placeholder="Number of tokens"
                                            />
                                        </div>

                                        {/* Bill summary */}
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2 text-sm">
                                            <div className="flex justify-between text-gray-400">
                                                <span>Rate</span>
                                                <span className="font-mono">0.0001 ETH / KWALA</span>
                                            </div>
                                            <div className="flex justify-between text-gray-400">
                                                <span>Tokens</span>
                                                <span className="font-mono">{buyCount} KWALA</span>
                                            </div>
                                            <div className="h-px bg-white/10"></div>
                                            <div className="flex justify-between text-white font-semibold">
                                                <span>Total</span>
                                                <span className="font-mono text-amber-400">{totalEthCost} ETH</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500">
                                            After payment, tokens are automatically minted to your wallet.
                                        </p>
                                    </div>
                                )}

                                {status && (
                                    <p className={`text-xs text-center break-all px-2 py-1.5 rounded ${
                                        status.startsWith("✅") || status.startsWith("🎉")
                                            ? "text-green-400 bg-green-500/10"
                                            : status.startsWith("Error") || status.startsWith("Payment failed")
                                                ? "text-red-400 bg-red-500/10"
                                                : "text-yellow-400 bg-yellow-500/10"
                                    }`}>{status}</p>
                                )}
                            </div>

                            <DialogFooter>
                                {/* Free mint: 2-step */}
                                {!isPaidMintUser && (
                                    step === 1 ? (
                                        <Button
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white w-full"
                                            onClick={handleNext}
                                            disabled={loading}
                                        >
                                            {loading ? "Checking..." : "Next →"}
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2 w-full">
                                            <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setStep(1)} disabled={loading}>
                                                Back
                                            </Button>
                                            <Button
                                                className="bg-green-600 hover:bg-green-500 text-white flex-1"
                                                onClick={handleFreeMint}
                                                disabled={loading}
                                            >
                                                {loading ? "Minting..." : "Mint Now — Free"}
                                            </Button>
                                        </div>
                                    )
                                )}

                                {/* Paid mint: 1-step with ETH payment */}
                                {isPaidMintUser && (
                                    <Button
                                        className="bg-amber-600 hover:bg-amber-500 text-white w-full font-semibold"
                                        onClick={handlePaidMint}
                                        disabled={loading || buyCount < 1}
                                    >
                                        {loading
                                            ? "Processing..."
                                            : `Pay ${totalEthCost} ETH & Mint ${buyCount} KWALA`}
                                    </Button>
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
