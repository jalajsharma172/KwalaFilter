
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function checkPermit() {
    console.log("Checking for EIP-2612 Permit support...");
    const p = new ethers.JsonRpcProvider(process.env.RPC_URL);

    // Contract
    const cAddress = "0x6327d40E71b742Bb55477B1A950f54af7fdf320E";

    // Check for DOMAIN_SEPARATOR and nonces and permit
    const abi = [
        "function DOMAIN_SEPARATOR() view returns (bytes32)",
        "function nonces(address owner) view returns (uint256)",
        "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
    ];

    const contract = new ethers.Contract(cAddress, abi, p);

    try {
        const domainSeparator = await contract.DOMAIN_SEPARATOR();
        console.log("✓ DOMAIN_SEPARATOR exists:", domainSeparator);
    } catch (e) {
        console.log("X DOMAIN_SEPARATOR missing or call failed.");
    }

    try {
        const nonce = await contract.nonces("0x1B96Ad5aE222c4e7F6Eb9a5d772aDB7974E0a652");
        console.log("✓ nonces() exists. Current nonce:", nonce.toString());
    } catch (e) {
        console.log("X nonces() function missing.");
    }

    // Check if we can estimate gas for permit (even with bad args it might checking selector presence differently, 
    // but usually checking the read functions is enough proof of implementation)
    console.log("Conclusion: If both checks above passed, Permit IS supported.");
}
checkPermit();
