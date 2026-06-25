"use client";

import { useState, useRef, useCallback } from "react";

interface PageManuel {
  type: "citation" | "titre_section" | "paragraphe" | "liste";
  contenu: string;
  auteur?: string;
  oeuvre?: string;
  annee?: string;
}

interface ManuelDynamiqueProps {
  titre: string;
  formation: string;
  apprenant: string;
  pages: PageManuel[];
}

export default function ManuelDynamique({ titre, formation, apprenant, pages }: ManuelDynamiqueProps) {
  const [pageActuelle, setPageActuelle] = useState(0);
  const [direction, setDirection] = useState("next");
  const [isAnimating, setIsAnimating] = useState(false);
  const audioRef = useRef(null);
  const totalPages = pages.length;
  const page = pages[pageActuelle];

  const jouerSonPage = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/page-turn.mp3");
        audioRef.current.volume = 0.6;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (e) {}
  }, []);

  const allerPage = useCallback((dir) => {
    if (isAnimating) return;
    if (dir === "next" && pageActuelle >= totalPages - 1) return;
    if (dir === "prev" && pageActuelle <= 0) return;
    jouerSonPage();
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setPageActuelle(p => dir === "next" ? p + 1 : p - 1);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, pageActuelle, totalPages, jouerSonPage]);

  const renderPage = (page) => {
    switch (page.type) {
      case "citation":
        return (
          <blockquote style={{borderLeft:"4px solid #c8a96e",paddingLeft:"24px",margin:"32px 0",fontStyle:"italic",color:"#444",fontFamily:"Georgia,serif",fontSize:"16px",lineHeight:"1.9"}}>
            <span>{page.contenu}</span>
            {page.auteur && (
              <span style={{display:"block",marginTop:"12px",fontSize:"14px",color:"#666",fontStyle:"normal"}}>
                — {page.auteur}{page.oeuvre && <em>, {page.oeuvre}</em>}{page.annee && ", " + page.annee}
              </span>
            )}
          </blockquote>
        );
      case "titre_section":
        return <h2 style={{fontFamily:"Georgia,serif",fontSize:"22px",fontWeight:"bold",color:"#c8a96e",margin:"32px 0 20px 0"}}>{page.contenu}</h2>;
      case "paragraphe":
        return <p style={{fontFamily:"Georgia,serif",fontSize:"16px",lineHeight:"1.9",color:"#1a1a1a",textAlign:"justify",margin:"0 0 24px 0"}}>{page.contenu}</p>;
      case "liste":
        return (
          <ul style={{fontFamily:"Georgia,serif",fontSize:"16px",lineHeight:"2",color:"#1a1a1a",paddingLeft:"24px"}}>
            {page.contenu.split("\n").map((item, i) => <li key={i} style={{marginBottom:"8px"}}>{item}</li>)}
          </ul>
        );
    }
  };

  const animClass = isAnimating ? (direction === "next" ? "page-exit-left" : "page-exit-right") : "page-enter-right";

  return (
    <>
      <style>{`
        @keyframes enterFromRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes exitToLeft { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(-30px)} }
        @keyframes exitToRight { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(30px)} }
        .page-enter-right{animation:enterFromRight 0.3s ease forwards}
        .page-exit-left{animation:exitToLeft 0.3s ease forwards}
        .page-exit-right{animation:exitToRight 0.3s ease forwards}
      `}</style>

      <div style={{background:"#f5f5f5",minHeight:"100vh",padding:"24px",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{background:"#c8a96e",color:"#fff",padding:"6px 16px",borderRadius:"20px",fontSize:"12px",fontWeight:"bold",letterSpacing:"1px",marginBottom:"16px",textTransform:"uppercase"}}>
          Manuel de Formation — {formation}
        </div>

        <div className={animClass} style={{background:"#ffffff",borderRadius:"12px",boxShadow:"0 4px 30px rgba(0,0,0,0.12)",padding:"48px",maxWidth:"780px",width:"100%",minHeight:"520px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div style={{borderBottom:"1px solid #f0e8d8",paddingBottom:"16px",marginBottom:"32px"}}>
            <h1 style={{fontFamily:"Georgia,serif",fontSize:"20px",color:"#1a1a1a",margin:"0 0 6px 0"}}>{titre}</h1>
            <p style={{fontSize:"13px",color:"#888",margin:0}}>Préparé pour <strong style={{color:"#c8a96e"}}>{apprenant}</strong></p>
          </div>

          <div style={{flex:1}}>{renderPage(page)}</div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"40px",paddingTop:"20px",borderTop:"1px solid #f0e8d8"}}>
            <button onClick={() => allerPage("prev")} disabled={pageActuelle === 0 || isAnimating}
              style={{background:"transparent",border:"1px solid #333",color:"#333",padding:"10px 22px",borderRadius:"6px",fontSize:"14px",cursor:"pointer",fontFamily:"Georgia,serif",opacity:pageActuelle===0?0.3:1}}>
              ← Précédent
            </button>
            <span style={{fontSize:"14px",color:"#888",fontFamily:"Georgia,serif"}}>
              Page {pageActuelle + 1} / {totalPages}
            </span>
            <button onClick={() => allerPage("next")} disabled={pageActuelle === totalPages - 1 || isAnimating}
              style={{background:"#c8a96e",border:"none",color:"#ffffff",padding:"10px 22px",borderRadius:"6px",fontSize:"14px",fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif",opacity:pageActuelle===totalPages-1?0.3:1}}>
              Suivant →
            </button>
          </div>
        </div>

        <div style={{marginTop:"16px",display:"flex",gap:"4px"}}>
          {pages.map((_, i) => (
            <div key={i} style={{width:i===pageActuelle?"20px":"6px",height:"6px",borderRadius:"3px",background:i===pageActuelle?"#c8a96e":i<pageActuelle?"#e8d5a3":"#ddd",transition:"all 0.3s ease"}}/>
          ))}
        </div>
      </div>
    </>
  );
}