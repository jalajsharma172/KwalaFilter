
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function checkOwner() {
    const p = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const w = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, p);
    const c = "0x8255BF67dC4E20cf6aF4c08b65Bd5eA9eB6f36ff";

    console.log("Checking owner for:", c);
    console.log("Server Wallet:", w.address);

    const abi = ["function owner() view returns (address)"];
    const contract = new ethers.Contract(c, abi, p);

    try {
        const owner = await contract.owner();
        console.log("Contract Owner:", owner);

        if (owner.toLowerCase() === w.address.toLowerCase()) {
            console.log("✓ SUCCESS: Server wallet IS the owner.");
        } else {
            console.log("X FAILURE: Server wallet is NOT the owner.");
            console.log("  Please transfer ownership to:", w.address);
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}
checkOwner();
