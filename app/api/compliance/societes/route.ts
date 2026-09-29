import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { dossiersAutorises, tenantCourant, estAdmin, peutGererEquipe } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const REGIMES_FISCAUX: any = {
  is: "Impôt sur les sociétés",
  ir_bic: "Impôt sur le revenu - BIC",
  ir_bnc: "Impôt sur le revenu - BNC",
  micro: "Micro-entreprise",
  a_determiner: "À déterminer",
};

const REGIMES_TVA: any = {
  reel_normal: "Réel normal - CA3 mensuelle",
  reel_simplifie: "Réel simplifié - CA12 annuelle",
  franchise: "Franchise en base",
  non_assujetti: "Non assujetti",
};

// Le pays decide de ce que le logiciel a le droit de reclamer : un SIREN, une
// liasse, une TVA francaise. Il se declare, il ne se devine pas.
const PAYS: any = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  LU: "Luxembourg",
  MC: "Monaco",
  ES: "Espagne",
  IT: "Italie",
  DE: "Allemagne",
  PT: "Portugal",
  NL: "Pays-Bas",
  IE: "Irlande",
  GB: "Royaume-Uni",
  US: "États-Unis",
  CA: "Canada",
  MA: "Maroc",
  TN: "Tunisie",
  IL: "Israël",
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

function refuse() {
  return NextResponse.json(
    { ok: false, erreur: "Ouvrir ou modifier un dossier est réservé aux associés du cabinet." },
    { status: 403 }
  );
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t ? t.slice(0, max) : null;
}

// 🆕 29/09 — L IDENTITE D EMPLOYEUR. Le bulletin imprime le SIRET, le code
// APE et l adresse de l employeur ; la DSN ne se genere pas sans SIRET. Ces
// colonnes existaient en base, mais AUCUN ECRAN ne les remplissait : un
// dossier ouvert par un cabinet ne pouvait ni sortir un bulletin complet ni
// produire sa DSN (TEST DSN SAS avait ete preparee directement en base).

// La cle de Luhn du SIRET (et la regle propre a La Poste, SIREN 356000000,
// dont les etablissements ont une somme de chiffres multiple de 5).
function siretValide(v: string): boolean {
  if (!/^\d{14}$/.test(v)) return false;
  if (v.slice(0, 9) === "356000000") {
    let t = 0;
    for (const c of v) t += Number(c);
    return t % 5 === 0;
  }
  let somme = 0;
  for (let i = 0; i < 14; i++) {
    let n = Number(v[13 - i]);
    if (i % 2 === 1) { n = n * 2; if (n > 9) n = n - 9; }
    somme += n;
  }
  return somme % 10 === 0;
}

// Controle et mise en forme des champs d employeur. Chaque champ n est
// touche QUE s il est envoye : un enregistrement qui ne le porte pas (un
// autre ecran, une ancienne page encore ouverte) ne l efface pas.
function identiteEmployeur(b: any, fiche: any): string | null {
  if (b.siret !== undefined) {
    const v = String(b.siret || "").replace(/\D/g, "");
    if (v && !siretValide(v)) {
      return "Le SIRET " + v + " n'est pas valide : il faut 14 chiffres, et sa clé de contrôle ne correspond pas.";
    }
    fiche.siret = v || null;
  }
  if (b.code_ape !== undefined) {
    const v = String(b.code_ape || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (v && !/^\d{4}[A-Z]$/.test(v)) {
      return "Le code APE s'écrit avec quatre chiffres et une lettre (exemple : 6920Z).";
    }
    fiche.code_ape = v || null;
  }
  if (b.code_postal !== undefined) {
    const v = String(b.code_postal || "").replace(/\s/g, "");
    if (v && !/^\d{5}$/.test(v)) return "Le code postal s'écrit avec cinq chiffres.";
    fiche.code_postal = v || null;
  }
  if (b.ville !== undefined) fiche.ville = propre(b.ville, 80);
  if (b.code_insee !== undefined) {
    const v = String(b.code_insee || "").toUpperCase().replace(/\s/g, "");
    if (v && !/^\d[\dAB]\d{3}$/.test(v)) {
      return "Le code INSEE de la commune s'écrit avec cinq caractères (exemple : 75056 pour Paris). Ce n'est pas le code postal.";
    }
    fiche.code_insee = v || null;
  }
  if (b.effectif !== undefined) {
    const t = String(b.effectif === null ? "" : b.effectif).trim();
    if (t === "") fiche.effectif = null;
    else {
      const n = Number(t);
      if (!Number.isInteger(n) || n < 0 || n > 100000) return "L'effectif doit être un nombre entier de salariés.";
      fiche.effectif = n;
    }
  }
  if (b.idcc !== undefined) {
    const t = String(b.idcc === null ? "" : b.idcc).replace(/\D/g, "");
    if (t === "") fiche.idcc = null;
    else {
      const n = Number(t);
      if (n < 1 || n > 9999) return "L'IDCC de la convention collective s'écrit avec quatre chiffres au plus (exemple : 1486).";
      fiche.idcc = n;
    }
  }
  if (b.spst_identifiant !== undefined) fiche.spst_identifiant = propre(b.spst_identifiant, 40);
  if (b.urssaf_numero !== undefined) {
    const v = String(b.urssaf_numero || "").replace(/\s/g, "");
    fiche.urssaf_numero = v || null;
  }
  if (b.contact_nom !== undefined) fiche.contact_nom = propre(b.contact_nom, 80);
  if (b.contact_tel !== undefined) fiche.contact_tel = propre(b.contact_tel, 30);
  if (b.contact_email !== undefined) {
    const v = propre(b.contact_email, 120);
    if (v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return "L'adresse électronique du contact n'est pas valide.";
    fiche.contact_email = v;
  }
  // Le SIREN se deduit du SIRET : on ne le fait pas taper deux fois.
  if (fiche.siret) {
    const siren = fiche.siret.slice(0, 9);
    if (fiche.siren && fiche.siren !== siren) {
      return "Le SIRET " + fiche.siret + " ne commence pas par le SIREN " + fiche.siren + ".";
    }
    fiche.siren = siren;
  }
  return null;
}

// Un code inconnu ne fait pas echouer l enregistrement : il retombe sur la
// France, qui est le cas courant.
function paysValide(v: any): string {
  const t = String(v || "").toUpperCase().trim();
  return PAYS[t] ? t : "FR";
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    // dossiersAutorises rend TOUJOURS une liste, bornee a l organisme de la
    // session puis aux dossiers confies au collaborateur. Vide = rien a voir.
    const autorises = await dossiersAutorises();
    if (autorises.length === 0) {
      return NextResponse.json({
        ok: true, total: 0, actifs: 0, desequilibres: 0,
        ecritures_orphelines: 0, societes: [],
        regimes_fiscaux: REGIMES_FISCAUX, regimes_tva: REGIMES_TVA, pays: PAYS,
      });
    }

    const { data: dossiers, error } = await supabase
      .from("compta_societes")
      .select("*")
      .in("id", autorises)
      .order("raison_sociale", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const liste = dossiers || [];
    const ids = liste.map(function (s: any) { return s.id; });

    const { data: ecritures } = ids.length > 0
      ? await supabase
        .from("compta_ecritures")
        .select("societe_id, debit, credit, ecriture_date")
        .in("societe_id", ids)
        .limit(100000)
      : { data: [] };

    const stats: any = {};
    for (const l of ecritures || []) {
      if (!stats[l.societe_id]) {
        stats[l.societe_id] = { lignes: 0, debit: 0, credit: 0, derniere: null };
      }
      const s = stats[l.societe_id];
      s.lignes = s.lignes + 1;
      s.debit = r2(s.debit + (Number(l.debit) || 0));
      s.credit = r2(s.credit + (Number(l.credit) || 0));
      const t = l.ecriture_date ? new Date(l.ecriture_date).getTime() : 0;
      if (t && (!s.derniere || t > s.derniere)) s.derniere = t;
    }

    // Les ecritures qui ne sont rattachees a aucun dossier n apparaissent
    // dans aucun FEC ni aucune liasse : il faut le dire. Reserve aux
    // administrateurs, c est une information de maintenance.
    let orphelines = 0;
    if (ADMINS.indexOf(session.email) >= 0) {
      const { count } = await supabase
        .from("compta_ecritures")
        .select("*", { count: "exact", head: true })
        .is("societe_id", null);
      orphelines = count || 0;
    }

    const societes = liste.map(function (s: any) {
      const st = stats[s.id] || { lignes: 0, debit: 0, credit: 0, derniere: null };
      const pays = paysValide(s.pays);
      // 🆕 29/09 — le mot de passe de teletransmission ne part jamais vers
      // le navigateur (la liste rendait toutes les colonnes).
      const { teledec_mdp, ...reste } = s;
      return {
        ...reste,
        teledec_enregistre: !!teledec_mdp,
        pays: pays,
        pays_nom: PAYS[pays],
        francais: pays === "FR",
        regime_fiscal_nom: REGIMES_FISCAUX[s.regime_fiscal] || s.regime_fiscal,
        regime_tva_nom: REGIMES_TVA[s.regime_tva] || s.regime_tva,
        lignes: st.lignes,
        debit: st.debit,
        credit: st.credit,
        equilibre: Math.abs(r2(st.debit - st.credit)) < 0.01,
        derniere_ecriture: st.derniere ? new Date(st.derniere).toISOString() : null,
      };
    });

    return NextResponse.json({
      ok: true,
      restreint: true,
      total: societes.length,
      actifs: societes.filter(function (s: any) { return s.actif !== false; }).length,
      desequilibres: societes.filter(function (s: any) { return s.lignes > 0 && !s.equilibre; }).length,
      ecritures_orphelines: orphelines,
      regimes_fiscaux: REGIMES_FISCAUX,
      regimes_tva: REGIMES_TVA,
      pays: PAYS,
      societes: societes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();

    // Ouvrir un dossier est un acte de cabinet, pas un acte comptable :
    // aucun des six droits ne le couvre.
    // 🆕🚨 29/09 — IL ETAIT RESERVE A L ADRESSE DE L EDITEUR. Un cabinet client
    // ne pouvait donc ouvrir AUCUN dossier pour ses propres clients. Il est
    // maintenant ouvert aux associes de chaque cabinet (et a l administrateur),
    // chacun borne a son organisme par le filtre sur tenant_id ci-dessous.
    if (!session) return refuse();
    if (!estAdmin(session.email) && !(await peutGererEquipe())) return refuse();

    // L ORGANISME EST OBLIGATOIRE. C est l oubli de ce rattachement qui
    // rendait les dossiers orphelins, donc invisibles une fois le
    // cloisonnement en place.
    const tenantId = tenantCourant();
    if (!tenantId) {
      return NextResponse.json(
        { ok: false, erreur: "Session sans organisme rattaché. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requête illisible." }, { status: 400 });
    }

    const raison = propre(b.raison_sociale, 200);
    if (!raison || raison.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "La raison sociale est obligatoire." },
        { status: 400 }
      );
    }

    const fiche: any = {
      raison_sociale: raison,
      pays: paysValide(b.pays),
      siren: b.siren ? String(b.siren).replace(/\D/g, "").slice(0, 9) : null,
      forme: propre(b.forme, 40),
      regime_fiscal: REGIMES_FISCAUX[String(b.regime_fiscal || "")] ? b.regime_fiscal : "a_determiner",
      regime_tva: REGIMES_TVA[String(b.regime_tva || "")] ? b.regime_tva : "reel_normal",
      exercice_debut: b.exercice_debut ? String(b.exercice_debut).slice(0, 10) : null,
      exercice_fin: b.exercice_fin ? String(b.exercice_fin).slice(0, 10) : null,
      adresse: propre(b.adresse, 300),
      email_contact: propre(b.email_contact, 120),
      expert_responsable: propre(b.expert_responsable, 120),
      notes: propre(b.notes, 2000),
      updated_at: new Date().toISOString(),
    };

    if (b.actif !== undefined) fiche.actif = b.actif !== false;

    const erreurIdentite = identiteEmployeur(b, fiche);
    if (erreurIdentite) {
      return NextResponse.json({ ok: false, erreur: erreurIdentite }, { status: 400 });
    }

    // MODIFICATION d un dossier existant. Le filtre sur tenant_id empeche
    // de modifier le dossier d un autre organisme en devinant son id.
    if (b.id) {
      const { data: modifie, error } = await supabase
        .from("compta_societes")
        .update(fiche)
        .eq("id", b.id)
        .eq("tenant_id", tenantId)
        .select("id")
        .maybeSingle();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      if (!modifie) {
        return NextResponse.json(
          { ok: false, erreur: "Ce dossier n'appartient pas à votre organisme." },
          { status: 403 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Dossier " + raison + " enregistré.",
      });
    }

    // OUVERTURE. Le code se retrouve dans les numeros d ecriture et le nom
    // du fichier FEC : court, sans accent, definitif.
    let code = propre(b.code, 20);
    if (!code) {
      code = raison
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 12);
    } else {
      code = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    }

    if (code.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Le code du dossier doit comporter au moins deux caractères." },
        { status: 400 }
      );
    }

    // L unicite du code se juge DANS l organisme : deux cabinets peuvent
    // parfaitement avoir chacun un dossier « DUPONT ».
    const { data: deja } = await supabase
      .from("compta_societes")
      .select("id")
      .eq("code", code)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (deja) {
      return NextResponse.json(
        { ok: false, erreur: "Le code " + code + " est déjà pris par un autre dossier." },
        { status: 409 }
      );
    }

    fiche.code = code;
    fiche.tenant_id = tenantId;

    const { error } = await supabase.from("compta_societes").insert(fiche);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      code: code,
      message: "Dossier " + raison + " ouvert sous le code " + code + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
