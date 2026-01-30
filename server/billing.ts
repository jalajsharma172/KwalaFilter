
import { ethers } from "ethers";
import { config } from "./config.js";

const TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// Re-use existing config or defaults
const RPC_URL = config.RPC_URL;
const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY;
const TOKEN_ADDRESS = process.env.KWALA_TOKEN_ADDRESS || "0x807a8c2664c116259ba2af0a070D0B477498b12f";
const TREASURY = process.env.TREASURY_WALLET || "0x1B96Ad5aE222c4e7F6Eb9a5d772aDB7974E0a652";
const FEE_AMOUNT = ethers.parseUnits("0.01", 18);

if (!PRIVATE_KEY || !RPC_URL) {
    console.error("Missing Billing Config: PRIVATE_KEY or RPC_URL");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
export const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;
export const tokenContract = wallet ? new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, wallet) : null;

export const SERVER_WALLET_ADDRESS = wallet ? wallet.address : null;
export { TOKEN_ADDRESS };

/**
 * Charges a user a fee (default 0.01 KWALA).
 * Requires the user to have approved the Server Wallet previously.
 * 
 * @param userAddress The address of the user to charge
 * @param amount Amount to charge in Wei (BigInt). Defaults to FEE_AMOUNT (0.01).
 * @returns { success: boolean, message: string, txHash?: string }
 */
export async function chargeUser(userAddress: string, amount: bigint = FEE_AMOUNT) {
    if (!wallet || !tokenContract) {
        return { success: false, message: "Billing System not configured (Wallet/Contract missing)" };
    }

    try {
        console.log(`[Billing] Attempting to charge ${userAddress} amount: ${ethers.formatUnits(amount, 18)} KWALA ...`);

        // 1. Check Allowance
        // user must have called approve(SERVER_WALLET, amount)
        const allowance = await tokenContract.allowance(userAddress, wallet.address);
        if (allowance < amount) {
            console.warn(`[Billing] Insufficient allowance for ${userAddress}. Has: ${allowance}, Needs: ${amount}`);
            return { success: false, message: "Insufficient Allowance. User must approve Server." };
        }

        // 2. Check Balance
        const balance = await tokenContract.balanceOf(userAddress);
        if (balance < amount) {
            console.warn(`[Billing] Insufficient balance for ${userAddress}. Has: ${balance}`);
            return { success: false, message: "Insufficient KWALA Balance." };
        }

        // 3. Execute Charge
        // transferFrom(user, treasury, fee)
        const tx = await tokenContract.transferFrom(userAddress, TREASURY, amount);
        console.log(`[Billing] Charge TX sent: ${tx.hash}. Waiting for confirmation...`);

        // Wait for 1 confirmation for demo stability
        await tx.wait(1);
        console.log(`[Billing] Charge Confirmed! ${tx.hash}`);

        return { success: true, message: "Charge Successful", txHash: tx.hash };

    } catch (error: any) {
        console.error(`[Billing] Charge Failed:`, error.message);
        return { success: false, message: `Charge Failed: ${error.message}` };
    }
}
