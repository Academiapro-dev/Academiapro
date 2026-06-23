"use client";
import { useState, useEffect } from "react";

const cache: Record<string, any> = {};

// Precharger toutes les langues au demarrage
const LANGUES = ["fr", "en", "es", "pt", "de", "ar", "he"];

async function chargerLocale(lang: string): Promise<any> {
  if (cache[lang]) return cache[lang];
  try {
    const r = await fetch("/locales/" + lang + ".json");
    if (!r.ok) throw new Error("not found");
    const json = await r.json();
    cache[lang] = json;
    return json;
  } catch {
    if (lang !== "fr") return chargerLocale("fr");
    return {};
  }
}

// Precharger fr au demarrage
if (typeof window !== "undefined") {
  chargerLocale("fr");
}

export function getLangue(): string {
  if (typeof window === "undefined") return "fr";
  const p = new URLSearchParams(window.location.search);
  return p.get("lang") || localStorage.getItem("langue") || "fr";
}

export function useTranslation(section?: string) {
  const [langue, setLangue] = useState<string>(() => {
    if (typeof window === "undefined") return "fr";
    return localStorage.getItem("langue") || "fr";
  });
  const [data, setData] = useState<any>(cache["fr"] || {});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const lang = getLangue();
    setLangue(lang);
    chargerLocale(lang).then(json => {
      setData(json);
      setReady(true);
    });
  }, []);

  function t(cle: string): string {
    const parts = cle.split(".");
    
    // Avec section implicite
    if (parts.length === 1 && section) {
      return data?.[section]?.[cle] || cache["fr"]?.[section]?.[cle] || cle;
    }
    
    // Avec chemin complet ex: "formation.niveau"
    let val: any = data;
    for (const p of parts) {
      if (val === undefined || val === null) return cache["fr"] ? getNestedFr(parts) : cle;
      val = val[p];
    }
    if (val === undefined || val === null) return cache["fr"] ? getNestedFr(parts) : cle;
    return val;
  }

  function getNestedFr(parts: string[]): string {
    let val: any = cache["fr"];
    for (const p of parts) {
      if (!val) return parts.join(".");
      val = val[p];
    }
    return val || parts.join(".");
  }

  return { t, langue, setLangue, ready };
}

export default useTranslation;
