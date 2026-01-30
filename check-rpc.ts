
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function checkRpc() {
    const rpcUrl = process.env.RPC_URL;
    console.log("Testing RPC URL:", rpcUrl);

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const block = await provider.getBlockNumber();
        console.log("✓ Success! Block Number:", block);
    } catch (error) {
        console.error("X Failed:", error);
    }
}
checkRpc();
