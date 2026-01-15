import hre from "hardhat";
const { ethers } = hre;
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const tokenAddr = "0x7f1Dc0F5F8dafd9715Ea51f6c11b92929b2Dbdea";
    const pubAddr = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0";

    const token = await ethers.getContractAt("CarbonoToken", tokenAddr);
    const balance = await token.balanceOf(pubAddr);

    console.log(`Address: ${pubAddr}`);
    console.log(`Balance: ${ethers.formatUnits(balance, 18)} ECOS`);
}

main().catch(console.error);
