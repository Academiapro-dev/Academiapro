import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

// LES METADONNEES DES TROIS CENT TRENTE ET UNE FICHES.
//
// La page de la fiche est un composant CLIENT : Next.js y ignore
// silencieusement l export `metadata`. Ce layout, lui, est un composant
// serveur — c est donc le seul endroit ou les metadonnees peuvent etre
// declarees, et il laisse la page inchangee.
//
// LA CANONIQUE. Le code est normalise en majuscules : /formation/f001 et
// /formation/F001 designent la meme page, et sans cela Google y verrait deux
// pages en double.
//
// 🆕 LE TITRE ET LA DESCRIPTION — ajoutes le 17/08. Le layout ne declarait
// que la canonique : les 331 fiches partageaient donc le meme intitule
// generique dans les resultats de recherche, ce qui les rendait
// indistinguables. Or ces pages sont TROIS CENTS PORTES D ENTREE GRATUITES,
// et le referencement met trois a six mois a porter — c est maintenant qu il
// faut les poser, pas quand les clients arriveront.
//
// 🚨 LA MISE EN CACHE EST FAITE ICI, PAS PLUS TARD. J avais d abord livre ce
// fichier sans cache, en signalant qu il faudrait l ajouter le jour ou le
// catalogue grossirait. Jacques a repris cette facon de faire, et il a
// raison : « si plus tard il faut rajouter un cache, on le fait des
// maintenant ». Un manque signale et non comble est un manque que personne
// ne comblera — surtout dans un fichier qu on ne rouvre jamais.
//
// CE QUE FAIT LE CACHE : la fiche est lue une fois puis conservee vingt-
// quatre heures. Sans lui, chaque affichage d une page interroge la base ;
// avec mille formations et du trafic, cela ferait mille requetes pour des
// donnees qui ne changent presque jamais. `revalidate` fait le reste : une
// modification en base est reprise le lendemain, sans redeployer.
//
// LE TITRE PORTE LE TITRE REEL DE LA FORMATION, lu en base. La description
// reprend les objectifs quand ils existent, sinon une phrase construite a
// partir du domaine et de la duree.
//
// ⚠️ AUCUNE PROMESSE DE RESULTAT, AUCUNE MENTION DE CERTIFICATION. Ces
// formations delivrent une ATTESTATION de fin de formation, jamais une
// certification enregistree, et ne sont pas eligibles au CPF. Ce qui est
// ecrit ici est lu par Google et par le visiteur : les memes regles que sur
// le reste du site s appliquent.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Vingt-quatre heures. Une fiche de formation ne change pas dans la journee,
// et une modification en base est reprise le lendemain sans redeploiement.
const DUREE_CACHE = 86400;

function couper(texte: string, max: number): string {
  const t = String(texte || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const bout = t.slice(0, max);
  const espace = bout.lastIndexOf(" ");
  return (espace > 60 ? bout.slice(0, espace) : bout).replace(/[,;:.\-]$/, "") + "…";
}

// LA LECTURE PASSE PAR L API HTTP DE SUPABASE, et non par le client
// habituel : c est le seul moyen de profiter du cache de Next.js, qui ne
// sait mettre en cache que les appels `fetch`. Le client supabase-js ouvre
// sa propre connexion et echappe donc au cache.
//
// Si la cle ou l adresse manquent, on renvoie null plutot que d echouer :
// une metadonnee absente vaut mieux qu une page en erreur.
async function lireFiche(code: string): Promise<any> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!base || !cle) return null;

  const champs = "code,titre,domaine,niveau,duree,objectifs,public_cible";
  const adresse = base + "/rest/v1/formations?code=eq." + encodeURIComponent(code)
    + "&select=" + champs + "&limit=1";

  try {
    const r = await fetch(adresse, {
      headers: { apikey: cle, Authorization: "Bearer " + cle },
      next: { revalidate: DUREE_CACHE, tags: ["formation-" + code] },
    });
    if (!r.ok) return null;
    const lignes = await r.json();
    return Array.isArray(lignes) && lignes.length > 0 ? lignes[0] : null;
  } catch (e) {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const code = String(params.id || "").toUpperCase();
  const canonique = "/formation/" + code;

  const fiche = await lireFiche(code);

  if (!fiche) {
    return {
      title: "Formation " + code + " — AcadéMIA Pro",
      alternates: { canonical: canonique },
    };
  }

  const titre = String(fiche.titre || code).trim();

  // Le titre reste sous soixante caracteres avec le suffixe, sans quoi
  // Google le tronque au milieu d un mot dans ses resultats.
  const titrePage = couper(titre, 46) + " — Formation à distance | AcadéMIA Pro";

  const morceaux: string[] = [];
  if (fiche.duree) morceaux.push("Formation de " + fiche.duree + " heures à distance");
  else morceaux.push("Formation professionnelle à distance");
  if (fiche.domaine) morceaux.push("domaine " + String(fiche.domaine).toLowerCase());
  if (fiche.niveau) morceaux.push("niveau " + String(fiche.niveau).toLowerCase());

  const contexte = morceaux.join(", ") + ".";

  // Les objectifs disent ce que le stagiaire saura faire — c est ce qui
  // decide un visiteur, bien mieux qu une phrase de presentation.
  const description = fiche.objectifs
    ? couper(titre + " — " + String(fiche.objectifs), 155)
    : couper(
        titre + ". " + contexte + " Modules, exercices corrigés, questionnaires " +
        "et manuel. Attestation de fin de formation.",
        155
      );

  return {
    title: titrePage,
    description: description,
    keywords: [
      titre,
      "formation " + titre.toLowerCase(),
      fiche.domaine ? "formation " + String(fiche.domaine).toLowerCase() : "",
      "formation à distance",
      "formation professionnelle",
    ].filter(Boolean),
    alternates: { canonical: canonique },
    openGraph: {
      title: titre + " — AcadéMIA Pro",
      description: description,
      url: canonique,
      siteName: "AcadéMIA Pro",
      locale: "fr_FR",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: couper(titre, 60),
      description: description,
    },
  };
}

export default function LayoutFormation({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
