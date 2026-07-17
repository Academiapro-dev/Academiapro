"use client";
import { useState, useEffect } from "react";

const API = "/api/admin/compta";

function trimestreActuel() {
  const d = new Date(); const t = Math.floor(d.getMonth()/3)+1;
  return d.getFullYear()+"-T"+t;
}
const ECHEANCES: any = { "T1":"30 avril","T2":"31 juillet","T3":"31 octobre","T4":"31 janvier" };

export default function ComptabilitePage() {
  const [autorise, setAutorise] = useState(false);
  const [mdp, setMdp] = useState("");
  const [onglet, setOnglet] = useState("apercu");
  const [trimestre, setTrimestre] = useState(trimestreActuel());
  const [projet, setProjet] = useState("tous");
  const [factures, setFactures] = useState<any[]>([]);
  const [tva, setTva] = useState<any[]>([]);
  const [depenses, setDepenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fd, setFd] = useState<any>({fournisseur:"",categorie:"Logiciels",description:"",pays_fournisseur:"US",projet:"academia",montant_ttc:"",devise:"USD",avance_perso:true,date_depense:new Date().toISOString().slice(0,10)});
  const [fichier, setFichier] = useState<File|null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => { if (autorise) charger(); }, [autorise, trimestre]);

  async function appel(corps: any) {
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json", "x-mdp-compta": mdp }, body: JSON.stringify(corps) });
    return r.json();
  }

  async function tenterConnexion() {
    const d = await appel({ action: "lister", trimestre });
    if (d && d.factures) { setFactures(d.factures); setTva(d.tva || []); setDepenses(d.depenses || []); setAutorise(true); }
    else alert("Mot de passe incorrect");
  }

  async function charger() {
    setLoading(true);
    try {
      const d = await appel({ action: "lister", trimestre });
      setFactures(d.factures || []);
      setTva(d.tva || []);
      setDepenses(d.depenses || []);
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  async function ouvrirPDF(chemin: string) {
    try {
      const data = await appel({ action: "signer_pdf", chemin });
      if (data.url) window.open(data.url, "_blank");
      else alert("PDF indisponible");
    } catch(e){ alert("Erreur PDF"); }
  }

  
  function exportCSV() {
    const lignes = facturesTrim.map(f => [
      f.numero, f.date_emission, '"'+(f.client_nom||"")+'"', f.client_pays, f.type_client,
      Number(f.montant_ht).toFixed(2), f.taux_tva, Number(f.montant_tva).toFixed(2),
      Number(f.montant_ttc).toFixed(2), f.statut_paiement||"", f.est_avoir?"AVOIR":"FACTURE"
    ].join(";"));
    const entete = "Numero;Date;Client;Pays;Type;HT;TauxTVA;TVA;TTC;Paiement;Nature";
    const csv = entete + "\n" + lignes.join("\n");
    const blob = new Blob(["\ufeff"+csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "compta_" + trimestre + ".csv"; a.click();
    URL.revokeObjectURL(url);
  }

  
  function exportZIP() {
    window.open("/api/admin/export-zip?trimestre=" + trimestre, "_blank");
  }

  
  async function verifierIntegrite(f: any) {
    if (!f.hash_sha256) { alert("Pas de hash enregistre pour cette facture"); return; }
    if (!f.pdf_url) { alert("Pas de PDF associe"); return; }
    try {
      // 1) obtenir URL signee via la route serveur
      const ds = await appel({ action: "signer_pdf", chemin: f.pdf_url });
      if (!ds.url) { alert("PDF inaccessible"); return; }
      // 2) telecharger le PDF
      const rp = await fetch(ds.url);
      const buf = await rp.arrayBuffer();
      // 3) recalculer le hash SHA-256
      const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2,"0")).join("");
      // 4) comparer
      if (hashHex === f.hash_sha256) {
        alert("Facture " + f.numero + " : INTEGRE\n\nLe document n'a pas ete modifie depuis son emission.\nHash verifie : " + hashHex.slice(0,16) + "...");
      } else {
        alert("ALERTE - Facture " + f.numero + " : ALTEREE\n\nLe hash ne correspond pas !\nAttendu : " + f.hash_sha256.slice(0,16) + "...\nObtenu : " + hashHex.slice(0,16) + "...");
      }
    } catch(e) { alert("Erreur verification : " + e); }
  }

  async function ajouterDepense() {
    if (!fd.fournisseur || !fd.montant_ttc) { alert("Fournisseur et montant obligatoires"); return; }
    setEnvoi(true);
    try {
      const data = new FormData();
      Object.keys(fd).forEach(k => data.append(k, String(fd[k])));
      if (fichier) data.append("fichier", fichier);
      const r = await fetch("/api/admin/ajouter-depense", { method: "POST", headers: { "x-mdp-compta": mdp }, body: data });
      const res = await r.json();
      if (res.success) {
        alert("Depense enregistree" + (res.pdf_url ? " avec justificatif" : ""));
        setFd({ ...fd, fournisseur: "", description: "", montant_ttc: "" });
        setFichier(null);
        charger();
      } else alert("Erreur : " + (res.error || "inconnue"));
    } catch (e) { alert("Erreur reseau"); }
    setEnvoi(false);
  }

  async function marquerPayee(f: any) {
    if (!confirm("Marquer la facture "+f.numero+" comme payee ?")) return;
    await appel({ action: "marquer_payee", id: f.id });
    charger();
  }

  async function creerAvoir(f: any) {
    if (f.est_avoir) { alert("C'est deja un avoir"); return; }
    if (!confirm("Creer un AVOIR (annulation) pour la facture "+f.numero+" ?\\nMontant negatif de -"+f.montant_ttc+" EUR")) return;
    const res = await appel({ action: "creer_avoir", id: f.id });
    if (res.success) alert("Avoir " + res.numero + " cree");
    else alert("Erreur : " + (res.error || "inconnue"));
    charger();
  }

  // Calculs
  const facturesP = projet === "tous" ? factures : factures.filter(f => f.projet === projet);
  const depensesP = projet === "tous" ? depenses : depenses.filter(d => d.projet === projet);
  const facturesTrim = facturesP.filter(f => f.trimestre === trimestre);
  const caTotal = facturesP.reduce((s,f)=>s+Number(f.montant_ttc||0),0);
  const caHT = facturesP.reduce((s,f)=>s+Number(f.montant_ht||0),0);
  const tvaCollectee = tva.reduce((s,t)=>s+Number(t.total_tva||0),0);
  const tvaUE = tva.filter(t=>t.zone==="UE");
  const totalTvaADeclarer = tvaUE.reduce((s,t)=>s+Number(t.total_tva||0),0);
  const depensesParDevise: any = {};
  depensesP.forEach(d=>{ const dev=d.devise||"EUR"; depensesParDevise[dev]=(depensesParDevise[dev]||0)+Number(d.montant_ttc||0); });
  const texteDepenses = Object.keys(depensesParDevise).map(dev=>depensesParDevise[dev].toFixed(2)+" "+dev).join(" + ")||"0.00 EUR";
  const avancesNonRemb = depensesP.filter(d=>d.avance_perso && !d.rembourse);
  const avancesParDevise: any = {};
  avancesNonRemb.forEach(d=>{ const dev=d.devise||"EUR"; avancesParDevise[dev]=(avancesParDevise[dev]||0)+Number(d.montant_ttc||0); });
  const texteAvances = Object.keys(avancesParDevise).map(dev=>avancesParDevise[dev].toFixed(2)+" "+dev).join(" + ")||"0.00 EUR";
  const depensesEUR = depensesParDevise["EUR"]||0;
  const resultatNet = caHT - depensesEUR;
  const nbImpayees = facturesP.filter(f=>f.statut_paiement!=="payee" && !f.est_avoir).length;

  const seuils: any = { GB:85000, CA:22000, AU:50000, US:100000 };
  const parPaysHorsUE: any = {};
  facturesP.filter(f=>f.zone!=="UE").forEach(f=>{ parPaysHorsUE[f.client_pays]=(parPaysHorsUE[f.client_pays]||0)+Number(f.montant_ttc||0); });
  const alertes = Object.keys(parPaysHorsUE).filter(p=>seuils[p]&&parPaysHorsUE[p]>seuils[p]*0.7);

  if (!autorise) {
    return (
      <div style={{minHeight:"100vh",background:"#050508",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"20px"}}>
        <h1 style={{color:"#c8a96e",fontFamily:"Georgia,serif"}}>Comptabilite</h1>
        <input type="password" placeholder="Mot de passe" value={mdp}
          onChange={e=>setMdp(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&tenterConnexion()}
          style={{padding:"12px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff",width:"250px"}}/>
        <button onClick={()=>tenterConnexion()}
          style={{padding:"12px 30px",background:"#c8a96e",color:"#050508",border:"none",borderRadius:"8px",fontWeight:"bold",cursor:"pointer"}}>Acceder</button>
      </div>
    );
  }

  const onglets = [["apercu","Vue d'ensemble"],["tva","TVA a declarer"],["factures","Factures"],["depenses","Depenses"],["seuils","Alertes seuils"],["export","Export trimestre"],["ajouter","+ Depense"]];
  const card = {background:"rgba(255,255,255,0.03)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:"12px",padding:"20px"};
  const th = {textAlign:"left" as const,padding:"8px",color:"#c8a96e",borderBottom:"1px solid rgba(200,169,110,0.2)"};
  const td = {padding:"8px",borderBottom:"1px solid rgba(255,255,255,0.05)"};

  function badgePaiement(f:any){
    if(f.est_avoir) return <span style={{color:"#8b5cf6"}}>Avoir</span>;
    if(f.statut_paiement==="payee") return <span style={{color:"#22c55e"}}>Payee</span>;
    return <span style={{color:"#f59e0b"}}>En attente</span>;
  }

  return (
    <div style={{minHeight:"100vh",background:"#050508",color:"#fff",padding:"20px"}}>
      <div style={{maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
          <h1 style={{color:"#c8a96e",fontFamily:"Georgia,serif",margin:0}}>Comptabilite LLC</h1>
          <select value={projet} onChange={e=>setProjet(e.target.value)}
            style={{padding:"8px 12px",borderRadius:"8px",background:"rgba(255,255,255,0.05)",color:"#fff",border:"1px solid #c8a96e",marginRight:"8px"}}>
            <option value="tous">Tous les projets</option>
            <option value="academia">AcademIA Pro</option>
            <option value="hebrewpro">HebrewPro AI</option>
          </select>
          <select value={trimestre} onChange={e=>setTrimestre(e.target.value)}
            style={{padding:"8px 12px",borderRadius:"8px",background:"rgba(255,255,255,0.05)",color:"#fff",border:"1px solid #c8a96e"}}>
            {["2026-T1","2026-T2","2026-T3","2026-T4"].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>
          {onglets.map(([id,label])=>(
            <button key={id} onClick={()=>setOnglet(id)}
              style={{padding:"8px 14px",borderRadius:"8px",cursor:"pointer",
                background:onglet===id?"#c8a96e":"rgba(255,255,255,0.05)",
                color:onglet===id?"#050508":"#fff",border:"none",fontWeight:onglet===id?"bold":"normal"}}>{label}</button>
          ))}
        </div>
        {loading && <p style={{color:"#c8a96e"}}>Chargement...</p>}

        {onglet==="apercu" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"15px"}}>
            <div style={card}><p style={{color:"rgba(255,255,255,0.5)",margin:0}}>CA total (TTC)</p><h2 style={{color:"#c8a96e",margin:"8px 0 0"}}>{caTotal.toFixed(2)} EUR</h2></div>
            <div style={card}><p style={{color:"rgba(255,255,255,0.5)",margin:0}}>Depenses</p><h2 style={{color:"#c8a96e",margin:"8px 0 0",fontSize:"20px"}}>{texteDepenses}</h2></div>
            <div style={{...card,border:"1px solid "+(resultatNet>=0?"#22c55e":"#ef4444")}}><p style={{color:"rgba(255,255,255,0.5)",margin:0}}>Resultat net EUR (HT - depenses EUR)</p><h2 style={{color:resultatNet>=0?"#22c55e":"#ef4444",margin:"8px 0 0"}}>{resultatNet.toFixed(2)} EUR</h2></div>
            <div style={{...card,border:"1px solid #8b5cf6"}}><p style={{color:"rgba(255,255,255,0.5)",margin:0}}>Compte courant associe ({avancesNonRemb.length} avances a rembourser)</p><h2 style={{color:"#8b5cf6",margin:"8px 0 0",fontSize:"20px"}}>{texteAvances}</h2></div>
            <div style={card}><p style={{color:"rgba(255,255,255,0.5)",margin:0}}>TVA collectee ({trimestre})</p><h2 style={{color:"#c8a96e",margin:"8px 0 0"}}>{tvaCollectee.toFixed(2)} EUR</h2></div>
            <div style={{...card,border:nbImpayees>0?"1px solid #f59e0b":card.border}}><p style={{color:"rgba(255,255,255,0.5)",margin:0}}>Factures impayees</p><h2 style={{color:nbImpayees>0?"#f59e0b":"#c8a96e",margin:"8px 0 0"}}>{nbImpayees}</h2></div>
          </div>
        )}

        {onglet==="tva" && (
          <div style={card}>
            <h3 style={{color:"#c8a96e"}}>TVA a declarer - {trimestre}</h3>
            <p style={{color:"rgba(255,255,255,0.6)"}}>Echeance : {ECHEANCES[trimestre.split("-")[1]]||"-"}</p>
            <table style={{width:"100%",borderCollapse:"collapse",marginTop:"10px"}}>
              <thead><tr><th style={th}>Pays</th><th style={th}>Base HT</th><th style={th}>TVA collectee</th><th style={th}>Nb</th></tr></thead>
              <tbody>{tvaUE.map((t,i)=>(<tr key={i}><td style={td}>{t.pays}</td><td style={td}>{Number(t.total_ht).toFixed(2)}</td><td style={td}>{Number(t.total_tva).toFixed(2)}</td><td style={td}>{t.nb_factures}</td></tr>))}</tbody>
            </table>
            <div style={{marginTop:"15px",padding:"15px",background:"rgba(200,169,110,0.1)",borderRadius:"8px"}}>
              <strong style={{color:"#c8a96e"}}>TOTAL TVA A REVERSER (UE) : {totalTvaADeclarer.toFixed(2)} EUR</strong>
              <p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"8px 0 0"}}>Regime a confirmer par un fiscaliste.</p>
            </div>
          </div>
        )}

        {onglet==="factures" && (
          <div style={card}>
            <h3 style={{color:"#c8a96e"}}>Factures</h3>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><th style={th}>Numero</th><th style={th}>Client</th><th style={th}>TTC</th><th style={th}>Paiement</th><th style={th}>PDF</th><th style={th}>Actions</th></tr></thead>
              <tbody>{facturesP.map((f,i)=>(
                <tr key={i}>
                  <td style={td}>{f.numero}</td><td style={td}>{f.client_nom}</td>
                  <td style={{...td,color:Number(f.montant_ttc)<0?"#ef4444":"#fff"}}>{Number(f.montant_ttc).toFixed(2)}</td>
                  <td style={td}>{badgePaiement(f)}</td>
                  <td style={td}>{f.pdf_url?<span onClick={()=>ouvrirPDF(f.pdf_url)} style={{color:"#c8a96e",cursor:"pointer",textDecoration:"underline"}}>PDF</span>:"-"}</td>
                  <td style={td}>
                    {!f.est_avoir && f.statut_paiement!=="payee" && <button onClick={()=>marquerPayee(f)} style={{marginRight:"6px",padding:"4px 8px",fontSize:"11px",background:"#22c55e",color:"#050508",border:"none",borderRadius:"6px",cursor:"pointer"}}>Payee</button>}
                    {!f.est_avoir && <button onClick={()=>creerAvoir(f)} style={{padding:"4px 8px",fontSize:"11px",background:"#8b5cf6",color:"#fff",border:"none",borderRadius:"6px",cursor:"pointer"}}>Avoir</button>}
                    {f.hash_sha256 && <button onClick={()=>verifierIntegrite(f)} style={{marginLeft:"6px",padding:"4px 8px",fontSize:"11px",background:"#3b82f6",color:"#fff",border:"none",borderRadius:"6px",cursor:"pointer"}}>Verifier</button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {onglet==="depenses" && (
          <div style={card}>
            <h3 style={{color:"#c8a96e"}}>Depenses</h3>
            {depensesP.length===0?<p style={{color:"rgba(255,255,255,0.5)"}}>Aucune depense.</p>:
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><th style={th}>Fournisseur</th><th style={th}>Categorie</th><th style={th}>TTC</th><th style={th}>Devise</th><th style={th}>Avance</th><th style={th}>Date</th></tr></thead>
              <tbody>{depensesP.map((d,i)=>(<tr key={i}><td style={td}>{d.fournisseur}</td><td style={td}>{d.categorie}</td><td style={td}>{Number(d.montant_ttc).toFixed(2)}</td><td style={td}>{d.devise||"EUR"}</td><td style={td}>{d.avance_perso?(d.rembourse?<span style={{color:"#22c55e"}}>Remboursee</span>:<span style={{color:"#8b5cf6"}}>Avance perso</span>):"-"}</td><td style={td}>{d.date_depense}</td></tr>))}</tbody>
            </table>}
          </div>
        )}

        {onglet==="ajouter" && (
          <div style={card}>
            <h3 style={{color:"#c8a96e"}}>Nouvelle depense</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"12px"}}>
              <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"0 0 4px"}}>Fournisseur *</p>
                <input value={fd.fournisseur} onChange={e=>setFd({...fd,fournisseur:e.target.value})} placeholder="Anthropic, Vercel..." style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff",boxSizing:"border-box"}}/></div>
              <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"0 0 4px"}}>Montant TTC *</p>
                <input type="number" step="0.01" value={fd.montant_ttc} onChange={e=>setFd({...fd,montant_ttc:e.target.value})} placeholder="20.00" style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff",boxSizing:"border-box"}}/></div>
              <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"0 0 4px"}}>Devise</p>
                <select value={fd.devise} onChange={e=>setFd({...fd,devise:e.target.value})} style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff"}}><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
              <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"0 0 4px"}}>Categorie</p>
                <select value={fd.categorie} onChange={e=>setFd({...fd,categorie:e.target.value})} style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff"}}>{["Logiciels","IA / API","Hebergement","Domaines","Services juridiques","Marketing","Autres"].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"0 0 4px"}}>Projet</p>
                <select value={fd.projet} onChange={e=>setFd({...fd,projet:e.target.value})} style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff"}}><option value="academia">AcademIA Pro</option><option value="hebrewpro">HebrewPro AI</option></select></div>
              <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"0 0 4px"}}>Pays fournisseur</p>
                <input value={fd.pays_fournisseur} onChange={e=>setFd({...fd,pays_fournisseur:e.target.value})} placeholder="US, FR..." style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff",boxSizing:"border-box"}}/></div>
              <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"0 0 4px"}}>Date</p>
                <input type="date" value={fd.date_depense} onChange={e=>setFd({...fd,date_depense:e.target.value})} style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff",boxSizing:"border-box"}}/></div>
              <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"0 0 4px"}}>Justificatif (PDF/image)</p>
                <input type="file" accept=".pdf,image/*" onChange={e=>setFichier(e.target.files?.[0]||null)} style={{width:"100%",color:"#fff",fontSize:"13px"}}/></div>
            </div>
            <div style={{marginTop:"12px"}}><p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",margin:"0 0 4px"}}>Description</p>
              <input value={fd.description} onChange={e=>setFd({...fd,description:e.target.value})} placeholder="Abonnement API mensuel..." style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff",boxSizing:"border-box"}}/></div>
            <label style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"12px",color:"#8b5cf6",cursor:"pointer"}}>
              <input type="checkbox" checked={fd.avance_perso} onChange={e=>setFd({...fd,avance_perso:e.target.checked})}/> Avance personnelle (compte courant d associe)
            </label>
            <button onClick={ajouterDepense} disabled={envoi}
              style={{marginTop:"16px",padding:"12px 30px",background:envoi?"rgba(200,169,110,0.4)":"#c8a96e",color:"#050508",border:"none",borderRadius:"8px",fontWeight:"bold",cursor:envoi?"default":"pointer"}}>
              {envoi ? "Enregistrement..." : "Enregistrer la depense"}</button>
          </div>
        )}

        {onglet==="seuils" && (
          <div style={card}>
            <h3 style={{color:"#c8a96e"}}>Alertes seuils (hors UE)</h3>
            {alertes.length===0?<p style={{color:"#22c55e"}}>Aucun seuil approche.</p>:
              alertes.map(p=>(<div key={p} style={{padding:"10px",background:"rgba(239,68,68,0.15)",borderRadius:"8px",marginBottom:"8px"}}><strong>{p}</strong> : {parPaysHorsUE[p].toFixed(2)} EUR (seuil {seuils[p]} EUR)</div>))}
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px"}}>Seuils indicatifs a confirmer.</p>
          </div>
        )}

        {onglet==="export" && (
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}><h3 style={{color:"#c8a96e",margin:0}}>Export {trimestre}</h3><button onClick={exportCSV} style={{padding:"8px 16px",background:"#c8a96e",color:"#050508",border:"none",borderRadius:"8px",fontWeight:"bold",cursor:"pointer"}}>Export CSV</button><button onClick={exportZIP} style={{padding:"8px 16px",marginLeft:"8px",background:"#8b5cf6",color:"#fff",border:"none",borderRadius:"8px",fontWeight:"bold",cursor:"pointer"}}>Export ZIP</button></div>
            <p style={{color:"rgba(255,255,255,0.6)"}}>{facturesTrim.length} factures. TVA UE : {totalTvaADeclarer.toFixed(2)} EUR.</p>
            <table style={{width:"100%",borderCollapse:"collapse",marginTop:"10px"}}>
              <thead><tr><th style={th}>Numero</th><th style={th}>Client</th><th style={th}>HT</th><th style={th}>TVA</th><th style={th}>TTC</th><th style={th}>PDF</th></tr></thead>
              <tbody>{facturesTrim.map((f,i)=>(<tr key={i}><td style={td}>{f.numero}</td><td style={td}>{f.client_nom}</td><td style={td}>{Number(f.montant_ht).toFixed(2)}</td><td style={td}>{Number(f.montant_tva).toFixed(2)}</td><td style={td}>{Number(f.montant_ttc).toFixed(2)}</td><td style={td}>{f.pdf_url?<span onClick={()=>ouvrirPDF(f.pdf_url)} style={{color:"#c8a96e",cursor:"pointer",textDecoration:"underline"}}>PDF</span>:"-"}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
