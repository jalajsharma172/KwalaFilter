
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function checkWs() {
    const wsUrl = process.env.RPC_WS_URL;
    console.log("Testing WS URL:", wsUrl);

    if (!wsUrl) {
        console.log("X No RPC_WS_URL found in env.");
        return;
    }

    try {
        const provider = new ethers.WebSocketProvider(wsUrl);

        console.log("Waiting for network...");
        const network = await provider.getNetwork();
        console.log("✓ Connected to network:", network.name, "(Chain ID:", network.chainId.toString(), ")");

        const block = await provider.getBlockNumber();
        console.log("✓ Current Block:", block);

        await provider.destroy();
        console.log("✓ Connection closed successfully.");
    } catch (error) {
        console.error("X WS Connection Failed:", error);
    }
}
checkWs();
