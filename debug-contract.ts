
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function inspectContract() {
    console.log("Starting contract inspection...");

    const rpcUrl = process.env.RPC_URL;
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // 1. Verify Wallet Identity
    const privateKey = process.env.ETH_PRIVATE_KEY;
    if (!privateKey) {
        console.error("No Private Key in .env");
        return;
    }
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("---------------------------------------------------");
    console.log(`Configured Wallet: ${wallet.address}`);
    const expectedAddress = "0x1B96Ad5aE222c4e7F6Eb9a5d772aDB7974E0a652";

    if (wallet.address.toLowerCase() === expectedAddress.toLowerCase()) {
        console.log("✓ Wallet address matches user expectation.");
    } else {
        console.error(`X MISMATCH: User expects ${expectedAddress}`);
    }
    console.log("---------------------------------------------------");

    const contractAddress = "0x6327d40E71b742Bb55477B1A950f54af7fdf320E";
    console.log(`Target Contract:   ${contractAddress}`);

    // 2. Check Owner (common pattern)
    // Try Ownable pattern first
    const ownerAbi = ["function owner() view returns (address)"];
    const contractOwner = new ethers.Contract(contractAddress, ownerAbi, provider);

    try {
        const owner = await contractOwner.owner();
        console.log(`Contract Owner:    ${owner}`);
        if (owner.toLowerCase() === wallet.address.toLowerCase()) {
            console.log("✓ Wallet IS the owner.");
        } else {
            console.log("X Wallet is NOT the owner.");
        }
    } catch (e) {
        console.log("? Could not read owner() - maybe AccessControl only?");
    }

    // 3. Check AccessControl (MINTER_ROLE)
    // MINTER_ROLE is commonly keccak256("MINTER_ROLE")
    // But OpenZeppelin default is usually just DEFAULT_ADMIN_ROLE (0x00) or specific roles.
    // Let's checks standard MINTER_ROLE hash
    const minterRoleHash = ethers.id("MINTER_ROLE"); // keccak256(toUtf8Bytes("MINTER_ROLE"))
    console.log(`Checking Role:     MINTER_ROLE (${minterRoleHash})`);

    const accessAbi = ["function hasRole(bytes32 role, address account) view returns (bool)"];
    const contractAccess = new ethers.Contract(contractAddress, accessAbi, provider);

    try {
        const hasMinterRole = await contractAccess.hasRole(minterRoleHash, wallet.address);
        console.log(`Has MINTER_ROLE:   ${hasMinterRole}`);
    } catch (e) {
        console.log("? Could not check hasRole() - contract might not adhere to AccessControl.");
    }

    // 4. Try generic mint call simulation with explicit overrides to see invalid opcode vs revert
    console.log("---------------------------------------------------");
    console.log("Simulating Mint again...");
    const mintAbi = ["function mint(address to, uint256 amount) external"];
    const contractMint = new ethers.Contract(contractAddress, mintAbi, wallet);

    try {
        // Try minting 1 token (1e18 wei)
        await contractMint.mint.staticCall(wallet.address, ethers.parseUnits("1", 18));
        console.log("✓ Simulation SUCCESS! Mint should work.");
    } catch (error: any) {
        console.error("X Simulation FAILED:");
        if (error.reason) console.error("Reason:", error.reason);
        if (error.data) console.error("Revert Data:", error.data);
        if (error.info) console.error("Info:", error.info);

        // Attempt to decode revert data if it's a custom error
        // Common AccessControl error: AccessControlUnauthorizedAccount(address account, bytes32 neededRole)
        // Selector: 0xf8a8fd6d
        if (error.data && error.data.startsWith("0xf8a8fd6d")) {
            console.error("!!! REVERT REASON DETECTED: AccessControlUnauthorizedAccount");
            console.error("This confirms the wallet lacks the required role.");
        }
    }
}

inspectContract();
