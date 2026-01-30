
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function check() {
    const p = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const w = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, p);

    // Contract
    const c = "0x6327d40E71b742Bb55477B1A950f54af7fdf320E";

    // Check MINTER_ROLE
    const role = ethers.id("MINTER_ROLE");
    const abi = ["function hasRole(bytes32, address) view returns (bool)"];
    const contract = new ethers.Contract(c, abi, p);

    console.log("Checking MINTER_ROLE for", w.address);
    try {
        const has = await contract.hasRole(role, w.address);
        console.log("HAS_MINTER_ROLE:", has);
    } catch (e) {
        console.log("Error checking role:", e.message);
    }
}
check();
