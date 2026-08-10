import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CERTIFIANT = [3, 7, 16];
const SOUS_TRAITANCE = [27];
const AFEST = [13, 28];

const LABEL_STATUT: Record<string, string> = {
  non_commence: "Non commence",
  en_cours: "En cours",
  a_verifier: "A verifier",
  conforme: "Conforme",
  non_applicable: "Non applicable",
};

// L organisme vient du JETON SIGNE. Avec l ancien cookie sb_user, un inconnu
// pouvait telecharger le dossier d audit complet d un autre organisme.
function societeDeSession() {
  const session = sessionCourante();
  if (!session || !session.tenantId) return null;
  return { tenantId: session.tenantId, email: session.email };
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: {
      fetch: function (u: any, o: any) {
        return fetch(u, { ...(o || {}), cache: "no-store" });
      },
    },
  });
}

function sansAccent(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}

function couper(texte: string, largeurMax: number, taille: number): string[] {
  const mots = sansAccent(texte).split(" ");
  const lignes: string[] = [];
  let courante = "";
  const parCar = taille * 0.5;
  const maxCar = Math.floor(largeurMax / parCar);

  mots.forEach((mot) => {
    if ((courante + " " + mot).trim().length <= maxCar) {
      courante = (courante + " " + mot).trim();
    } else {
      if (courante) lignes.push(courante);
      courante = mot;
    }
  });
  if (courante) lignes.push(courante);
  return lignes;
}

export async function POST(req: NextRequest) {
  try {
    const session = societeDeSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, erreur: "Session sans societe rattachee. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const supabase = client();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, erreur: "Variables Supabase absentes" },
        { status: 500 }
      );
    }

    // LE BARRAGE. L export est ce qui a de la valeur : c est le dossier
    // classe, pret a presenter. Griser un bouton dans le navigateur ne
    // protege rien — il suffit d appeler cette adresse directement. Le
    // barrage doit donc etre ICI, et nulle part ailleurs.
    const { data: souscription } = await supabase
      .from("qualiopi_souscriptions")
      .select("id, statut, nb_exports")
      .eq("tenant_id", session.tenantId)
      .maybeSingle();

    if (!souscription) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "L export du dossier est ouvert par la souscription. "
            + "Votre diagnostic reste consultable sans limite.",
          souscription_requise: true,
        },
        { status: 402 }
      );
    }

    if (souscription.statut === "rembourse") {
      return NextResponse.json(
        { ok: false, erreur: "Cette souscription a ete remboursee." },
        { status: 402 }
      );
    }

    const { data: orgs, error: errOrg } = await supabase
      .from("qualiopi_organisme")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .limit(1);

    if (errOrg) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture organisme : " + errOrg.message },
        { status: 500 }
      );
    }
    if (!orgs || orgs.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Profil d'organisme non renseigne" },
        { status: 404 }
      );
    }
    const org = orgs[0];

    const { data: criteres, error: errCrit } = await supabase
      .from("qualiopi_criteres")
      .select("*")
      .order("ordre")
      .limit(20);

    if (errCrit) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture criteres : " + errCrit.message },
        { status: 500 }
      );
    }

    const { data: indicateurs, error: errInd } = await supabase
      .from("qualiopi_indicateurs")
      .select("*")
      .order("ordre")
      .limit(100);

    if (errInd) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture indicateurs : " + errInd.message },
        { status: 500 }
      );
    }

    const { data: avancement, error: errAv } = await supabase
      .from("qualiopi_avancement")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .limit(100);

    if (errAv) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture avancement : " + errAv.message },
        { status: 500 }
      );
    }

    const { data: preuves, error: errPr } = await supabase
      .from("qualiopi_preuves")
      .select("indicateur_id, titre, uploaded_at")
      .eq("tenant_id", session.tenantId)
      .limit(500);

    if (errPr) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture preuves : " + errPr.message },
        { status: 500 }
      );
    }

    const parIndicateur: Record<string, any> = {};
    (avancement || []).forEach((a: any) => {
      parIndicateur[a.indicateur_id] = a;
    });

    const preuvesParIndicateur: Record<string, any[]> = {};
    (preuves || []).forEach((p: any) => {
      if (!preuvesParIndicateur[p.indicateur_id]) {
        preuvesParIndicateur[p.indicateur_id] = [];
      }
      preuvesParIndicateur[p.indicateur_id].push(p);
    });

    const applicable = (ind: any): boolean => {
      const n = ind.numero;
      if (CERTIFIANT.indexOf(n) >= 0) return org.formations_certifiantes === true;
      if (SOUS_TRAITANCE.indexOf(n) >= 0) return org.recours_sous_traitance === true;
      if (AFEST.indexOf(n) >= 0)
        return org.afest === true || org.action_apprentissage === true;
      if (org.action_formation === true && ind.obligatoire_of === true) return true;
      if (org.action_apprentissage === true && ind.obligatoire_cfa === true) return true;
      if (org.action_vae === true && ind.obligatoire_vae === true) return true;
      if (org.action_bilan === true && ind.obligatoire_bilan === true) return true;
      return false;
    };

    const retenus = (indicateurs || []).filter(applicable);
    const nbTotal = retenus.length;
    const nbConforme = retenus.filter(
      (i: any) =>
        parIndicateur[i.id] && parIndicateur[i.id].statut === "conforme"
    ).length;
    const pourcentage =
      nbTotal > 0 ? Math.round((nbConforme / nbTotal) * 100) : 0;

    const pdfDoc = await PDFDocument.create();
    const police = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const policeGras = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const LARGEUR = 595;
    const HAUTEUR = 842;
    const MARGE = 50;
    const VERT = rgb(0.04, 0.24, 0.18);
    const GRIS = rgb(0.4, 0.4, 0.4);
    const NOIR = rgb(0.1, 0.1, 0.1);

    let page = pdfDoc.addPage([LARGEUR, HAUTEUR]);
    let y = HAUTEUR - MARGE;

    const nouvellePage = () => {
      page = pdfDoc.addPage([LARGEUR, HAUTEUR]);
      y = HAUTEUR - MARGE;
    };

    const verifierPlace = (besoin: number) => {
      if (y - besoin < MARGE) nouvellePage();
    };

    const ecrire = (
      texte: string,
      taille: number,
      couleur: any,
      gras: boolean,
      decalage: number
    ) => {
      page.drawText(sansAccent(texte), {
        x: MARGE + decalage,
        y: y,
        size: taille,
        font: gras ? policeGras : police,
        color: couleur,
      });
      y -= taille + 5;
    };

    ecrire("PREPARATION A LA CERTIFICATION QUALIOPI", 18, VERT, true, 0);
    y -= 6;
    page.drawLine({
      start: { x: MARGE, y: y },
      end: { x: LARGEUR - MARGE, y: y },
      thickness: 2,
      color: VERT,
    });
    y -= 24;

    ecrire(org.raison_sociale || "Organisme de formation", 14, NOIR, true, 0);

    if (org.numero_da) {
      ecrire("Numero de declaration d'activite : " + org.numero_da, 10, GRIS, false, 0);
    }
    if (org.date_audit_prevue) {
      ecrire(
        "Audit prevu le " +
          new Date(org.date_audit_prevue).toLocaleDateString("fr-FR"),
        10,
        GRIS,
        false,
        0
      );
    }
    if (org.certificateur) {
      ecrire("Organisme certificateur : " + org.certificateur, 10, GRIS, false, 0);
    }

    const types: string[] = [];
    if (org.action_formation) types.push("Actions de formation continue");
    if (org.action_apprentissage) types.push("Formation par apprentissage");
    if (org.action_vae) types.push("VAE");
    if (org.action_bilan) types.push("Bilans de competences");
    if (types.length > 0) {
      ecrire("Types d'action : " + types.join(", "), 10, GRIS, false, 0);
    }

    y -= 10;
    ecrire(
      nbConforme + " indicateurs conformes sur " + nbTotal + " (" + pourcentage + " %)",
      13,
      VERT,
      true,
      0
    );

    ecrire(
      "Document genere le " + new Date().toLocaleDateString("fr-FR"),
      9,
      GRIS,
      false,
      0
    );
    y -= 20;

    (criteres || []).forEach((c: any) => {
      const liste = retenus.filter((i: any) => i.critere_id === c.id);
      if (liste.length === 0) return;

      verifierPlace(70);
      y -= 8;

      const titreCritere = couper(
        "CRITERE " + c.numero + " - " + c.intitule,
        LARGEUR - 2 * MARGE,
        11
      );
      titreCritere.forEach((l) => ecrire(l, 11, VERT, true, 0));

      page.drawLine({
        start: { x: MARGE, y: y + 4 },
        end: { x: LARGEUR - MARGE, y: y + 4 },
        thickness: 0.5,
        color: VERT,
      });
      y -= 10;

      liste.forEach((i: any) => {
        const av = parIndicateur[i.id];
        const statut = av ? av.statut : "non_commence";
        const commentaire = av ? av.commentaire : null;
        const mesPreuves = preuvesParIndicateur[i.id] || [];

        verifierPlace(60);

        const lignesTitre = couper(
          "Indicateur " + i.numero + " : " + i.intitule,
          LARGEUR - 2 * MARGE - 10,
          10
        );
        lignesTitre.forEach((l) => ecrire(l, 10, NOIR, true, 10));

        ecrire("Statut : " + (LABEL_STATUT[statut] || statut), 9, GRIS, false, 10);

        if (mesPreuves.length > 0) {
          ecrire("Preuves deposees (" + mesPreuves.length + ") :", 9, GRIS, false, 10);
          mesPreuves.forEach((p: any) => {
            verifierPlace(20);
            const lignesP = couper(
              "- " + p.titre + " (" + new Date(p.uploaded_at).toLocaleDateString("fr-FR") + ")",
              LARGEUR - 2 * MARGE - 30,
              9
            );
            lignesP.forEach((l) => ecrire(l, 9, GRIS, false, 20));
          });
        } else {
          ecrire("Aucune preuve deposee", 9, rgb(0.7, 0.2, 0.2), false, 10);
        }

        if (commentaire) {
          verifierPlace(30);
          const lignesC = couper(
            "Note : " + commentaire,
            LARGEUR - 2 * MARGE - 20,
            9
          );
          lignesC.forEach((l) => ecrire(l, 9, NOIR, false, 10));
        }

        y -= 8;
      });
    });

    verifierPlace(60);
    y -= 20;
    page.drawLine({
      start: { x: MARGE, y: y },
      end: { x: LARGEUR - MARGE, y: y },
      thickness: 0.5,
      color: GRIS,
    });
    y -= 16;
    ecrire(
      "Ce document est un etat d'avancement interne. Il ne prejuge pas du resultat de l'audit.",
      8,
      GRIS,
      false,
      0
    );
    ecrire(
      "Les pieces justificatives sont conservees dans l'application et telechargeables par l'organisme.",
      8,
      GRIS,
      false,
      0
    );

    // LA TRACE. C est elle qui ferme la garantie : le dossier a ete
    // emporte, le remboursement n a plus lieu d etre. On l enregistre
    // APRES la generation, pour ne pas fermer la garantie sur un echec.
    try {
      const dejaExporte = (souscription.nb_exports || 0) > 0;
      const maj: any = { nb_exports: (souscription.nb_exports || 0) + 1 };
      if (!dejaExporte) maj.premier_export_le = new Date().toISOString();

      await supabase
        .from("qualiopi_souscriptions")
        .update(maj)
        .eq("id", souscription.id);
    } catch (e) {}

    const sortie = await pdfDoc.save();
    const nomFichier =
      "qualiopi_" +
      sansAccent(org.raison_sociale || "organisme").replace(/[^a-zA-Z0-9]/g, "_") +
      ".pdf";

    return new NextResponse(Buffer.from(sortie), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + nomFichier + '"',
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, erreur: e.message },
      { status: 500 }
    );
  }
}
