"use client";
import { useState, useEffect } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const FR = {
  titre: "Mon Espace Apprenant",
  formations: "Formations",
  pointsXp: "Points XP",
  streak: "Streak",
  badges: "Badges",
  agentTitre: "Mon Agent IA Tuteur",
  placeholderVide: "Posez une question a votre agent tuteur...",
  placeholderInput: "Posez votre question...",
  envoyer: "Envoyer",
  erreur: "Erreur.",
  recoTitre: "Formations recommandees pour vous",
  mesFormations: "Mes Formations",
  acceder: "Acceder",
};

export default function DashboardPage() {
  const { txt } = useTraductionAuto(FR);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [reco, setReco] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [profil, setProfil] = useState<any>(null);

  useEffect(() => {
    fetch("/api/recommandation?email=contact@academiapro.fr").then(r=>r.json()).then(d=>{ if(d.success && d.recommandations) setReco(d.recommandations); });
    fetch("/api/gamification?email=contact@academiapro.fr").then(r=>r.json()).then(d=>{ if(d.profil) setProfil(d.profil); }).catch(()=>{});
    fetch(SB_URL+"/rest/v1/formations?select=code,titre,prix&order=code&limit=4",{headers:{apikey:SB_KEY,Authorization:"Bearer "+SB_KEY}}).then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setFormations(d); }).catch(()=>{});
  }, []);

  async function chercher(question: string, mots: string[]) {
    try {
      const r = await fetch("/api/catalogue");
      const cat = await r.json();
      const mq = question.toLowerCase().split(" ").filter((m:string)=>m.length>3);
      const tous = [...new Set([...mots, ...mq])];
      return cat.filter((f:any)=>tous.some((m:string)=>(f.titre||"").toLowerCase().includes(m.toLowerCase()))).slice(0,3);
    } catch { return []; }
  }

  async function envoyer() {
    if (!message.trim()) return;
    const q = message;
    setMessage(""); setReco([]);
    setChat(p=>[...p,{role:"user",text:q}]);
    setLoading(true);
    try {
      const r = await fetch("/api/agent-tuteur",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q,formation_titre:"AcadeMIA Pro",historique:chat})});
      const d = await r.json();
      let rep = d.reply || "";
      let mots: string[] = [];
      const SEP = "FORMATIONS_RECOMMANDEES:";
      const idx = rep.indexOf(SEP);
      if (idx > -1) {
        const ap = rep.slice(idx+SEP.length);
        const fi = ap.indexOf("\n");
        mots = (fi>-1?ap.slice(0,fi):ap).split(",").map((m:string)=>m.trim()).filter(Boolean);
        rep = rep.slice(0,idx).trim();
      }
      const res = await chercher(q, mots);
      if (res.length>0) setReco(res);
      setChat(p=>[...p,{role:"agent",text:rep}]);
    } catch {
      setChat(p=>[...p,{role:"agent",text:txt.erreur}]);
    }
    setLoading(false);
  }

  return (
    <div style={{backgroundColor:"#050508",minHeight:"100vh",color:"#fff",padding:"30px 20px"}}>
      <div style={{maxWidth:"900px",margin:"0 auto"}}>
        <h1 style={{color:"#c8a96e",fontFamily:"Georgia,serif",marginBottom:"25px"}}>{txt.titre}</h1>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"15px",marginBottom:"35px"}}>
          {[
            {titre:txt.formations,valeur:formations.length.toString(),icon:"🎓"},
            {titre:txt.pointsXp,valeur:profil?.xp?.toLocaleString()||"0",icon:"⭐"},
            {titre:txt.streak,valeur:(profil?.streak||0)+"j",icon:"🔥"},
            {titre:txt.badges,valeur:(profil?.badges?.length||0).toString(),icon:"🏆"},
          ].map(item=>(
            <div key={item.titre} style={{background:"rgba(200,169,110,0.1)",border:"1px solid rgba(200,169,110,0.3)",borderRadius:"12px",padding:"20px",textAlign:"center"}}>
              <div style={{fontSize:"28px",marginBottom:"8px"}}>{item.icon}</div>
              <div style={{color:"#c8a96e",fontSize:"22px",fontWeight:"bold"}}>{item.valeur}</div>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:"11px",marginTop:"4px"}}>{item.titre}</div>
            </div>
          ))}
        </div>
        <h2 style={{color:"#c8a96e",fontFamily:"Georgia,serif",marginBottom:"15px"}}>🤖 {txt.agentTitre}</h2>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:"12px",padding:"20px",minHeight:"280px",marginBottom:"15px",maxHeight:"400px",overflowY:"auto"}}>
          {chat.length===0&&<p style={{color:"rgba(255,255,255,0.3)",textAlign:"center",marginTop:"100px"}}>{txt.placeholderVide}</p>}
          {chat.map((msg,i)=>(
            <div key={i} style={{marginBottom:"15px",display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
              <div style={{background:msg.role==="user"?"#c8a96e":"rgba(255,255,255,0.08)",color:msg.role==="user"?"#050508":"#fff",padding:"12px 16px",borderRadius:"12px",maxWidth:"80%",lineHeight:"1.7",fontSize:"14px"}}>{msg.text}</div>
            </div>
          ))}
          {loading&&<div style={{color:"#c8a96e",textAlign:"center",padding:"10px"}}>...</div>}
        </div>
        <div style={{display:"flex",gap:"10px",marginBottom:"25px"}}>
          <input type="text" placeholder={txt.placeholderInput} value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==="Enter"&&envoyer()} style={{flex:1,padding:"12px",borderRadius:"8px",border:"1px solid rgba(200,169,110,0.3)",background:"rgba(255,255,255,0.05)",color:"#fff"}}/>
          <button onClick={envoyer} disabled={loading} style={{padding:"12px 24px",background:"#c8a96e",color:"#050508",border:"none",borderRadius:"8px",fontWeight:"bold",cursor:"pointer"}}>{txt.envoyer}</button>
        </div>
        {reco.length>0&&(
          <div style={{marginBottom:"30px"}}>
            <h3 style={{color:"#c8a96e",fontFamily:"Georgia,serif",marginBottom:"12px",fontSize:"16px"}}>{txt.recoTitre}</h3>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {reco.map((f:any)=>(
                <a key={f.code} href={"/formation/"+f.code} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(200,169,110,0.1)",border:"1px solid rgba(200,169,110,0.3)",borderRadius:"10px",padding:"14px 18px",textDecoration:"none"}}>
                  <span style={{color:"#fff",fontSize:"14px"}}>{f.titre}</span>
                  <span style={{color:"#c8a96e",fontWeight:"bold",fontSize:"14px"}}>{f.prix}€ →</span>
                </a>
              ))}
            </div>
          </div>
        )}
        <div style={{marginTop:"10px"}}>
          <h2 style={{color:"#c8a96e",fontFamily:"Georgia,serif",marginBottom:"15px"}}>🎓 {txt.mesFormations}</h2>
          <div style={{display:"grid",gap:"12px"}}>
            {formations.map((f:any)=>(
              <div key={f.code} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:"10px",padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:"rgba(255,255,255,0.8)",fontSize:"14px"}}>{f.code} — {f.titre}</span>
                <a href={"/formation/"+f.code} style={{background:"#c8a96e",color:"#050508",padding:"8px 16px",borderRadius:"6px",textDecoration:"none",fontSize:"13px",fontWeight:"bold"}}>{txt.acceder}</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
