
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function checkFunding() {
    const p = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const w = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, p);

    const distributor = "0xbFdFAF326C1cA399Da54954e570a165d3E7548B4";
    const token = "0x807a8c2664c116259ba2af0a070D0B477498b12f"; // Token from step 314

    const abi = ["function balanceOf(address) view returns (uint256)"];
    const contract = new ethers.Contract(token, abi, p);

    try {
        const balance = await contract.balanceOf(distributor);
        console.log(`Distributor (${distributor}) Balance:`, ethers.formatEther(balance));

        if (balance === 0n) {
            console.log("WARNING: Distributor has 0 tokens. Claims will fail.");

            // Check Server Wallet Balance
            const wBalance = await contract.balanceOf(w.address);
            console.log(`Server Wallet Balance: ${ethers.formatEther(wBalance)}`);

            if (wBalance > 0n) {
                console.log("Server wallet has tokens. Please transfer them to the Distributor.");
            } else {
                console.log("Server wallet also has 0 tokens. You need to mint/acquire tokens first.");
            }
        } else {
            console.log("✓ Distributor is funded.");
        }
    } catch (e) {
        console.log("Error checking balance:", e.message);
    }
}
checkFunding();
