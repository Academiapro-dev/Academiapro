"use client";
import { useState, useEffect } from "react";
import { useTraductionAuto } from "../../hooks/useTraductionAuto";

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
  recoAide: "Ces formations ne sont pas les votres : ce sont des suggestions du catalogue.",
  mesFormations: "Mes Formations",
  acceder: "Acceder",
  voirCatalogue: "Voir les formations",
  connecteAvec: "Vous etes connecte avec",
  aucuneFormation: "Aucune formation n est rattachee a cette adresse.",
  aucuneAide: "Si votre organisme de formation vous a inscrit, verifiez que c est bien l adresse qu il a utilisee. Sinon, decouvrez le catalogue.",
};

export default function DashboardPage() {
  const { txt } = useTraductionAuto(FR);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [reco, setReco] = useState<any[]>([]);
  const [mesFormations, setMesFormations] = useState<any[]>([]);
  const [profil, setProfil] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [chargement, setChargement] = useState(true);

  // L IDENTITE VIENT DE LA SESSION, ET D ELLE SEULE.
  //
  // La page interrogeait l authentification Supabase, avec un repli code en
  // dur sur une adresse : elle ne pouvait donc pas savoir qui etait vraiment
  // connecte. La route /api/mes-formations lit le cookie signe et renvoie
  // l adresse reelle : c est elle qui fait foi, et on s en sert pour la suite.
  useEffect(() => {
    fetch("/api/mes-formations")
      .then(r => r.json())
      .then(d => {
        if (d.email) setEmail(d.email);
        if (d.success && Array.isArray(d.formations)) setMesFormations(d.formations);
        setChargement(false);

        const adresse = d.email || "";
        if (!adresse) return;

        fetch("/api/recommandation?email=" + encodeURIComponent(adresse))
          .then(r => r.json())
          .then(x => { if (x.success && x.recommandations) setReco(x.recommandations); })
          .catch(() => {});

        fetch("/api/gamification?email=" + encodeURIComponent(adresse))
          .then(r => r.json())
          .then(x => { if (x.profil) setProfil(x.profil); })
          .catch(() => {});
      })
      .catch(() => setChargement(false));
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
        <h1 style={{color:"#c8a96e",fontFamily:"Georgia,serif",marginBottom:"6px"}}>{txt.titre}</h1>

        {/* L ADRESSE CONNECTEE, TOUJOURS VISIBLE. Sans elle, un stagiaire
            inscrit par son organisme ne peut pas comprendre pourquoi son
            espace est vide : il croit que son inscription a echoue. */}
        {email && (
          <p style={{color:"rgba(255,255,255,0.45)",fontSize:"13px",marginTop:0,marginBottom:"25px"}}>
            {txt.connecteAvec} <span style={{color:"#c8a96e"}}>{email}</span>
          </p>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"15px",marginBottom:"35px"}}>
          {[
            {titre:txt.formations,valeur:mesFormations.length.toString(),icon:"🎓"},
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

        {/* MES FORMATIONS EN PREMIER. Elles etaient releguees tout en bas,
            sous le bloc de recommandations qui affiche des prix : on croyait
            devoir acheter ce a quoi on avait deja acces. */}
        <div style={{marginBottom:"35px"}}>
          <h2 style={{color:"#c8a96e",fontFamily:"Georgia,serif",marginBottom:"15px"}}>🎓 {txt.mesFormations}</h2>

          {chargement ? (
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:"10px",padding:"20px"}}>
              <p style={{color:"rgba(255,255,255,0.5)",fontSize:"14px",margin:0}}>...</p>
            </div>
          ) : mesFormations.length === 0 ? (
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:"10px",padding:"22px",textAlign:"center"}}>
              <p style={{color:"rgba(255,255,255,0.75)",fontSize:"15px",marginBottom:"10px"}}>{txt.aucuneFormation}</p>
              <p style={{color:"rgba(255,255,255,0.5)",fontSize:"13.5px",lineHeight:"1.7",marginBottom:"16px"}}>{txt.aucuneAide}</p>
              <a href="/formations" style={{background:"#c8a96e",color:"#050508",padding:"10px 20px",borderRadius:"8px",textDecoration:"none",fontSize:"13px",fontWeight:"bold"}}>{txt.voirCatalogue}</a>
            </div>
          ) : (
            <div style={{display:"grid",gap:"12px"}}>
              {mesFormations.map((f:any)=>(
                <div key={f.code} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(200,169,110,0.2)",borderRadius:"10px",padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
                  <span style={{color:"rgba(255,255,255,0.8)",fontSize:"14px"}}>{f.code} — {f.titre}{f.formule ? " · " + f.formule : ""}</span>
                  <a href={"/formation/"+f.code} style={{background:"#c8a96e",color:"#050508",padding:"8px 16px",borderRadius:"6px",textDecoration:"none",fontSize:"13px",fontWeight:"bold"}}>{txt.acceder}</a>
                </div>
              ))}
            </div>
          )}
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
            <h3 style={{color:"#c8a96e",fontFamily:"Georgia,serif",marginBottom:"4px",fontSize:"16px"}}>{txt.recoTitre}</h3>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12.5px",marginTop:0,marginBottom:"12px"}}>{txt.recoAide}</p>
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
      </div>
    </div>
  );
}
