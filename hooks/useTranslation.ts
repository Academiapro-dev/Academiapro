"use client";
import { useState, useEffect } from "react";

const cache = {};

export function useTranslation() {
  const [langue, setLangue] = useState("fr");
  const [t, setT] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("langue") || "fr";
    setLangue(saved);
    charger(saved);
  }, []);

  async function charger(lang) {
    if (cache[lang]) { setT(cache[lang]); return; }
    try {
      const r = await fetch("/locales/" + lang + ".json");
      const data = await r.json();
      cache[lang] = data;
      setT(data);
    } catch {
      if (lang !== "fr") charger("fr");
    }
  }

  function changerLangue(lang) {
    localStorage.setItem("langue", lang);
    setLangue(lang);
    charger(lang);
  }

  function get(cle) {
    const parts = cle.split(".");
    let val = t;
    for (const p of parts) {
      if (!val) return cle;
      val = val[p];
    }
    return val || cle;
  }

  return { langue, changerLangue, t: get };
}
