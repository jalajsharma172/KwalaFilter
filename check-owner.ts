
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function check() {
    const p = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const w = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, p);

    // Contract
    const c = "0x6327d40E71b742Bb55477B1A950f54af7fdf320E";

    // Check owner()
    const abi = ["function owner() view returns (address)"];
    const contract = new ethers.Contract(c, abi, p);

    console.log("Checking owner() for contract...");
    try {
        const owner = await contract.owner();
        console.log("OWNER:", owner);
        if (owner.toLowerCase() === w.address.toLowerCase()) {
            console.log("MATCH: Wallet is owner.");
        } else {
            console.log("MISMATCH: Wallet is NOT owner.");
        }
    } catch (e) {
        console.log("Error checking owner:", e.message);
    }
}
check();
