"use client";
import { useEffect } from "react";

// Reconcilie la langue memorisee (localStorage) avec la
// langue de l URL du blog : une seule source de verite,
// l URL. Si divergence a l arrivee, on redirige.
// langues avec blog dedie : fr (/blog), en (/en/blog),
// es (/es/blog). Les autres langues restent sur /blog.

export default function AiguillageLangueBlog(
  { languePage }: { languePage: string }) {
  useEffect(() => {
    try {
      const memorisee =
        localStorage.getItem("langue") || "fr";
      const cibles: Record<string, string> = {
        fr: "/blog", en: "/en/blog", es: "/es/blog",
      };
      const langueEffective =
        cibles[memorisee] ? memorisee : "fr";
      if (langueEffective !== languePage) {
        const chemin = window.location.pathname;
        const cible = cibles[langueEffective];
        if (chemin !== cible) {
          window.location.replace(cible);
        }
      }
    } catch (e) { /* localStorage indisponible */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
