import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ══════════════════════════════════════════════════════════════════════════
// L EXPORT DES DONNEES D UN ORGANISME — 06/09.
//
// POURQUOI. La vitrine Mr CRM ecrit, dans « Comment cela se passe » : « Vos
// donnees — contacts, historique, documents — vous appartiennent et vous
// sont restituees sur demande, dans un format exploitable. » Tant que rien
// ne permettait de les sortir, c etait la seule promesse publique que
// l outil ne tenait pas.
//
// 🚨 UN CLIENT DOIT POUVOIR PARTIR. C est ce qui rend credible le fait
// qu il reste : une base qu on ne peut pas recuperer est une base qu on
// hesite a remplir.
//
// FORMAT CSV, ET C EST DELIBERE. « Exploitable » veut dire ouvrable dans un
// tableur sans rien installer. Un JSON serait plus fidele mais illisible
// pour celui qui le demande.
//
// ⚠️ SEPARATEUR POINT-VIRGULE, ET BOM EN TETE. Excel en francais lit le
// point-virgule, pas la virgule — un fichier a virgules s ouvre en une
// seule colonne. Et sans BOM, les accents s affichent en caracteres
// abimes : « Régime » devient « RÃ©gime ». Deux details qui decident si le
// fichier est utilisable ou non.
//
// ⚠️ TOUT EST FILTRE SUR LE TENANT DE LA SESSION. Un export qui laisserait
// passer les fiches d un autre organisme serait la pire fuite possible :
// un fichier, chez un client, qu on ne peut plus reprendre.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// 🚨 L ECHAPPEMENT CSV, ET IL N EST PAS FACULTATIF. Une note contenant un
// point-virgule, un guillemet ou un retour a la ligne decalerait toutes les
// colonnes suivantes — le fichier resterait ouvrable, mais faux.
// La regle : on entoure de guillemets, et on double les guillemets internes.
function cellule(v: any): string {
  if (v === null || v === undefined) return "";
  const t = String(v);
  if (t.indexOf(";") < 0 && t.indexOf('"') < 0
      && t.indexOf("\n") < 0 && t.indexOf("\r") < 0) {
    return t;
  }
  return '"' + t.split('"').join('""') + '"';
}

function ligne(valeurs: any[]): string {
  return valeurs.map(cellule).join(";");
}

function jour(d: any): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch (e) {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const email = emailDeSession();
  const tenant = tenantDeSession();
  if (!email) {
    return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });
  }
  if (!tenant) {
    return NextResponse.json(
      { ok: false, erreur: "Aucun organisme rattaché à votre compte." },
      { status: 403 }
    );
  }

  const quoi = String(req.nextUrl.searchParams.get("quoi") || "contacts");

  // ---- LES APPELS ----
  if (quoi === "appels") {
    const { data, error } = await supabase
      .from("crm_appels")
      .select("fiche_email, numero, sens, duree_min, resultat, notes, appele_le, rappeler_le, saisi_par")
      .eq("tenant_id", tenant)
      .order("appele_le", { ascending: false })
      .limit(10000);

    if (error) {
      console.error("[organisme/export] appels : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Export impossible." }, { status: 500 });
    }

    const lignes = [ligne([
      "Contact", "Numéro", "Sens", "Durée (min)", "Résultat",
      "Ce qui a été dit", "Date de l'appel", "Rappeler le", "Saisi par",
    ])];

    for (const a of data || []) {
      lignes.push(ligne([
        a.fiche_email, a.numero, a.sens, a.duree_min, a.resultat,
        a.notes, jour(a.appele_le), jour(a.rappeler_le), a.saisi_par,
      ]));
    }

    return fichier(lignes.join("\r\n"), "appels");
  }

  // ---- LES CONTACTS ----
  //
  // ⚠️ ON LIT AUSSI LES COLONNES PERSONNALISEES ET LES CAMPAGNES : sans
  // leurs libelles, l export porterait des cles techniques
  // (`a_jour_de_ses_pieces`) que personne ne saurait relire.
  const [fichesR, colonnesR, campagnesR] = await Promise.all([
    supabase
      .from("crm")
      .select("nom, email, telephone, organisme, ville, statut, score, source, "
        + "formation_interesse, campagne, produits, champs, notes, "
        + "derniere_interaction, relance_le, relances, motif_perte, perdu_le, desinscrit")
      .eq("tenant_id", tenant)
      .order("nom", { ascending: true })
      .limit(10000),
    supabase
      .from("crm_champs")
      .select("cle, libelle, type")
      .eq("tenant_id", tenant)
      .eq("actif", true)
      .order("rang", { ascending: true }),
    supabase
      .from("crm_campagnes")
      .select("cle, libelle")
      .eq("tenant_id", tenant),
  ]);

  if (fichesR.error) {
    console.error("[organisme/export] contacts : " + fichesR.error.message);
    return NextResponse.json({ ok: false, erreur: "Export impossible." }, { status: 500 });
  }

  const colonnes = colonnesR.data || [];
  const campagnes = campagnesR.data || [];

  function libelleCampagne(cle: any): string {
    const c = campagnes.filter(function (x: any) { return x.cle === cle; })[0];
    return c ? c.libelle : String(cle || "");
  }

  const entetes = [
    "Nom", "Adresse électronique", "Téléphone", "Organisme", "Ville",
    "Étape", "Score", "Origine", "Formation", "Campagne",
    "Autres campagnes", "Notes", "Dernier contact", "Dernière relance",
    "Nombre de relances", "Motif de perte", "Perdu le", "Désinscrit",
  ].concat(colonnes.map(function (c: any) { return c.libelle; }));

  const lignes = [ligne(entetes)];

  for (const f of fichesR.data || []) {
    // Les campagnes secondaires, avec leur date d envoi quand elle existe.
    const p = f.produits && typeof f.produits === "object" ? f.produits : {};
    const secondaires = Object.keys(p).map(function (cle) {
      return libelleCampagne(cle) + (p[cle] ? " (envoyé le " + jour(p[cle]) + ")" : " (en attente)");
    }).join(" · ");

    const base = [
      f.nom, f.email, f.telephone, f.organisme, f.ville,
      f.statut, f.score, f.source, f.formation_interesse,
      libelleCampagne(f.campagne), secondaires, f.notes,
      jour(f.derniere_interaction), jour(f.relance_le), f.relances,
      f.motif_perte, jour(f.perdu_le), f.desinscrit ? "oui" : "",
    ];

    // ⚠️ CHAQUE COLONNE PERSONNALISEE EST RENDUE SELON SON TYPE : une case
    // a cocher doit dire « oui » ou rien, pas « true ». Un tableur relit
    // mal les valeurs anglaises, et le client ne les comprend pas.
    const v = f.champs && typeof f.champs === "object" ? f.champs : {};
    for (const c of colonnes) {
      const x = v[c.cle];
      if (x === null || x === undefined || x === "") base.push("");
      else if (c.type === "case") base.push(x ? "oui" : "non");
      else if (c.type === "date") base.push(jour(x));
      else base.push(x);
    }

    lignes.push(ligne(base));
  }

  return fichier(lignes.join("\r\n"), "contacts");
}

// 🚨 LE BOM (\uFEFF) EN PREMIER CARACTERE. Sans lui, Excel lit le fichier
// en encodage local et abime tous les accents. Trois octets qui decident
// si le fichier est presentable ou non.
function fichier(contenu: string, nom: string) {
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("\uFEFF" + contenu, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="' + nom + "-" + date + '.csv"',
      "Cache-Control": "no-store",
    },
  });
}
