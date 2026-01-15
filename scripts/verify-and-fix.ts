import hre from "hardhat";
const { ethers } = hre;
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const tokenAddr = "0x7f1Dc0F5F8dafd9715Ea51f6c11b92929b2Dbdea";
  const registryAddr = "0x77FD5E6EaE71Cd6141D7da7BDE2808253C2f454c";

  const [admin] = await ethers.getSigners();
  console.log(`Using Admin: ${admin.address}`);

  const token = await ethers.getContractAt("CarbonoToken", tokenAddr);
  const registry = await ethers.getContractAt("CarbonoRegistry", registryAddr);

  console.log("Checking Token -> Registry link...");
  const linkedReg = await token.registryContract();
  if (linkedReg !== registryAddr) {
    console.log("Linking Token to Registry...");
    const tx = await token.setRegistryContract(registryAddr, { gasLimit: 1000000 });
    await tx.wait();
    console.log("Linked.");
  } else {
    console.log("Already linked.");
  }

  const pubAddr = process.env.ADDR_PUBLICADOR!.toLowerCase();
  const audAddr = process.env.ADDR_AUDITOR!.toLowerCase();

  console.log(`Checking Publicador: ${pubAddr}`);
  const isPub = await registry.publicadores(pubAddr);
  if (!isPub) {
    console.log("Adding Publicador...");
    const tx = await registry.addPublicador(pubAddr, { gasLimit: 1000000 });
    await tx.wait();
    console.log("Added.");
  } else {
    console.log("Already added.");
  }

  console.log(`Checking Auditor: ${audAddr}`);
  const isAud = await registry.auditors(audAddr);
  if (!isAud) {
    console.log("Adding Auditor...");
    const tx = await registry.addAuditor(audAddr, { gasLimit: 1000000 });
    await tx.wait();
    console.log("Added.");
  } else {
    console.log("Already added.");
  }

  console.log("Verification finished.");
}

main().catch(console.error);
