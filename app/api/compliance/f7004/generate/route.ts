import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../../lib/session";
// 🚨 LE CONTROLE D ORIGINE EST DESORMAIS PARTAGE — 01/09.
// La fonction etait recopiee dans chaque route, chacune avec sa propre
// liste de domaines. mysterllc.com n avait ete ajoute qu a deux d entre
// elles : ouvrir un dossier depuis mysterllc.com rendait « Acces refuse ».
// ⚠️ NE PAS REDEFINIR origineLegitime ICI. Une copie locale reintroduirait
// exactement le defaut que ce fichier partage supprime.
import { origineLegitime } from "../../../../../lib/origine";

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

    // 🚨 MODE DIAGNOSTIC — { "champs": true }
    //
    // POURQUOI IL EXISTE. Les noms de champs d un CERFA ne se devinent pas :
    // ils sont propres a chaque revision du formulaire, et l IRS les change
    // sans prevenir. Le 5472 et le 1120 ont ete cartographies a la main lors
    // d une session precedente ; le 7004 ne l a jamais ete.
    //
    // Ce mode rend LA LISTE REELLE des champs du PDF, sans rien remplir. Il
    // se lance depuis le navigateur et permet de corriger les chemins en une
    // fois, au lieu de tatonner bouton apres bouton.
    //
    // ⚠️ IL NE FUITE RIEN : il ne lit aucune donnee de la base, seulement la
    // structure d un formulaire public telecharge sur irs.gov.
    if (body.champs === true) {
      const champs = form.getFields().map(function (f: any) {
        let type = "inconnu";
        try {
          type = f.constructor && f.constructor.name ? f.constructor.name : "inconnu";
        } catch (e) {
          // type indeterminable
        }
        return { nom: f.getName(), type: type };
      });

      return NextResponse.json({
        success: true,
        mode: "diagnostic",
        formulaire: "f7004.pdf",
        nb_champs: champs.length,
        champs: champs,
      });
    }

    // Les noms de champs varient d une revision du formulaire a l autre.
    // On tente plusieurs chemins connus plutot que d echouer en silence :
    // un champ non trouve est signale dans le journal, pas masque.
    //
    // La fonction rend TRUE si elle a ecrit : c est ce qui permet, pour le
    // code de formulaire, de basculer sur la forme a deux cases separees
    // quand la forme a une case n existe pas.
    const setText = (chemins: string[], valeur: unknown): boolean => {
      if (valeur === null || valeur === undefined || valeur === "") return false;
      for (const c of chemins) {
        try {
          form.getTextField(P + c).setText(String(valeur));
          return true;
        } catch (e) {
          // chemin suivant
        }
      }
      journal.push("Champ non trouve pour la valeur : " + String(valeur).slice(0, 40));
      return false;
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

    // 🚨 MODE REPERAGE — { "reperage": true }
    //
    // POURQUOI IL EXISTE. La liste des champs donne leurs NOMS, pas leur
    // POSITION sur la page. Trois essais successifs ont montre que la
    // correspondance ne se deduit pas de l ordre : ecrire dans f1_12 faisait
    // apparaitre le texte dans « tax year beginning », et f1_11 n affiche
    // qu un seul caractere.
    //
    // Ce mode ecrit UNE LETTRE DIFFERENTE dans chaque champ de la zone
    // douteuse. En ouvrant le PDF, on lit directement quelle lettre tombe
    // ou — donc quel nom correspond a quelle case. Une seule generation
    // remplace dix tatonnements.
    //
    // ⚠️ LE PDF PRODUIT N EST PAS DEPOSABLE : il ne sert qu au reglage.
    if (body.reperage === true) {
      const lettres = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const releve: string[] = [];

      for (let i = 0; i < lettres.length; i++) {
        const nomChamp = "Page1[0].f1_" + (11 + i) + "[0]";
        try {
          form.getTextField(P + nomChamp).setText(lettres[i]);
          releve.push(lettres[i] + " -> f1_" + (11 + i));
        } catch (e) {
          releve.push(lettres[i] + " -> f1_" + (11 + i) + " INTROUVABLE");
        }
      }

      form.updateFieldAppearances(font);
      const octetsReperage = await doc.save();

      const cheminReperage = tenantId + "/reperage-7004-"
        + new Date().toISOString().replace(/[:.]/g, "-") + ".pdf";

      await supabase.storage
        .from("compliance-docs")
        .upload(cheminReperage, Buffer.from(octetsReperage), {
          contentType: "application/pdf",
          upsert: true,
        });

      const { data: lienReperage } = await supabase.storage
        .from("compliance-docs")
        .createSignedUrl(cheminReperage, 3600);

      return NextResponse.json({
        success: true,
        mode: "reperage",
        correspondance: releve,
        url: lienReperage?.signedUrl ?? null,
        note: "Ouvrez le PDF et notez ou apparait chaque lettre.",
      });
    }

    // ---- CARTOGRAPHIE REELLE DU FORMULAIRE ----
    //
    // 🚨 CES CHEMINS ONT ETE RELEVES SUR LE PDF LUI-MEME, pas devines. Le
    // mode diagnostic ({ champs: true }) rend la liste des champs ; c est
    // ainsi que le 5472 et le 1120 avaient ete cartographies, et c est la
    // seule methode fiable : l IRS renomme ses champs a chaque revision.
    //
    // LE PREMIER JET AVAIT ETE ECRIT AU JUGE, et il en portait les traces :
    // le code de formulaire restait vide, et l annee s ecrivait dans la
    // case de l exercice decale — ce qui declarait un exercice court
    // incomplet.
    //
    // LA STRUCTURE, POUR QUI REPRENDRA CE FICHIER :
    //   f1_1 a f1_8   identification (nom, EIN, adresse)
    //   f1_9, f1_10   les DEUX cases du code de formulaire, un chiffre
    //                 chacune
    //   c1_1          ligne 2 — societe etrangere sans etablissement US
    //   c1_2          ligne 3 — societe mere d un groupe consolide
    //   c1_3          ligne 4 — section 1.6081-5
    //   f1_11         ligne 5a — ANNEE CIVILE, un seul champ
    //   f1_12 a f1_15 ligne 5a — exercice decale (debut / fin)
    //   c1_4[0..4]    ligne 5b — motifs d exercice court
    //   f1_16 a f1_18 lignes 6, 7, 8 — impot, paiements, solde
    //
    // ⚠️ LE DECOUPAGE N EST PAS UNIFORME. Le code de formulaire occupe DEUX
    // cases d un chiffre chacune, mais l annee civile tient dans UN SEUL
    // champ. Chaque cas se verifie sur le PDF genere — le supposer par
    // analogie a coute deux essais sur ce formulaire.
    //
    // ⚠️ NE PAS REMPLIR f1_12 A f1_15 : ils decrivent un exercice decale, et
    // declarer les deux formes rend le formulaire contradictoire.

    // Identification
    setText(["Page1[0].f1_1[0]"], nom);
    setText(["Page1[0].f1_2[0]"], ein);
    setText(["Page1[0].f1_3[0]"], adr.rue);
    setText(["Page1[0].f1_5[0]"], adr.ville);
    setText(["Page1[0].f1_6[0]"], adr.etat);
    setText(["Page1[0].f1_7[0]"], adr.pays);
    setText(["Page1[0].f1_8[0]"], adr.zip);

    // 🚨 LIGNE 1 — LE CODE DU FORMULAIRE, SUR DEUX CASES.
    //
    // Sans lui, l IRS ne sait pas DE QUELLE DECLARATION on demande
    // l extension : le 7004 sert a une trentaine de formulaires, enumeres
    // dans le tableau juste en dessous. Un 7004 sans code est irrecevable,
    // donc le delai n est pas accorde — et le 5472 tombe en retard sans
    // que personne ne s en apercoive avant la penalite.
    setText(["Page1[0].f1_9[0]"], CODE_FORMULAIRE_1120.charAt(0));
    setText(["Page1[0].f1_10[0]"], CODE_FORMULAIRE_1120.charAt(1));

    // Ligne 2 : societe etrangere sans etablissement aux Etats-Unis.
    //
    // ⚠️ CETTE CASE EST CELLE QUI COMPTE POUR UNE LLC A MEMBRE ETRANGER.
    // Elle indique a l IRS que l entite n a pas de bureau sur le sol
    // americain — situation de la quasi-totalite des dossiers d un
    // gestionnaire pour non-residents.
    cocher(["Page1[0].c1_1[0]"]);

    // 🚨 LIGNE 5a — L ANNEE CIVILE, DESSINEE SUR LA PAGE.
    //
    // L HISTOIRE COMPLETE, POUR QUI REPRENDRA CE FICHIER. Cinq essais ont
    // ete necessaires :
    //   1. ecrire dans f1_13 mettait le chiffre dans l exercice decale ;
    //   2. repartir sur f1_11 et f1_12 dispersait l annee, le « 6 »
    //      partant dans « tax year beginning » ;
    //   3. ecrire « 26 » dans f1_11 seul n affichait que le « 2 » ;
    //   4. reduire la police a 8 points rapetissait le « 2 » sans faire
    //      apparaitre le « 6 » ;
    //   5. porter le maxLength du champ a 2 n a rien change non plus.
    //
    // Le mode reperage a confirme que f1_11 EST le champ de l annee
    // civile, bien place. LA CONCLUSION QUI RESTE : l affichage du champ
    // est DECOUPE AUX DIMENSIONS DE SA CASE, et cette case, dans le PDF de
    // l IRS, est physiquement trop etroite pour deux caracteres. Tout ce
    // qui deborde du cadre est coupe, quelle que soit la police.
    //
    // 🚨 LA SOLUTION : NE PLUS PASSER PAR LE CHAMP. Le texte est DESSINE
    // SUR LA PAGE, par-dessus l emplacement du champ — un texte de page
    // n est pas decoupe par le cadre d un champ.
    //
    // ⚠️ LES COORDONNEES NE SONT PAS FIXES : elles sont LUES sur le champ
    // f1_11 a chaque generation (son rectangle exact dans le PDF). Si
    // l IRS deplace la case a la prochaine revision, le texte suivra tout
    // seul. Et l annee est calculee, pas gravee : « 26 » cette annee,
    // « 27 » l an prochain, sans retouche. C est ce qui distingue cette
    // approche du drawText a coordonnees en dur, ecarte precisement parce
    // qu il ne passait pas 2027 automatiquement.
    //
    // ⚠️ f1_12 A f1_15 DECRIVENT L EXERCICE DECALE et restent vides :
    // declarer les deux formes rend le formulaire contradictoire.
    try {
      const champAnnee = form.getTextField(P + "Page1[0].f1_11[0]");

      const widgets = champAnnee.acroField.getWidgets();
      if (!widgets || widgets.length === 0) {
        throw new Error("le champ f1_11 n'a aucun widget visible");
      }

      const rect = widgets[0].getRectangle();
      const page = doc.getPage(0);

      // Le champ reste vide : le « 26 » est porte par la page, pas par le
      // champ. Deux ecritures superposees se chevaucheraient.
      champAnnee.setText("");

      const taille = 9;
      page.drawText(String(year).slice(2), {
        // Un point vers la gauche : la case est etroite, on prend l espace
        // des le bord pour que les deux chiffres tiennent sur la ligne.
        x: rect.x - 1,
        // Centre vertical de la case, moins un tiers de la taille de
        // police pour poser la ligne de base au bon niveau.
        y: rect.y + rect.height / 2 - taille / 3,
        size: taille,
        font: font,
      });

      journal.push(
        "Annee civile : « " + String(year).slice(2)
        + " » dessinee sur la page aux coordonnees du champ f1_11 ("
        + Math.round(rect.x) + ", " + Math.round(rect.y) + ")"
      );
    } catch (e) {
      journal.push(
        "Annee civile (f1_11) : "
        + (e instanceof Error ? e.message : String(e))
      );
    }

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
