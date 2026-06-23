"use client";
import { useState, useEffect } from "react";

const cache: Record<string, any> = {};

export function getLangue(): string {
  if (typeof window === "undefined") return "fr";
  const p = new URLSearchParams(window.location.search);
  return p.get("lang") || localStorage.getItem("langue") || "fr";
}

export function useTranslation(section?: string) {
  const [langue, setLangue] = useState<string>("fr");
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const lang = getLangue();
    setLangue(lang);
    charger(lang);
  }, []);

  async function charger(lang: string) {
    if (cache[lang]) { setData(cache[lang]); return; }
    try {
      const r = await fetch("/locales/" + lang + ".json");
      if (!r.ok) throw new Error("not found");
      const json = await r.json();
      cache[lang] = json;
      setData(json);
    } catch {
      if (lang !== "fr") {
        const r = await fetch("/locales/fr.json");
        const json = await r.json();
        cache["fr"] = json;
        setData(json);
      }
    }
  }

  function t(cle: string): string {
    const parts = cle.split(".");
    if (parts.length === 1 && section) {
      return data?.[section]?.[cle] || cle;
    }
    let val: any = data;
    for (const p of parts) {
      if (!val) return cle;
      val = val[p];
    }
    return val || cle;
  }

  return { t, langue, setLangue };
}

export default useTranslation;
