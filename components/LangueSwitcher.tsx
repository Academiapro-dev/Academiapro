"use client";
import { useState, useEffect, createContext, useContext } from "react";

export const LangueContext = createContext<any>({ langue: "fr", setLangue: () => {} });

export function LangueProvider({ children }: { children: React.ReactNode }) {
  const [langue, setLangue] = useState("fr");

  useEffect(() => {
    const saved = localStorage.getItem("langue") || "fr";
    setLangue(saved);
  }, []);

  function changerLangue(l: string) {
    setLangue(l);
    localStorage.setItem("langue", l);
  }

  return (
    <LangueContext.Provider value={{ langue, setLangue: changerLangue }}>
      {children}
    </LangueContext.Provider>
  );
}

export function useLangue() {
  return useContext(LangueContext);
}

const LANGUES = [
  { code: "fr", label: "FR", drapeau: "🇫🇷", nom: "Français" },
  { code: "en", label: "EN", drapeau: "🇬🇧", nom: "English" },
  { code: "es", label: "ES", drapeau: "🇪🇸", nom: "Español" },
  { code: "pt", label: "PT", drapeau: "🇧🇷", nom: "Português" },
  { code: "de", label: "DE", drapeau: "🇩", nom: "Deutsch" },
  { code: "ar", label: "AR", drapeau: "🇸🇦", nom: "العربية" },
  { code: "he", label: "HE", drapeau: "🇮🇱", nom: "עברית" },
];


export default function LangueSwitcher() {
  const { langue, setLangue } = useLangue();
  const [ouvert, setOuvert] = useState(false);

  const langueActuelle = LANGUES.find(l => l.code === langue) || LANGUES[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOuvert(!ouvert)}
        style={{ background: "rgba(200,169,110,0.2)", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "bold" }}
      >
        {langueActuelle.drapeau} {langueActuelle.label} ▾
      </button>

      {ouvert && (
        <div style={{ position: "absolute", top: "40px", right: 0, background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", overflow: "hidden", zIndex: 1000, minWidth: "150px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          {LANGUES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLangue(l.code); setOuvert(false); }}
              style={{ width: "100%", padding: "10px 15px", background: langue === l.code ? "rgba(200,169,110,0.2)" : "none", border: "none", color: langue === l.code ? "#c8a96e" : "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", textAlign: "left" }}
            >
              <span>{l.drapeau}</span>
              <span>{l.nom}</span>
              {langue === l.code && <span style={{ marginLeft: "auto", color: "#c8a96e" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
