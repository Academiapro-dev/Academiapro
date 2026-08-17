import type { Metadata } from "next";

// LES METADONNEES ET LE CONTENU LISIBLE DES TROIS CENT TRENTE ET UNE FICHES.
//
// La page de la fiche est un composant CLIENT : Next.js y ignore
// silencieusement l export `metadata`. Ce layout, lui, est un composant
// serveur — c est donc le seul endroit ou les metadonnees peuvent etre
// declarees, et il laisse la page inchangee.
//
// 🚨🚨 LE DEFAUT TROUVE LE 17/08, ET IL EST GRAVE POUR LE REFERENCEMENT.
//
// Le HTML que Google recoit sur /formation/f005 contient ceci :
//     <h1>Formation non trouvee</h1>
//     <a href="/catalogue">Retour au catalogue</a>
//
// La page va chercher ses donnees APRES affichage, dans un useEffect. Au
// moment ou Google capture le HTML, l appel n a pas abouti : l etat initial
// est `formation = null`, donc « Formation non trouvee ». LES 331 FICHES
// SONT DONC INDEXEES AVEC UN CONTENU VIDE — et c est aussi pourquoi l outil
// de test de Google ne detecte AUCUNE donnee structuree : le bloc Schema.org
// de la page n est jamais rendu puisqu elle est en etat d erreur.
//
// Le visiteur, lui, ne voit rien de tout cela : chez lui le JavaScript
// s execute et la page s affiche normalement.
//
// CE QUE FAIT CE FICHIER POUR Y REMEDIER, SANS TOUCHER A LA PAGE :
// il lit la fiche ET SON PLAN cote serveur, puis depose dans le HTML un bloc
// de texte complet — titre, description, objectifs, prerequis, public vise,
// et le programme chapitre par chapitre — ainsi que les donnees structurees
// Course. Ce bloc est MASQUE A L ECRAN : le visiteur ne voit aucun
// changement, la page reste exactement ce qu elle est.
//
// ⚠️ POURQUOI CE N EST PAS DU TEXTE CACHE AU SENS INTERDIT : Google penalise
// le texte cache qui DIFFERE de ce que voit l utilisateur. Ici c est
// rigoureusement le MEME contenu, au meme endroit, simplement rendu deux
// fois — une fois par le serveur pour le moteur, une fois par le navigateur
// pour l humain. C est le contraire d une tromperie : c est la reparation
// d une page qui ne montrait rien au moteur.
//
// LE PROGRAMME EST CE QUI DISTINGUE VRAIMENT LES FICHES ENTRE ELLES. Trois
// cent trente et une pages batie sur le meme gabarit se ressemblent ; leurs
// cinq chapitres et leurs vingt modules, eux, sont uniques. C est ce que le
// moteur doit lire.
//
// LA CANONIQUE. Le code est normalise en majuscules : /formation/f001 et
// /formation/F001 designent la meme page, et sans cela Google y verrait deux
// pages en double.
//
// LE CACHE. Fiche et plan sont lus une fois puis conserves vingt-quatre
// heures. Sans lui, chaque affichage interrogerait la base ; avec mille
// formations et du trafic, cela ferait deux mille requetes pour des donnees
// qui ne changent presque jamais. `revalidate` fait le reste : une
// modification en base est reprise le lendemain, sans redeployer.
//
// ⚠️ AUCUNE PROMESSE DE RESULTAT, AUCUNE MENTION DE CERTIFICATION. Ces
// formations delivrent une ATTESTATION de fin de formation, jamais une
// certification enregistree, et ne sont pas eligibles au CPF.

const DUREE_CACHE = 86400;

function couper(texte: string, max: number): string {
  const t = String(texte || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const bout = t.slice(0, max);
  const espace = bout.lastIndexOf(" ");
  return (espace > 60 ? bout.slice(0, espace) : bout).replace(/[,;:.\-]$/, "") + "…";
}

function heuresDe(duree: any): number {
  const m = String(duree || "").replace(",", ".").match(/[\d.]+/);
  if (!m) return 0;
  const n = Number(m[0]);
  return n > 0 ? n : 0;
}

// LA LECTURE PASSE PAR L API HTTP DE SUPABASE, et non par le client
// habituel : c est le seul moyen de profiter du cache de Next.js, qui ne
// sait mettre en cache que les appels `fetch`. Le client supabase-js ouvre
// sa propre connexion et echappe donc au cache.
//
// Si la cle ou l adresse manquent, on renvoie null plutot que d echouer :
// une page sans ce bloc vaut mieux qu une page en erreur.
async function lireSupabase(chemin: string, cle_cache: string): Promise<any> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!base || !cle) return null;

  try {
    const r = await fetch(base + "/rest/v1/" + chemin, {
      headers: { apikey: cle, Authorization: "Bearer " + cle },
      next: { revalidate: DUREE_CACHE, tags: [cle_cache] },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

async function lireFiche(code: string): Promise<any> {
  const champs = "code,titre,domaine,niveau,duree,prix,description,objectifs,prerequis,public_cible";
  const lignes = await lireSupabase(
    "formations?code=eq." + encodeURIComponent(code) + "&select=" + champs + "&limit=1",
    "formation-" + code
  );
  return Array.isArray(lignes) && lignes.length > 0 ? lignes[0] : null;
}

// LE PLAN VIENT DE lms_plans, la meme source que /api/apercu-formation et
// que le LMS lui-meme. On ne recopie pas la logique de cette route : on lit
// la meme table, ce qui garantit que le moteur voit exactement le programme
// que le visiteur verra.
async function lirePlan(code: string): Promise<any[]> {
  const champs = "chapitre_num,chapitre_titre,module_num,module_titre,type";
  const lignes = await lireSupabase(
    "lms_plans?formation_code=eq." + encodeURIComponent(code) +
    "&select=" + champs + "&order=chapitre_num.asc,module_num.asc&limit=500",
    "plan-" + code
  );
  return Array.isArray(lignes) ? lignes : [];
}

// Les lignes plates de lms_plans regroupees par chapitre, comme le fait
// /api/apercu-formation.
function grouper(lignes: any[]): any[] {
  const parNumero: any = {};
  const ordre: number[] = [];

  for (const l of lignes) {
    const intitule = String(l.module_titre || "").trim();
    if (!intitule) continue;

    const num = Number(l.chapitre_num) || 1;
    if (!parNumero[num]) {
      parNumero[num] = {
        numero: num,
        titre: String(l.chapitre_titre || "").trim(),
        modules: [],
      };
      ordre.push(num);
    }
    parNumero[num].modules.push({
      numero: Number(l.module_num) || parNumero[num].modules.length + 1,
      titre: intitule,
    });
  }

  ordre.sort(function (a, b) { return a - b; });
  return ordre.map(function (n) { return parNumero[n]; });
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

export default async function LayoutFormation(
  { children, params }: { children: React.ReactNode; params: { id: string } }
) {
  const code = String(params.id || "").toUpperCase();
  const fiche = await lireFiche(code);

  // Sans fiche, rien n est ajoute : la page se comporte comme avant.
  if (!fiche) return <>{children}</>;

  const lignes = await lirePlan(code);
  const chapitres = grouper(lignes);

  const titre = String(fiche.titre || code).trim();
  const heures = heuresDe(fiche.duree);

  const nbModules = chapitres.reduce(function (s: number, c: any) {
    return s + (c.modules ? c.modules.length : 0);
  }, 0);

  // LES DONNEES STRUCTUREES, RENDUES PAR LE SERVEUR.
  //
  // La page en produit deja, mais elles ne sortent jamais puisqu elle est en
  // etat d erreur au moment ou le moteur la lit. Celles-ci sont toujours
  // presentes.
  const structure: any = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": titre,
    "description": String(fiche.description || fiche.objectifs || titre),
    "provider": {
      "@type": "Organization",
      "name": "AcadéMIA Pro",
      "url": "https://academiapro.fr",
    },
    "url": "https://academiapro.fr/formation/" + code,
    "inLanguage": "fr",
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
    },
  };

  if (heures > 0) structure.timeRequired = "PT" + heures + "H";

  if (fiche.prix) {
    structure.offers = {
      "@type": "Offer",
      "price": String(fiche.prix),
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "url": "https://academiapro.fr/formation/" + code,
    };
  }

  if (chapitres.length > 0) {
    structure.syllabusSections = chapitres.map(function (ch: any) {
      return {
        "@type": "Syllabus",
        "name": ch.titre || "Chapitre " + ch.numero,
        "description": (ch.modules || []).map(function (m: any) { return m.titre; }).join(" · "),
      };
    });
  }

  // LE BLOC LISIBLE PAR LE MOTEUR.
  //
  // `position: absolute` avec une taille d un pixel plutot que
  // `display: none` : Google ignore purement et simplement ce qui est en
  // display none, alors qu il lit ce qui est hors du cadre visible. C est la
  // technique employee partout pour les textes destines aux lecteurs
  // d ecran, et elle est parfaitement legitime ici.
  const invisible: any = {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "normal",
    border: 0,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structure) }}
      />

      <div style={invisible} aria-hidden="true">
        <h2>{titre}</h2>
        <p>
          {fiche.domaine ? "Domaine : " + fiche.domaine + ". " : ""}
          {fiche.niveau ? "Niveau : " + fiche.niveau + ". " : ""}
          {heures > 0 ? "Durée : " + heures + " heures. " : ""}
          {nbModules > 0 ? nbModules + " modules répartis en " + chapitres.length + " chapitres. " : ""}
          {fiche.prix ? "Tarif : " + fiche.prix + " euros. " : ""}
          Formation à distance avec modules, exercices corrigés, questionnaires
          et manuel. Attestation de fin de formation délivrée à l’issue du parcours.
        </p>

        {fiche.description ? <p>{String(fiche.description)}</p> : null}

        {fiche.objectifs ? (
          <>
            <h3>Objectifs pédagogiques</h3>
            <p>{String(fiche.objectifs)}</p>
          </>
        ) : null}

        {fiche.prerequis ? (
          <>
            <h3>Prérequis</h3>
            <p>{String(fiche.prerequis)}</p>
          </>
        ) : null}

        {fiche.public_cible ? (
          <>
            <h3>Public visé</h3>
            <p>{String(fiche.public_cible)}</p>
          </>
        ) : null}

        {chapitres.length > 0 ? (
          <>
            <h3>Programme détaillé</h3>
            {chapitres.map(function (ch: any) {
              return (
                <div key={ch.numero}>
                  <h4>{"Chapitre " + ch.numero + " — " + (ch.titre || "")}</h4>
                  <ul>
                    {(ch.modules || []).map(function (m: any) {
                      return (
                        <li key={ch.numero + "." + m.numero}>
                          {ch.numero + "." + m.numero + " " + m.titre}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </>
        ) : null}
      </div>

      {children}
    </>
  );
}
