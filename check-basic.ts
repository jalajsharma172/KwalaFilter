
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function check() {
    console.log("-----------------------");
    const p = new ethers.JsonRpcProvider(process.env.RPC_URL);

    const net = await p.getNetwork();
    console.log("Chain ID:", net.chainId.toString());
    console.log("Network Name:", net.name);

    const c = "0x6327d40E71b742Bb55477B1A950f54af7fdf320E";
    const abi = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
    ];
    const contract = new ethers.Contract(c, abi, p);

    try {
        console.log("Name:", await contract.name());
        console.log("Symbol:", await contract.symbol());
        console.log("Decimals:", await contract.decimals());
    } catch (e) {
        console.log("Error reading basic ERC20 data:", e.message);
    }
}
check();
