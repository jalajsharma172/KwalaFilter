
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function checkSigner() {
    const p = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const c = "0xbFdFAF326C1cA399Da54954e570a165d3E7548B4"; // Distributor

    const abi = ["function signer() view returns (address)"];
    const contract = new ethers.Contract(c, abi, p);

    try {
        const signer = await contract.signer();
        console.log("Distributor Signer:", signer);

        // Check against our env wallet
        const w = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, p);
        console.log("Server Wallet:     ", w.address);

        if (signer.toLowerCase() === w.address.toLowerCase()) {
            console.log("✓ MATCH: Server wallet IS the configured signer.");
        } else {
            console.log("X MISMATCH: Server wallet is NOT the signer.");
        }
    } catch (e) {
        console.log("Error checking signer:", e.message);
    }
}
checkSigner();
