import React, { useState, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FileUp, ShieldCheck, ExternalLink, Leaf, RefreshCw, Flame, Award, TrendingUp, Download,
  ShoppingCart, ArrowRightLeft, Briefcase, Loader2, Bell, CheckCircle, X, Globe, User, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ethers } from 'ethers';

import TOKEN_ABI from "./abis/CarbonoToken.json";
import REGISTRY_ABI from "./abis/CarbonoRegistry.json";

declare global { interface Window { ethereum?: any; } }
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS;
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || "";
const getIpfsUrl = (cid: string) => `https://${PINATA_GATEWAY}/ipfs/${cid}`;

// --- CERTIFICADO ---
const CertificateModal = ({ amount, onClose }: { amount: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white text-slate-900 max-w-xl w-full rounded-[4rem] p-16 text-center shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-8 shadow-inner"><Award className="w-12 h-12" /></div>
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Acción Climática</h2>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mb-10">Certificado de Retiro Definitivo</p>
      <div className="bg-slate-50 rounded-[2.5rem] p-10 mb-10 border border-slate-100">
        <p className="text-7xl font-black text-emerald-600 tracking-tighter">{parseFloat(amount).toLocaleString()}</p>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Toneladas CO2 Neutralizadas</p>
      </div>
      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            const btn = document.getElementById('dl-btn');
            if (btn) {
              btn.innerText = "GENERANDO PDF...";
              setTimeout(() => {
                btn.innerText = "CERTIFICADO DESCARGADO ✅";
                // Simulación de descarga
                const element = document.createElement("a");
                const file = new Blob([`CERTIFICADO CARBONOLEDGER\n\nCantidad: ${amount} ECOS\nEstado: RETIRO DEFINITIVO\nFecha: ${new Date().toLocaleDateString()}\nID Transacción: CL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = `Certificado_Compensacion_${amount}_ECOS.txt`;
                document.body.appendChild(element);
                element.click();
              }, 1500);
            }
          }}
          id="dl-btn"
          className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20"
        >
          <Download className="w-4 h-4" /> Descargar Certificado (PDF)
        </button>
        <button onClick={onClose} className="w-full py-6 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-200 transition-all">Cerrar Protocolo</button>
      </div>
    </motion.div>
  </div>
);

// --- CONTEXTO ---
const WalletContext = createContext<any>(null);
const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [balance, setBalance] = useState("0");

  const refreshBalance = async () => {
    if (!window.ethereum || !address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const bal = await contract.balanceOf(address);
      setBalance(ethers.formatUnits(bal, 18));
    } catch (e) { console.error(e); }
  };

  const connect = async () => {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAddress(accounts[0]);
    setSigner(await provider.getSigner());
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  useEffect(() => { if (address) refreshBalance(); }, [address]);

  return (
    <WalletContext.Provider value={{ address, isConnected: !!address, connect, signer, balance, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
};
const useWallet = () => useContext(WalletContext);

const useRoles = () => {
  const { address, isConnected } = useWallet();
  const [roles, setRoles] = useState({ isGenerator: false, isAuditor: false, loading: true });
  useEffect(() => {
    const check = async () => {
      if (!isConnected || !address) { setRoles(r => ({ ...r, loading: false })); return; }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
        const [gen, aud] = await Promise.all([
          contract.publicadores(address).catch(() => false),
          contract.auditors(address).catch(() => false)
        ]);
        setRoles({ isGenerator: gen, isAuditor: aud, loading: false });
      } catch { setRoles(r => ({ ...r, loading: false })); }
    };
    check();
  }, [address, isConnected]);
  return roles;
};

const useOrders = () => {
  const [orders, setOrders] = useState<any[]>(JSON.parse(localStorage.getItem('cl_orders') || '[]'));
  const addOrder = (order: any) => {
    const news = [...orders, { ...order, id: Date.now(), status: 'PENDING' }];
    setOrders(news); localStorage.setItem('cl_orders', JSON.stringify(news));
  };
  const removeOrder = (id: number) => {
    const news = orders.filter(o => o.id !== id);
    setOrders(news); localStorage.setItem('cl_orders', JSON.stringify(news));
  };
  return { orders, addOrder, removeOrder };
};

// --- MARKETPLACE CON LÓGICA DE ATRIBUCIÓN INTELIGENTE ---
const Marketplace = () => {
  const { address, signer, refreshBalance } = useWallet();
  const { isAuditor, isGenerator } = useRoles();
  const { addOrder } = useOrders();
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, circ: 0 });
  const [loading, setLoading] = useState(true);
  const [buyId, setBuyId] = useState<number | null>(null);
  const [buyQty, setBuyQty] = useState("");

  const load = async () => {
    if (!window.ethereum) return; setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const reg = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
      const tok = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const count = Number(await reg.projectCount());
      const totalSupply = ethers.formatUnits(await tok.totalSupply(), 18);

      let totalNot = 0;
      const rawList = [];
      const ownersCache: Record<string, number> = {};

      // 1. Recolectar datos básicos y balances de dueños
      for (let i = 1; i <= count; i++) {
        const p = await reg.projects(i);
        const pAmt = parseFloat(ethers.formatUnits(p.carbonAmount, 18));
        totalNot += pAmt;

        if (!ownersCache[p.owner]) {
          const bal = await tok.balanceOf(p.owner);
          ownersCache[p.owner] = parseFloat(ethers.formatUnits(bal, 18));
        }

        rawList.push({
          id: i, owner: p.owner, ipfsHash: p.ipfsHash,
          capacity: pAmt, isVerified: p.isVerified, isMinted: p.isMinted
        });
      }

      // 2. LÓGICA DE ATRIBUCIÓN (FIFO por Dueño)
      // Para cada dueño, calculamos su "Consumo Total" (Lo que emitió - Lo que tiene)
      // Y lo restamos de sus proyectos en orden cronológico.
      const processedList = [];
      const ownerConsumption: Record<string, number> = {};

      // Primero calculamos el total emitido por cada dueño
      const ownerTotalMinted: Record<string, number> = {};
      rawList.forEach(p => {
        if (p.isMinted) {
          ownerTotalMinted[p.owner] = (ownerTotalMinted[p.owner] || 0) + p.capacity;
        }
      });

      // El consumo es lo que YA NO TIENEN en la wallet
      Object.keys(ownerTotalMinted).forEach(addr => {
        ownerConsumption[addr] = Math.max(0, ownerTotalMinted[addr] - (ownersCache[addr] || 0));
      });

      // Ahora repartimos ese consumo de arriba hacia abajo (ID 1 -> ID N)
      for (let p of rawList) {
        let currentStock = p.capacity;
        if (p.isMinted) {
          const toSubtract = Math.min(ownerConsumption[p.owner], p.capacity);
          currentStock = p.capacity - toSubtract;
          ownerConsumption[p.owner] -= toSubtract; // Restamos lo que ya "consumió" este proyecto
        } else {
          currentStock = 0;
        }

        processedList.unshift({ // Invertimos para mostrar los más nuevos arriba
          ...p,
          stock: currentStock
        });
      }

      setProjects(processedList);
      setStats({ total: totalNot, circ: parseFloat(totalSupply) });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [address]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 border border-emerald-500/10 rounded-3xl p-8"><span className="text-[10px] text-emerald-800 font-black uppercase mb-2 block">Capacidad Notarizada</span><span className="text-3xl font-black text-white">{stats.total.toLocaleString()} Tn</span></div>
        <div className="bg-slate-950 border border-teal-500/10 rounded-3xl p-8"><span className="text-[10px] text-teal-800 font-black uppercase mb-2 block">EcoCarbonos Activos</span><span className="text-3xl font-black text-white">{stats.circ.toLocaleString()} ECOS</span></div>
        <div className="bg-emerald-600 rounded-3xl p-8 shadow-xl shadow-emerald-600/10"><span className="text-[10px] text-emerald-100 font-black uppercase mb-2 block">CO2 Compensado</span><span className="text-3xl font-black text-white">{(stats.total - stats.circ).toLocaleString()} Tn</span></div>
      </div>

      <div className="grid gap-6">
        {projects.map(p => {
          const isMine = p.owner.toLowerCase() === address?.toLowerCase();
          const soldPct = Math.round(((p.capacity - p.stock) / p.capacity) * 100);

          return (
            <div key={p.id} className="bg-slate-950/40 border border-emerald-900/10 rounded-[3rem] p-10 group hover:border-emerald-500/20 transition-all">
              <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex-1 w-full space-y-5">
                  <div className="flex gap-4 items-center">
                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase">Lote ID-#{p.id}</span>
                    <span className="text-slate-800 font-mono text-[10px] uppercase">{p.owner.slice(0, 18)}...</span>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div><span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Volumen Notarizado</span><h3 className="text-4xl font-black text-white">{p.capacity.toLocaleString()} Tn</h3></div>
                    <div><span className="text-[9px] font-black text-emerald-500 uppercase block mb-1">Stock Disponible</span><h3 className="text-4xl font-black text-emerald-400">{p.isMinted ? p.stock.toLocaleString() : "---"} ECOS</h3></div>
                  </div>
                  {p.isMinted && (
                    <div className="space-y-2">
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${100 - soldPct}%` }} /></div>
                      <div className="flex justify-between text-[8px] font-black text-slate-700 uppercase tracking-widest"><span>Reserva Proyecto</span><span>{100 - soldPct}% Disponible</span></div>
                    </div>
                  )}
                </div>
                <div className="w-full md:w-auto flex flex-col gap-4 min-w-[220px]">
                  {!isAuditor && !isGenerator && p.isMinted && (
                    buyId === p.id ? (
                      <div className="flex gap-2">
                        <input value={buyQty} onChange={e => setBuyQty(e.target.value)} className="w-full bg-black border border-emerald-500/20 rounded-xl px-4 text-xs font-black text-white" placeholder="Cant..." />
                        <button onClick={() => { addOrder({ projectId: p.id, amount: buyQty, buyer: address, seller: p.owner }); setBuyId(null); setBuyQty(""); alert("PETICIÓN ENVIADA"); }} className="bg-emerald-600 px-6 py-4 rounded-xl text-xs font-black">OK</button>
                      </div>
                    ) : <button onClick={() => setBuyId(p.id)} className="px-10 py-5 bg-white text-black rounded-[1.5rem] font-black uppercase text-xs flex gap-3"><ShoppingCart className="w-4 h-4" /> Comprar</button>
                  )}
                  {isAuditor && !p.isVerified && <button onClick={async () => { const c = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer); await (await c.verifyProject(p.id)).wait(); load(); }} className="px-10 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-xs shadow-xl">Auditar ✅</button>}
                  {isMine && p.isVerified && !p.isMinted && <button onClick={async () => { const c = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer); await (await c.issueCredits(p.id)).wait(); await refreshBalance(); load(); }} className="px-10 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs italic shadow-xl">Emitir Tokens</button>}
                  <a href={getIpfsUrl(p.ipfsHash)} target="_blank" className="text-[9px] font-black text-slate-800 hover:text-emerald-500 uppercase text-center flex justify-center gap-2 items-center tracking-widest leading-none">VER EVIDENCIA <ExternalLink className="w-2.5 h-2.5" /></a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Account = () => {
  const { balance, signer, refreshBalance, address } = useWallet();
  const { isGenerator } = useRoles();
  const { orders, removeOrder } = useOrders();
  const [dest, setDest] = useState("");
  const [amtT, setAmtT] = useState("");
  const [amtB, setAmtB] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [certQty, setCertQty] = useState("");

  const pending = orders.filter(o => o.seller.toLowerCase() === address?.toLowerCase());

  const handleTx = async (d?: string, a?: string) => {
    const fd = d || dest; const fa = a || amtT;
    if (!signer || !fd || !fa) return; setLoading(true);
    try {
      const c = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      await (await c.transfer(fd, ethers.parseUnits(fa, 18))).wait();
      alert("LIQUIDADO"); refreshBalance(); setDest(""); setAmtT("");
    } catch (e: any) { alert(e.reason || e.message); } finally { setLoading(false); }
  };

  const handleBurn = async () => {
    if (!signer || !amtB) return; setLoading(true);
    try {
      const c = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const tx = await c.burn(ethers.parseUnits(amtB, 18), { gasLimit: 500000 });
      await tx.wait();
      setCertQty(amtB);
      setShowCert(true);
      refreshBalance();
      setAmtB("");
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-12">
      <AnimatePresence>
        {showCert && <CertificateModal amount={certQty} onClose={() => setShowCert(false)} />}
      </AnimatePresence>
      {isGenerator && pending.length > 0 && (
        <div className="bg-emerald-600/10 border-2 border-emerald-600/30 p-12 rounded-[4rem] shadow-2xl">
          <h3 className="text-3xl font-black text-white mb-10 uppercase italic flex gap-4 items-center"><Briefcase /> Centro de Ventas B2B</h3>
          <div className="space-y-4">
            {pending.map(o => (
              <div key={o.id} className="bg-black/40 p-10 rounded-[2.5rem] flex justify-between items-center border border-emerald-500/10">
                <div><span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest block mb-1">Comprador: {o.buyer.slice(0, 18)}...</span><p className="text-4xl font-black text-white">{o.amount} <span className="text-sm">ECOS</span></p></div>
                <div className="flex gap-4"><button onClick={() => { handleTx(o.buyer, o.amount); removeOrder(o.id); }} className="bg-white text-black px-12 py-5 rounded-[1.2rem] text-[10px] font-black uppercase shadow-xl">AUTORIZAR ENVÍO</button><button onClick={() => removeOrder(o.id)} className="bg-black/20 p-5 rounded-[1.2rem] text-red-500"><X /></button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-10 text-center">
        <div className="bg-slate-950 border border-emerald-900/10 rounded-[4rem] p-16 shadow-inner relative overflow-hidden">
          <Globe className="w-16 h-16 text-emerald-900 mx-auto mb-8 opacity-20" />
          <span className="text-[10px] text-emerald-800 font-black uppercase block mb-6 tracking-[0.4em]">Balance Global en Red</span>
          <span className="text-8xl font-black text-white leading-none tracking-tighter">{parseFloat(balance).toLocaleString()}</span>
          <span className="text-emerald-500 font-bold text-xs mt-6 block uppercase tracking-[0.3em]">Tokens ECOS</span>
        </div>
        <div className="bg-slate-950 border border-teal-500/10 rounded-[4rem] p-16 flex flex-col justify-center">
          <h3 className="text-3xl font-black text-white uppercase italic mb-8 flex gap-4 justify-center"><Flame className="text-teal-400" /> Compensar</h3>
          <input type="number" value={amtB} onChange={e => setAmtB(e.target.value)} className="bg-black border border-teal-900/10 rounded-[2rem] p-10 text-5xl font-black text-white mb-6 outline-none" placeholder="0 Tn" />
          <button onClick={handleBurn} className="w-full py-8 bg-teal-800 rounded-[2.2rem] font-black text-xs uppercase text-white/50">QUEMAR ECOS</button>
        </div>
      </div>
    </div>
  );
};

const Registry = () => {
  const { signer } = useWallet();
  const [file, setFile] = useState<any>(null);
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: any) => {
    e.preventDefault(); if (!signer || !file || !amt) return; setLoading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", { method: 'POST', headers: { 'Authorization': `Bearer ${PINATA_JWT.trim()}` }, body: fd });
      const { IpfsHash } = await res.json();
      const c = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
      await (await c.registerProject(IpfsHash, ethers.parseUnits(amt, 18), { gasLimit: 1200000 })).wait();
      alert("REGISTRADO EXITOSAMENTE"); window.location.reload();
    } catch (e: any) { alert(e.reason || e.message); } finally { setLoading(false); }
  };

  return (
    <div className="bg-slate-950 border border-emerald-900/10 rounded-[4.5rem] p-24 shadow-2xl relative overflow-hidden">
      <Leaf className="absolute -right-20 -top-20 w-[30rem] h-[30rem] text-emerald-500 opacity-5 rotate-12" />
      <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-16 italic leading-none">Notarizar<br /><span className="text-emerald-500">Nuevo Activo</span></h2>
      <form onSubmit={handle} className="space-y-12 relative z-10">
        <input type="number" value={amt} onChange={e => setAmt(e.target.value)} className="w-full bg-black border border-emerald-950/20 rounded-[3.5rem] p-12 text-7xl font-black text-white outline-none" placeholder="0.00 Tn" />
        <div className="border-4 border-dashed border-emerald-900/10 rounded-[3.5rem] p-24 text-center relative hover:bg-emerald-500/[0.02]">
          <input type="file" onChange={e => setFile(e.target.files?.[0])} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
          <FileUp className="w-16 h-16 text-emerald-600 mx-auto mb-8 opacity-40 group-hover:scale-110 transition-transform" />
          <p className="text-white font-black uppercase text-xs tracking-[0.4em] leading-none">{file ? file.name : "Subir Documento IPFS"}</p>
        </div>
        <button type="submit" disabled={loading} className="w-full py-10 bg-emerald-600 rounded-[2.5rem] font-black uppercase text-sm shadow-2xl hover:bg-emerald-500">REGISTRAR EN LEDGER</button>
      </form>
    </div>
  );
};

const App = () => {
  const { isConnected, address, balance, refreshBalance, connect } = useWallet();
  const { isAuditor, isGenerator, loading: roleLoad } = useRoles();
  const { orders } = useOrders();
  const [tab, setTab] = useState(0);
  const pendingCount = orders.filter(o => o.seller.toLowerCase() === address?.toLowerCase()).length;

  if (!isConnected) return (
    <div className="min-h-screen bg-[#020402] flex items-center justify-center font-sans p-10">
      <div className="bg-slate-950 border border-emerald-900/20 rounded-[4rem] p-24 shadow-2xl space-y-20 max-w-2xl w-full text-center relative overflow-hidden">
        <ShieldCheck className="w-24 h-24 text-emerald-600 mx-auto animate-pulse" />
        <h1 className="text-7xl font-black text-white uppercase italic tracking-tighter italic">Carbono<span className="text-emerald-500">Ledger</span></h1>
        <button onClick={connect} className="w-full py-10 bg-emerald-600 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-emerald-500 transition-all italic">VINCULAR NODO RED</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020402] text-slate-300 font-sans">
      <nav className="border-b border-emerald-900/10 bg-black/40 backdrop-blur-3xl sticky top-0 z-50 px-20 h-40 flex items-center justify-between">
        <div className="flex gap-10 items-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center rotate-6 shadow-2xl"><ShieldCheck className="text-white w-9 h-9 -rotate-6" /></div>
          <div><h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Carbono<span className="text-emerald-500">Ledger</span></h1><p className="text-slate-900 text-[10px] font-black uppercase mt-3 tracking-[0.8em] opacity-40 italic">Infraestructura Consorcio Quorum</p></div>
        </div>
        <div className="flex items-center gap-20">
          <div onClick={refreshBalance} className="text-right cursor-pointer group"><span className="text-[10px] text-emerald-800 font-black uppercase mb-2 block tracking-widest">Saldo Red</span><div className="flex items-center gap-5"><span className="text-5xl font-black text-white tracking-tighter">{parseFloat(balance).toLocaleString()} <span className="text-[10px] text-emerald-900 font-bold uppercase ml-2 tracking-widest">ECOS</span></span><RefreshCw className="w-4 h-4 text-emerald-950 group-hover:rotate-180 transition-all" /></div></div>
          <div className="border-l border-emerald-950/20 pl-20 text-right flex items-center gap-10">
            <div><span className="text-[10px] text-slate-800 font-black uppercase mb-2 block tracking-widest">Nodo Proxy</span><span className="text-xs font-mono text-emerald-900 font-bold tracking-tighter">{address?.slice(0, 20)}...</span></div>
            <div className="w-24 h-24 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 font-black text-4xl shadow-inner uppercase italic">{isAuditor ? 'A' : isGenerator ? 'G' : 'C'}</div>
          </div>
        </div>
      </nav>
      <main className="max-w-[1600px] mx-auto px-20 py-24 grid grid-cols-12 gap-24 font-sans">
        <aside className="col-span-3 space-y-6">
          <button onClick={() => setTab(0)} className={cn("w-full flex items-center gap-6 px-12 py-8 rounded-[2.5rem] font-black text-[11px] uppercase transition-all tracking-[0.4em]", tab === 0 ? "bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30" : "text-slate-800 hover:text-slate-400")}><Briefcase /> Mercado</button>
          <button onClick={() => setTab(1)} className={cn("w-full flex items-center gap-6 px-12 py-8 rounded-[2.5rem] font-black text-[11px] uppercase transition-all tracking-[0.4em] relative", tab === 1 ? "bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30" : "text-slate-800 hover:text-slate-400")}>
            <TrendingUp /> Cuenta {pendingCount > 0 && isGenerator && <span className="absolute top-3 right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-2xl animate-bounce border-4 border-[#020402]">{pendingCount}</span>}
          </button>
          {isGenerator && <button onClick={() => setTab(2)} className={cn("w-full flex items-center gap-6 px-12 py-8 rounded-[2.5rem] font-black text-[11px] uppercase transition-all tracking-[0.4em]", tab === 2 ? "bg-emerald-600 text-white shadow-2xl" : "text-slate-800 hover:text-slate-400")}><FileUp /> Registrar</button>}
        </aside>
        <section className="col-span-9">{roleLoad ? <div className="text-center py-60 animate-pulse text-emerald-950 uppercase text-xs font-black tracking-[1.5em]">Establishing Proxy Trust...</div> : (tab === 0 ? <Marketplace /> : tab === 1 ? <Account /> : <Registry />)}</section>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<WalletProvider><App /></WalletProvider>);