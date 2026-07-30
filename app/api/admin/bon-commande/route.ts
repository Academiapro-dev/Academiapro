import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const LIBELLE_FORMULE: any = {
  outil: "Outil seul - plateforme et suivi",
  pack_lms_crm: "Outil et catalogue - 300 formations incluses",
  qualiopi: "Mr. Qualiopi - preparation a la certification",
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

function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\x7E]/g, " ");
}

function jour(d?: any): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR");
}

function euros(n: any): string {
  return (Number(n) || 0).toLocaleString("fr-FR") + " EUR HT";
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.tenant_id) {
      return NextResponse.json({ ok: false, erreur: "Client non precise." }, { status: 400 });
    }

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("*")
      .eq("tenant_id", b.tenant_id)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ ok: false, erreur: "Client introuvable." }, { status: 404 });
    }

    // Les trois mentions qui protegent l editeur. Sans elles, le client pourra
    // pretendre que la remise etait definitive, ou l administration reclamer
    // la taxe non facturee.
    const manques: string[] = [];
    if (!org.abonnement_mensuel) manques.push("l abonnement mensuel");
    if (!org.lancement_jusqu_au && b.lancement !== false) {
      manques.push("la date de fin du tarif de lancement");
    }
    if (!org.email_contact) manques.push("l email de contact");

    if (manques.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Completez la fiche client avant d editer le bon : " + manques.join(", ") + ".",
        },
        { status: 400 }
      );
    }

    const plein = Number(org.abonnement_mensuel) || 0;
    const enLancement = b.lancement !== false && !!org.lancement_jusqu_au;
    const mensuel = enLancement ? Math.round(plein / 2) : plein;
    const taux = org.taux_prelevement !== null && org.taux_prelevement !== undefined
      ? Number(org.taux_prelevement)
      : 20;

    const { data: catalogue } = await supabase
      .from("organisme_catalogue")
      .select("formation_code, prix_contractuel, prix_vente_public")
      .eq("tenant_id", b.tenant_id)
      .eq("actif", true)
      .order("formation_code", { ascending: true })
      .limit(500);

    const codes = (catalogue || []).map(function (c: any) { return c.formation_code; });

    const { data: fiches } = codes.length > 0
      ? await supabase.from("formations").select("code, titre").in("code", codes).limit(500)
      : { data: [] };

    const titreDe: any = {};
    for (const f of fiches || []) titreDe[f.code] = f.titre;

    const reference = "BC-" + Date.now().toString().slice(-8);

    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
    const vert = rgb(0.04, 0.24, 0.18);
    const noir = rgb(0.12, 0.12, 0.12);
    const gris = rgb(0.45, 0.45, 0.45);

    let page = pdf.addPage([595, 842]);
    let y = 795;

    function saut(besoin: number) {
      if (y - besoin < 70) {
        page = pdf.addPage([595, 842]);
        y = 795;
      }
    }

    function ligne(texte: string, taille: number, police: any, couleur: any, decalage: number) {
      const mots = ascii(texte).split(" ");
      let courante = "";
      const largeurMax = 495 - decalage;
      for (const mot of mots) {
        const essai = courante ? courante + " " + mot : mot;
        if (police.widthOfTextAtSize(essai, taille) > largeurMax) {
          saut(taille + 5);
          page.drawText(courante, { x: 50 + decalage, y: y, size: taille, font: police, color: couleur });
          y = y - taille - 5;
          courante = mot;
        } else {
          courante = essai;
        }
      }
      if (courante) {
        saut(taille + 5);
        page.drawText(courante, { x: 50 + decalage, y: y, size: taille, font: police, color: couleur });
        y = y - taille - 5;
      }
    }

    function paire(gauche: string, droite: string) {
      saut(18);
      page.drawText(ascii(gauche), { x: 55, y: y, size: 10, font: normal, color: gris });
      page.drawText(ascii(droite), { x: 240, y: y, size: 10, font: gras, color: noir });
      y = y - 16;
    }

    function titreBloc(t: string) {
      y = y - 12;
      saut(30);
      page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 20, color: rgb(0.93, 0.93, 0.9) });
      page.drawText(ascii(t), { x: 55, y: y + 2, size: 11, font: gras, color: vert });
      y = y - 28;
    }

    ligne("BON DE COMMANDE", 18, gras, vert, 0);
    ligne("Reference " + reference + " - etabli le " + jour(new Date()), 9, normal, gris, 0);
    y = y - 10;

    titreBloc("L EDITEUR");
    paire("Denomination", "AcadeMIA Pro LLC");
    paire("Siege", "30 N Gould St STE R, Sheridan WY 82801, Etats-Unis");
    paire("Contact", "contact@academiapro.fr");

    titreBloc("LE CLIENT");
    paire("Raison sociale", org.raison_sociale || "-");
    paire("SIRET", org.siret || "A COMPLETER");
    paire("N de declaration d activite", org.numero_da || "A COMPLETER");
    paire("Adresse", org.adresse || "A COMPLETER");
    paire("Email", org.email_contact || "-");
    paire("Telephone", org.telephone || "-");
    paire("N de TVA intracommunautaire", org.numero_tva || "A COMPLETER");

    titreBloc("FORMULE SOUSCRITE");
    ligne(LIBELLE_FORMULE[org.formule] || org.formule || "Outil et catalogue", 12, gras, noir, 5);
    y = y - 4;

    if (enLancement) {
      paire("Tarif de lancement", euros(mensuel) + " par mois");
      paire("Jusqu au", jour(org.lancement_jusqu_au));
      paire("Puis, de plein droit", euros(plein) + " par mois");
      y = y - 4;
      ligne(
        "A la date ci-dessus, le montant plein s applique de plein droit, sans formalite ni " +
        "renegociation. En contrepartie du tarif de lancement, le Client autorise l Editeur a " +
        "citer sa denomination a titre de reference et s engage a fournir un temoignage ecrit.",
        9, normal, gris, 5
      );
    } else {
      paire("Abonnement mensuel", euros(plein) + " par mois");
    }

    titreBloc("PART SUR LES FORMATIONS DU CATALOGUE");
    paire("Taux", taux + " % du prix contractuel");
    y = y - 4;
    ligne(
      "Cette part est due sur chaque formation du catalogue de l Editeur vendue par le Client. " +
      "Elle ne s applique PAS aux formations creees par le Client, qui lui appartiennent. " +
      "Le nombre d inscriptions enregistre par la plateforme fait foi : le Client n a aucune " +
      "declaration de chiffre d affaires a fournir.",
      9, normal, gris, 5
    );

    if ((catalogue || []).length > 0) {
      titreBloc("ANNEXE - FORMATIONS OUVERTES ET PRIX CONTRACTUELS");

      saut(20);
      page.drawText(ascii("Code"), { x: 55, y: y, size: 9, font: gras, color: vert });
      page.drawText(ascii("Formation"), { x: 110, y: y, size: 9, font: gras, color: vert });
      page.drawText(ascii("Prix contractuel"), { x: 430, y: y, size: 9, font: gras, color: vert });
      y = y - 14;

      for (const c of catalogue || []) {
        saut(14);
        const prix = Number(c.prix_contractuel) || Number(c.prix_vente_public) || 0;
        const titre = ascii(titreDe[c.formation_code] || c.formation_code).slice(0, 52);
        page.drawText(ascii(c.formation_code), { x: 55, y: y, size: 8.5, font: normal, color: noir });
        page.drawText(titre, { x: 110, y: y, size: 8.5, font: normal, color: noir });
        const texte = prix > 0 ? prix.toLocaleString("fr-FR") + " EUR" : "a fixer";
        const largeur = normal.widthOfTextAtSize(texte, 8.5);
        page.drawText(texte, { x: 545 - largeur, y: y, size: 8.5, font: normal, color: prix > 0 ? noir : rgb(0.7, 0.3, 0.2) });
        y = y - 12;
      }

      y = y - 6;
      ligne(
        "Le prix contractuel sert d assiette a la part due a l Editeur. Le Client demeure libre " +
        "de fixer le prix auquel il vend a ses propres stagiaires.",
        9, normal, gris, 5
      );
    }

    titreBloc("TAXE, FACTURATION ET REGLEMENT");
    ligne(
      "La prestation est fournie par un etablissement etabli hors de l Union europeenne a un " +
      "assujetti etabli en France : la taxe est autoliquidee par le Client, qui communique son " +
      "numero de taxe intracommunautaire et procede lui-meme a la declaration.",
      9, normal, noir, 5
    );
    y = y - 4;
    paire("Facturation", "mensuelle, a terme echu");
    paire("Reglement", "par virement, a trente jours");

    titreBloc("ACCEPTATION");
    ligne(
      "Le Client declare avoir pris connaissance des conditions generales de vente accessibles " +
      "a academiapro.fr/pack/cgv et les accepter sans reserve. Les presentes mentions prevalent " +
      "sur toute indication tarifaire publiee par ailleurs.",
      10, normal, noir, 5
    );

    y = y - 26;
    saut(80);
    ligne("Fait le " + jour(new Date()) + ".", 10, normal, noir, 5);
    y = y - 28;

    saut(60);
    page.drawText(ascii("Pour l Editeur"), { x: 55, y: y, size: 9.5, font: gras, color: noir });
    page.drawText(ascii("Pour le Client - cachet et signature"), { x: 330, y: y, size: 9.5, font: gras, color: noir });
    y = y - 44;
    page.drawLine({ start: { x: 55, y: y }, end: { x: 255, y: y }, thickness: 0.7, color: gris });
    page.drawLine({ start: { x: 330, y: y }, end: { x: 540, y: y }, thickness: 0.7, color: gris });

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii("AcadeMIA Pro LLC - " + reference + " - page " + (i + 1) + "/" + pages.length),
        { x: 50, y: 34, size: 7.5, font: normal, color: gris }
      );
    }

    // Enregistre comme un document de l organisme, avec son contact pour
    // signataire : les routes de signature et d envoi fonctionnent alors
    // sans aucune modification.
    await supabase.from("organisme_documents").insert({
      tenant_id: b.tenant_id,
      type: "bon_commande",
      stagiaire_email: org.email_contact,
      formation_code: null,
      reference: reference,
      donnees: {
        formule: org.formule,
        mensuel: mensuel,
        plein: plein,
        taux: taux,
        lancement_jusqu_au: org.lancement_jusqu_au,
        formations: (catalogue || []).length,
      },
    });

    const octets = await pdf.save();

    return new NextResponse(Buffer.from(octets), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="bon-commande-' + reference + '.pdf"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
