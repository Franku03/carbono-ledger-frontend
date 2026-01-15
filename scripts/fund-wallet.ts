import { ethers } from "hardhat";

async function main() {
  // 1. 👇 CORRECCIÓN AQUÍ: Usamos .toLowerCase() para evitar el error de Checksum
  const TU_DIRECCION_RAW = "0x9BA78906322C4e65017596009E7790D488427772";
  const TU_DIRECCION = TU_DIRECCION_RAW.toLowerCase();

  console.log("------------------------------------------------");
  console.log("🚀 Iniciando operación de fondeo...");
  
  // Obtenemos la cuenta configurada en hardhat.config.ts (Paso 1)
  const [admin] = await ethers.getSigners();
  
  if (!admin) {
    console.error("❌ ERROR CRÍTICO: No se pudo conectar con ningún Signer.");
    return;
  }

  // Verificar saldo del Admin
  const balanceAdmin = await ethers.provider.getBalance(admin.address);
  const saldoAdminFormateado = ethers.formatEther(balanceAdmin);

  console.log(`👤 Admin (Remitente): ${admin.address}`);
  console.log(`💰 Saldo del Admin:   ${saldoAdminFormateado} ETH`);

  // 2. 👇 VALIDACIÓN DE FONDOS
  if (balanceAdmin === 0n) {
    console.error("\n❌ ERROR: La cuenta Admin tiene 0 ETH.");
    console.error("💡 SOLUCIÓN: Necesitas añadir la 'private key' de la cuenta génesis de Quorum");
    console.error("   en tu archivo 'hardhat.config.ts' dentro de la sección 'accounts'.");
    return;
  }

  console.log(`\n📬 Enviando fondos a: ${TU_DIRECCION}...`);

  try {
    const tx = await admin.sendTransaction({
      to: TU_DIRECCION,
      value: ethers.parseEther("1000.0"), // Enviamos 1000 ETH
      gasLimit: 100000, // Forzamos límite de gas
      gasPrice: 0       // Redes privadas suelen ser 0
    });

    console.log("⏳ Transacción enviada. Esperando confirmación...");
    await tx.wait();

    const nuevoSaldo = await ethers.provider.getBalance(TU_DIRECCION);
    console.log("------------------------------------------------");
    console.log(`✅ ¡ÉXITO TOTAL!`);
    console.log(`🎉 Nuevo saldo en tu MetaMask: ${ethers.formatEther(nuevoSaldo)} ETH`);
    console.log("------------------------------------------------");
    
  } catch (error) {
    console.error("\n❌ Error durante la transferencia:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});