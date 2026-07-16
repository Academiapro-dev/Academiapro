"use client";
import { useState, useEffect } from "react";

const SUPABASE_URL = "https://kpxrbwsbhmggoajtxzqn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweHJid3NiaG1nZ29hanR4enFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzM0NjIsImV4cCI6MjA5NjM0OTQ2Mn0.J45gFfkK7PHhpCFJ5ahRDbRSeGdG9YO1aa0rRZP_lks";
const MOT_DE_PASSE = "COMPTA2026";
const SB = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY };

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

  useEffect(() => { if (autorise) charger(); }, [autorise, trimestre]);

  async function charger() {
    setLoading(true);
    try {
      const rf = await fetch(SUPABASE_URL+"/rest/v1/factures?select=*&order=numero.desc", { headers: SB });
      setFactures(await rf.json());
      const rt = await fetch(SUPABASE_URL+"/rest/v1/tva_par_periode?trimestre=eq."+trimestre+"&select=*&order=pays", { headers: SB });
      setTva(await rt.json());
      const rd = await fetch(SUPABASE_URL+"/rest/v1/depenses?select=*&order=date_depense.desc", { headers: SB });
      setDepenses(await rd.json());
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  async function ouvrirPDF(chemin: string) {
    try {
      const r = await fetch(SUPABASE_URL+"/storage/v1/object/sign/documents-comptables/"+chemin, {
        method:"POST", headers:{...SB,"Content-Type":"application/json"}, body: JSON.stringify({expiresIn:300})
      });
      const data = await r.json();
      if (data.signedURL) window.open(SUPABASE_URL+"/storage/v1"+data.signedURL,"_blank");
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
      // 1) obtenir URL signee
      const rs = await fetch(SUPABASE_URL+"/storage/v1/object/sign/documents-comptables/"+f.pdf_url, {
        method:"POST", headers:{...SB,"Content-Type":"application/json"}, body: JSON.stringify({expiresIn:60})
      });
      const ds = await rs.json();
      if (!ds.signedURL) { alert("PDF inaccessible"); return; }
      // 2) telecharger le PDF
      const rp = await fetch(SUPABASE_URL+"/storage/v1"+ds.signedURL);
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

  async function marquerPayee(f: any) {
    if (!confirm("Marquer la facture "+f.numero+" comme payee ?")) return;
    await fetch(SUPABASE_URL+"/rest/v1/factures?id=eq."+f.id, {
      method:"PATCH", headers:{...SB,"Content-Type":"application/json","Prefer":"return=minimal"},
      body: JSON.stringify({ statut_paiement:"payee", date_paiement: new Date().toISOString().slice(0,10) })
    });
    charger();
  }

  async function creerAvoir(f: any) {
    if (f.est_avoir) { alert("C'est deja un avoir"); return; }
    if (!confirm("Creer un AVOIR (annulation) pour la facture "+f.numero+" ?\\nMontant negatif de -"+f.montant_ttc+" EUR")) return;
    // numero d'avoir
    const ra = await fetch(SUPABASE_URL+"/rest/v1/factures?numero=like.A2026-*&select=numero&order=numero.desc&limit=1", { headers: SB });
    const av = await ra.json();
    let n = 1;
    if (av && av.length) n = parseInt(av[0].numero.split("-")[1])+1;
    const numeroAvoir = "A2026-"+String(n).padStart(4,"0");
    const avoir = {
      numero: numeroAvoir, projet: f.projet, client_nom: f.client_nom, client_email: f.client_email,
      client_pays: f.client_pays, type_client: f.type_client, numero_tva_client: f.numero_tva_client,
      montant_ht: -Math.abs(f.montant_ht), taux_tva: f.taux_tva, montant_tva: -Math.abs(f.montant_tva),
      montant_ttc: -Math.abs(f.montant_ttc), devise: f.devise, zone: f.zone, trimestre: f.trimestre,
      autoliquidation: f.autoliquidation, description: "AVOIR sur facture "+f.numero,
      statut:"emise", statut_paiement:"payee", est_avoir:true, facture_origine:f.numero,
      date_emission: new Date().toISOString().slice(0,10)
    };
    await fetch(SUPABASE_URL+"/rest/v1/factures", {
      method:"POST", headers:{...SB,"Content-Type":"application/json","Prefer":"return=minimal"},
      body: JSON.stringify(avoir)
    });
    // maj agregation TVA (soustraction)
    const rt = await fetch(SUPABASE_URL+"/rest/v1/tva_par_periode?trimestre=eq."+f.trimestre+"&pays=eq."+f.client_pays+"&select=*", { headers: SB });
    const tt = await rt.json();
    if (tt && tt.length) {
      const l = tt[0];
      await fetch(SUPABASE_URL+"/rest/v1/tva_par_periode?id=eq."+l.id, {
        method:"PATCH", headers:{...SB,"Content-Type":"application/json","Prefer":"return=minimal"},
        body: JSON.stringify({
          total_ht: Number(l.total_ht)-Math.abs(f.montant_ht),
          total_tva: Number(l.total_tva)-Math.abs(f.montant_tva),
          nb_factures: l.nb_factures+1
        })
      });
    }
    alert("Avoir "+numeroAvoir+" cree");
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
          onKeyDown={e=>e.key==="Enter"&&mdp===MOT_DE_PASSE&&setAutorise(true)}
          style={{padding:"12px",borderRadius:"8px",border:"1px solid #c8a96e",background:"rgba(255,255,255,0.05)",color:"#fff",width:"250px"}}/>
        <button onClick={()=>mdp===MOT_DE_PASSE&&setAutorise(true)}
          style={{padding:"12px 30px",background:"#c8a96e",color:"#050508",border:"none",borderRadius:"8px",fontWeight:"bold",cursor:"pointer"}}>Acceder</button>
      </div>
    );
  }

  const onglets = [["apercu","Vue d'ensemble"],["tva","TVA a declarer"],["factures","Factures"],["depenses","Depenses"],["seuils","Alertes seuils"],["export","Export trimestre"]];
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
