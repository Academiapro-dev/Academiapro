import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const P = "topmostSubform[0].";

// ---------------------------------------------------------------------------
// LE FORM 7004 — EXTENSION AUTOMATIQUE DU DELAI DE DEPOT.
//
// 🚨 CE QU IL EVITE, ET C EST LA TOUT SON INTERET. Le 1120 pro forma et son
// 5472 sont dus au 15 avril. Passe cette date sans depot ni extension,
// L AMENDE EST DE 25 000 USD PAR SOCIETE ET PAR AN — elle n est pas
// proportionnelle au chiffre d affaires, une LLC sans activite la paie
// comme une autre.
//
// Le 7004 accorde SIX MOIS de plus, jusqu au 15 octobre, et il est
// ACCORDE AUTOMATIQUEMENT : aucune justification n est demandee, le seul
// fait de le deposer a temps suffit.
//
// ⚠️ IL DOIT ETRE DEPOSE AVANT L ECHEANCE D ORIGINE. Un 7004 envoye le 16
// avril ne vaut rien : l extension ne rattrape pas un retard, elle le
// previent. C est pour cela que la relance de cette echeance compte autant
// que celle du 5472 lui-meme.
//
// ⚠️ CE QUE LE 7004 NE FAIT PAS : il repousse le DEPOT, pas le PAIEMENT.
// Pour une Single-Member LLC sans revenu de source americaine, l impot du
// est generalement nul et la question ne se pose pas — mais elle se posera
// des qu une societe du portefeuille aura des revenus effectivement lies a
// une activite americaine.
//
// LE CODE DE FORMULAIRE EST « 12 » — celui du Form 1120. C est ce que la
// LLC depose en pro forma avec son 5472 ; un autre code produirait une
// extension pour une declaration qui n existe pas.
// ---------------------------------------------------------------------------

const CODE_FORMULAIRE_1120 = "12";

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
}

// Coupe une adresse libre en ses composants. Le formulaire attend des
// champs separes ; une adresse sur une seule ligne les laisserait vides.
function decouperAdresse(v: unknown): {
  rue: string; ville: string; etat: string; pays: string; zip: string;
} {
  const s = String(v ?? "").trim();
  if (!s) return { rue: "", ville: "", etat: "", pays: "", zip: "" };

  const morceaux = s.split(",").map(function (m) { return m.trim(); });
  return {
    rue: morceaux[0] || "",
    ville: morceaux[1] || "",
    etat: morceaux[2] || "",
    pays: morceaux.length > 3 ? morceaux[morceaux.length - 1] : "",
    zip: "",
  };
}

export async function POST(req: NextRequest) {
  const journal: string[] = [];

  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const year = Number(body.year) || new Date().getFullYear();
    const entiteDemandee = String(body.entite_id || "").trim();

    // ---- LA SOCIETE CONCERNEE ----
    //
    // 🚨 L IDENTIFIANT RECU N EST PAS UNE AUTORISATION : il est cherche AVEC
    // le filtre tenant_id de la session. Une societe d un autre
    // gestionnaire est simplement introuvable.
    let requeteEntite = supabase
      .from("compliance_tenants")
      .select("id, label, legal_name, formation_state, mailing_address, "
        + "principal_office_address, formation_date")
      .eq("tenant_id", tenantId);

    if (entiteDemandee) {
      requeteEntite = requeteEntite.eq("id", entiteDemandee);
    }

    const { data: entite, error: eEntite } = await requeteEntite
      .order("label", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eEntite) {
      console.error("[f7004] lecture entite :", eEntite.message);
      return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    }

    if (!entite) {
      return NextResponse.json(
        { error: entiteDemandee ? "Societe introuvable." : "Aucune societe enregistree." },
        { status: 404 }
      );
    }

    const entiteId = entite.id;

    // ---- LE MAPPING, POUR L EIN ET L ADRESSE ----
    //
    // Le 7004 exige l EIN. Sans lui, le formulaire est irrecevable : l IRS
    // ne peut rattacher l extension a aucun dossier. On le dit clairement
    // plutot que de produire un PDF inutilisable.
    let m: any = null;

    const essaiEntite = await supabase
      .from("compliance_5472_mapping")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entiteId)
      .eq("tax_year", year)
      .maybeSingle();

    if (!essaiEntite.error && essaiEntite.data) {
      m = essaiEntite.data;
    } else {
      const { data: m2 } = await supabase
        .from("compliance_5472_mapping")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("tax_year", year)
        .maybeSingle();
      m = m2;
    }

    const ein = m ? m.ri_ein : null;
    if (!ein) {
      return NextResponse.json(
        {
          error: "Aucun EIN enregistre pour " + entite.label + " sur l'exercice " + year
            + ". Le Form 7004 ne peut pas etre depose sans EIN.",
        },
        { status: 400 }
      );
    }

    // L adresse vient du mapping quand il la porte en champs separes,
    // sinon de la fiche de la societe, decoupee a la volee.
    const adr = m && m.adr_rue
      ? {
          rue: m.adr_rue || "",
          ville: m.adr_ville || "",
          etat: m.adr_etat || "",
          pays: m.adr_pays || "",
          zip: m.adr_zip || "",
        }
      : decouperAdresse(entite.mailing_address || entite.principal_office_address);

    const nom = (m && m.ri_name) || entite.legal_name || entite.label;

    // ---- LE PDF ----
    const res = await fetch("https://academiapro.fr/forms/f7004.pdf");
    if (!res.ok) {
      return NextResponse.json(
        { error: "Formulaire source introuvable sur le serveur." },
        { status: 500 }
      );
    }

    const doc = await PDFDocument.load(await res.arrayBuffer(), { updateMetadata: false });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const form = doc.getForm();

    // Les noms de champs varient d une revision du formulaire a l autre.
    // On tente plusieurs chemins connus plutot que d echouer en silence :
    // un champ non trouve est signale dans le journal, pas masque.
    const setText = (chemins: string[], valeur: unknown) => {
      if (valeur === null || valeur === undefined || valeur === "") return;
      for (const c of chemins) {
        try {
          form.getTextField(P + c).setText(String(valeur));
          return;
        } catch (e) {
          // chemin suivant
        }
      }
      journal.push("Champ non trouve pour la valeur : " + String(valeur).slice(0, 40));
    };

    const cocher = (chemins: string[]) => {
      for (const c of chemins) {
        try {
          form.getCheckBox(P + c).check();
          return;
        } catch (e) {
          // chemin suivant
        }
      }
    };

    // Identification
    setText(["Page1[0].f1_1[0]", "Page1[0].f1_01[0]"], nom);
    setText(["Page1[0].f1_2[0]", "Page1[0].f1_02[0]"], ein);
    setText(["Page1[0].f1_3[0]", "Page1[0].f1_03[0]"], adr.rue);
    setText(["Page1[0].f1_5[0]", "Page1[0].f1_05[0]"], adr.ville);
    setText(["Page1[0].f1_6[0]", "Page1[0].f1_06[0]"], adr.etat);
    setText(["Page1[0].f1_7[0]", "Page1[0].f1_07[0]"], adr.pays);
    setText(["Page1[0].f1_8[0]", "Page1[0].f1_08[0]"], adr.zip);

    // Ligne 1 : le code du formulaire dont on demande l extension.
    setText(["Page1[0].f1_9[0]", "Page1[0].f1_09[0]"], CODE_FORMULAIRE_1120);

    // Ligne 2 : societe etrangere sans etablissement aux Etats-Unis.
    //
    // ⚠️ CETTE CASE EST CELLE QUI COMPTE POUR UNE LLC A MEMBRE ETRANGER.
    // Elle indique a l IRS que l entite n a pas de bureau sur le sol
    // americain — situation de la quasi-totalite des dossiers d un
    // gestionnaire pour non-residents.
    cocher(["Page1[0].c1_1[0]", "Page1[0].c1_01[0]"]);

    // Ligne 5a : l annee civile concernee.
    setText(["Page1[0].f1_13[0]", "Page1[0].f1_10[0]"], String(year).slice(2));

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const chemin = tenantId + "/" + entiteId + "/7004/" + year + "/f7004-" + stamp + ".pdf";

    const { error: eUp } = await supabase.storage
      .from("compliance-docs")
      .upload(chemin, Buffer.from(bytes), {
        contentType: "application/pdf",
        upsert: false,
      });

    if (eUp) {
      console.error("[f7004] depot au coffre :", eUp.message);
      return NextResponse.json({ error: "Depot au coffre impossible." }, { status: 500 });
    }

    // entite_id est indispensable : le tableau de bord filtre dessus, un
    // document sans lui serait archive mais invisible.
    await supabase.from("compliance_documents").insert({
      tenant_id: tenantId,
      entite_id: entiteId,
      rule_code: "US_7004",
      doc_type: "form_7004",
      title: "Form 7004 — extension de delai " + year + " — " + entite.label,
      version: 1,
      storage_path: "compliance-docs/" + chemin,
      mime_type: "application/pdf",
    });

    const { data: signed } = await supabase.storage
      .from("compliance-docs")
      .createSignedUrl(chemin, 3600);

    // L echeance du 1120 se lit dans le calendrier de la societe : c est
    // elle que le 7004 repousse, et le gestionnaire doit voir la date
    // limite de depot de l extension elle-meme.
    const limiteDepot = year + 1 + "-04-15";
    const nouvelleLimite = year + 1 + "-10-15";

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      entite_id: entiteId,
      societe: entite.label,
      year,
      path: chemin,
      url: signed?.signedUrl ?? null,
      controle: {
        nom: nom,
        ein: ein,
        adresse: [adr.rue, adr.ville, adr.etat, adr.pays, adr.zip],
        code_formulaire: CODE_FORMULAIRE_1120,
        societe_etrangere_sans_etablissement_us: true,
      },
      echeances: {
        depot_extension_avant: limiteDepot,
        nouvelle_limite_1120: nouvelleLimite,
      },
      nb_avertissements: journal.length,
      avertissements: journal,
      note: "Le Form 7004 doit etre depose AVANT le " + limiteDepot
        + ". Il reporte le depot, pas le paiement.",
    });
  } catch (e: unknown) {
    console.error("[f7004] exception :", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur.", journal }, { status: 500 });
  }
}
