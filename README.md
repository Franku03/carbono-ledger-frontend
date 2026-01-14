🌿 CARBONO LEDGER

🌍 Marketplace de Créditos de Carbono sobre Blockchain (Quorum)

  ------------------------
  📖 DESCRIPCIÓN GENERAL
  ------------------------

Carbono Ledger es una plataforma de consorcio basada en Quorum, diseñada
para la digitalización, auditoría y comercialización de créditos de
carbono, representados como Tokens ECOS ♻️.

Cada token emitido está respaldado por evidencia técnica 📄 inmutable
almacenada en IPFS y validada por un Nodo Auditor independiente 🔍,
garantizando transparencia y trazabilidad.

  -------------------------------
  🏗️ ARQUITECTURA DEL CONSORCIO
  -------------------------------

La red opera como una blockchain privada y permisionada con tres nodos
principales:

🟢 Nodo 1 – Publicador - Empresa generadora de proyectos ambientales. -
Registra proyectos y recibe tokens ECOS tras la aprobación.

🟡 Nodo 2 – Auditor - Entidad independiente de validación. - Verifica la
evidencia almacenada en IPFS. - Autoriza o rechaza la emisión de tokens.

🔵 Nodo 3 – Comprador - Usuario final. - Compra tokens ECOS para
compensar su huella de CO2. - Ejecuta la quema (burn) como prueba de
neutralidad.

  ---------------------------
  📄 CONTRATOS INTELIGENTES
  ---------------------------

🧩 CarbonoToken.sol - Tipo: ERC-20 - Función: Representa toneladas de
CO2 capturadas. - Seguridad: La función mint solo puede ser ejecutada
por el contrato CarbonoRegistry.

🗂️ CarbonoRegistry.sol - Catálogo de proyectos ambientales. - Gestiona
gobernanza y estados del proyecto.

Estados del proyecto: - Registrado - Verificado - Rechazado - Emitido

📌 Evidencia: Cada proyecto está vinculado a un CID de IPFS inmutable.

  -----------------------------
  🔄 FLUJO DE TRABAJO TÉCNICO
  -----------------------------

1️⃣ Registro - El Publicador sube la evidencia técnica a IPFS. - Registra
el proyecto en CarbonoRegistry.

2️⃣ Auditoría - El Nodo Auditor valida la evidencia según normativa. -
Aprueba o rechaza el proyecto.

3️⃣ Emisión - Tras la aprobación, se ejecuta el mint de tokens ECOS.

4️⃣ Compensación - El Comprador adquiere los tokens. - Ejecuta el burn
para certificar neutralidad de CO2 🌱.

  --------------------------
  🚀 GUÍA DE INICIO RÁPIDO
  --------------------------

Sigue estos pasos en orden para levantar la red y desplegar los
contratos correctamente.

  --------------------------------------
  1️⃣ LEVANTAR INFRAESTRUCTURA (DOCKER)
  --------------------------------------

Inicia los tres nodos de Quorum configurados con: - Gas 0 - Consenso
Clique

💻 Comando (BASH):

    docker-compose up -d

  --------------------------
  2️⃣ INSTALAR DEPENDENCIAS
  --------------------------

Instala todas las dependencias necesarias del proyecto.

💻 Comando (BASH):

    yarn install

  ---------------------------------------
  3️⃣ COMPILAR CONTRATOS Y GENERAR TIPOS
  ---------------------------------------

Compila los contratos y genera los tipos TypeChain para TypeScript.

💻 Comando (BASH):

    yarn hardhat compile

  ------------------------------
  4️⃣ EJECUTAR SUITE DE PRUEBAS
  ------------------------------

Valida la comunicación entre nodos y la aprobación del Auditor.

💻 Comando (BASH):

    yarn hardhat test --network publicador

  -------------------------------
  5️⃣ DESPLEGAR EN LA RED QUORUM
  -------------------------------

Ejecuta el despliegue oficial una vez que todos los tests estén en verde
(6–8 pruebas).

💻 Comando (BASH):

    yarn hardhat run scripts/deploy.ts --network publicador

  -------------------------------------
  🛠️ COMANDOS ÚTILES DE MANTENIMIENTO
  -------------------------------------

🧹 Limpiar red Docker:

    docker-compose down && docker system prune -f

📜 Ver logs del Nodo Auditor:

    docker logs quorum-node2

🧼 Limpiar caché de Hardhat:

    yarn hardhat clean

  -------------------
  ✨ FIN DEL README
  -------------------
