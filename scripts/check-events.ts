import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const tokenAddr = "0x7f1Dc0F5F8dafd9715Ea51f6c11b92929b2Dbdea";
    const token = await ethers.getContractAt("CarbonoToken", tokenAddr);

    const filter = token.filters.Transfer();
    const logs = await token.queryFilter(filter, -100);

    console.log(`Checking last 100 blocks for Transfer events...`);
    logs.forEach(log => {
        const { from, to, value } = log.args;
        console.log(`From: ${from} To: ${to} Value: ${ethers.formatUnits(value, 18)} ECOS`);
    });
}

main().catch(console.error);
