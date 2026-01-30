
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function diagnose() {
    console.log("Starting diagnosis...");

    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
        console.error("Error: RPC_URL is missing in .env");
        return;
    }
    console.log(`Using RPC URL: ${rpcUrl}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    try {
        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
    } catch (error: any) {
        console.error("Error connecting to network:", error.message);
        return;
    }

    const privateKey = process.env.ETH_PRIVATE_KEY;
    if (!privateKey) {
        console.error("Error: ETH_PRIVATE_KEY is missing in .env");
        return;
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Server Wallet Address: ${wallet.address}`);

    // 1. Check Balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Wallet Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        console.error("CRITICAL: Wallet has 0 ETH. Transaction will fail.");
    } else if (balance < ethers.parseEther("0.001")) { // Arbitrary low amount
        console.warn("WARNING: Wallet balance is very low.");
    }

    // 2. Check Contract Existence
    const contractAddress = "0x6327d40E71b742Bb55477B1A950f54af7fdf320E";
    console.log(`Checking Contract Address: ${contractAddress}`);

    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
        console.error("CRITICAL: No contract code found at this address on this network.");
        return;
    } else {
        console.log("Contract code found (contract exists).");
    }

    // 3. Simulate Transaction
    const tokenAbi = ["function mint(address to, uint256 amount) external"];
    const contract = new ethers.Contract(contractAddress, tokenAbi, wallet);

    // Using the address from the user's error report as a test target
    const targetAddress = "0x36bdced7fe4c154226a20013d8a7440dec3b208f";
    const amount = ethers.parseUnits("1", 18);

    console.log(`Attempting to estimate gas for minting 1 token to ${targetAddress}...`);

    try {
        const gasEstimate = await contract.mint.estimateGas(targetAddress, amount);
        console.log(`Gas Estimate Successful: ${gasEstimate.toString()}`);
    } catch (error: any) {
        console.error("Gas Estimation Failed!");
        console.error("Error Message:", error.message);
        if (error.data) {
            console.error("Revert Data:", error.data);
        }
        if (error.reason) {
            console.error("Revert Reason:", error.reason);
        }
    }
}

diagnose();
