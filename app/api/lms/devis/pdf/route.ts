import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

// ══════════════════════════════════════════════════════════════════════════
// LE PDF DU DEVIS MR LMS — 03/09.
//
// 🚨 LES MONTANTS SE RELISENT EN BASE, ILS NE SONT PAS TRANSMIS PAR LA PAGE.
// Un PDF qui recevrait ses chiffres du navigateur pourrait etre fabrique
// avec n importe quels montants. Ici, seul le jeton circule.
//
// 🚨 LE CALCUL EST LE MEME QUE DANS /api/lms/devis. Les deux routes lisent
// `tarifs` et appliquent la meme formule : un ecart entre l ecran et le
// PDF serait pire qu une erreur partout, car le client ne saurait plus
// lequel croire. TOUTE MODIFICATION DE CE CALCUL SE FAIT DANS LES DEUX
// FICHIERS, DANS LE MEME MOUVEMENT.
//
// ⚠️ AUCUN TOTAL ANNUEL. Le devis se presente en cout par stagiaire.
// Regle de Jacques du 03/09.
// ══════════════════════════════════════════════════════════════════════════

// La table `tarifs` sert toutes les marques ; cette route ne lit que les
// lignes de Mr LMS.
const PRODUIT = "lms";

const EMETTEUR = {
  nom: "ACADÉMIA PRO LLC",
  adresse: "30 N Gould St STE R, Sheridan, WY 82801, États-Unis",
  identifiant: "EIN 32-0862305",
  contact: "contact@academiapro.fr",
  produit: "Mr LMS",
};

// pdf-lib encode en WinAnsi : les lettres accentuees francaises passent
// tres bien. Seuls quelques signes typographiques n y sont pas.
function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u20ac/g, "EUR")
    .replace(/\u00b7/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[^\x20-\xFF]/g, " ");
}

// 🚨 DEUX DECIMALES QUAND IL Y EN A — 03/09. « 18,80 EUR » et non
// « 18,8 EUR ». Les montants ronds restent sans decimale.
// ⚠️ L ECRAN ET LE PDF DOIVENT ECRIRE LE MEME MONTANT.
function euros(n: any): string {
  const v = Number(n) || 0;
  const entier = Math.round(v * 100) % 100 === 0;
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: entier ? 0 : 2,
    maximumFractionDigits: 2,
  }) + " EUR";
}

// 🚨 « 1er », PAS « 1e ». Meme correction que sur l ecran, le 03/09 : en
// francais, le premier est le seul ordinal a ne pas prendre « e ».
// ⚠️ L ECRAN ET LE PDF DOIVENT ECRIRE LA MEME CHOSE.
function ordinal(n: number): string {
  return n === 1 ? "1er" : String(n) + "e";
}

function rangerTarifs(lignes: any[], offre: string) {
  const dedans = (lignes || []).filter(function (l: any) { return l.offre === offre; });

  function poste(nom: string) {
    return dedans.find(function (l: any) { return l.poste === nom; }) || null;
  }

  const paliers = dedans
    .filter(function (l: any) { return l.poste === "stagiaire"; })
    .sort(function (a: any, b: any) { return (a.seuil_min || 0) - (b.seuil_min || 0); })
    .map(function (l: any) {
      return {
        libelle: l.libelle,
        prix: Number(l.montant) || 0,
        min: l.seuil_min === null || l.seuil_min === undefined ? 1 : Number(l.seuil_min),
        max: l.seuil_max === null || l.seuil_max === undefined ? null : Number(l.seuil_max),
      };
    });

  const misePlace = poste("mise_en_place");
  const abonnement = poste("abonnement");
  const marque = poste("marque_blanche");
  const bpf = poste("accompagnement_bpf");
  const part = poste("part_catalogue");

  // 🚨 LA SIGNATURE EST UN CADEAU, JAMAIS UN DU — 03/09. Le prix et les
  // lots s impriment MEME QUAND UN LOT EST COMPRIS : c est ce qui donne sa
  // valeur au geste. Ne jamais ecrire « signature comprise » sans montant.
  const signature = poste("signature");
  const signatureOfferte = poste("signature_offerte");

  const lots = dedans
    .filter(function (l: any) { return l.poste === "signature_lot"; })
    .sort(function (a: any, b: any) { return (a.seuil_min || 0) - (b.seuil_min || 0); })
    .map(function (l: any) {
      const nombre = Number(l.seuil_min) || 0;
      const prix = Number(l.montant) || 0;
      return {
        nombre: nombre,
        prix: prix,
        unitaire: nombre > 0 ? Math.round((prix / nombre) * 100) / 100 : 0,
      };
    });

  return {
    mise_en_place: misePlace ? Number(misePlace.montant) || 0 : 0,
    abonnement: abonnement ? Number(abonnement.montant) || 0 : 0,
    marque_blanche: marque ? Number(marque.montant) || 0 : 0,
    accompagnement_bpf: bpf ? Number(bpf.montant) || 0 : 0,
    part_catalogue: part ? Number(part.pourcentage) || 0 : 0,
    paliers: paliers,
    signature_unitaire: signature ? Number(signature.montant) || 0 : 0,
    signature_lots: lots,
    signatures_offertes: signatureOfferte ? Number(signatureOfferte.seuil_min) || 0 : 0,
  };
}

function coutStagiaires(nb: number, paliers: any[]) {
  const detail: any[] = [];
  let total = 0;
  let rangPrecedent = 0;

  for (const p of paliers) {
    const plafond = p.max === null ? nb : Math.min(p.max, nb);
    const dans = Math.max(0, plafond - rangPrecedent);
    if (dans > 0) {
      const montant = dans * p.prix;
      total = total + montant;
      detail.push({ libelle: p.libelle, nombre: dans, prix: p.prix, montant: montant });
    }
    rangPrecedent = p.max === null ? nb : p.max;
    if (rangPrecedent >= nb) break;
  }

  return { total: total, detail: detail };
}

export async function GET(req: NextRequest) {
  try {
    const jeton = String(new URL(req.url).searchParams.get("jeton") || "").trim();
    if (!jeton) {
      return NextResponse.json({ ok: false, erreur: "Lien incomplet." }, { status: 400 });
    }

    // ⚠️ FILTRE SUR `produit` OBLIGATOIRE : la table sert tous les
    // produits depuis le 03/09.
    const { data: p } = await supabase
      .from("prospects_devis")
      .select("*")
      .eq("jeton", jeton)
      .eq("produit", PRODUIT)
      .maybeSingle();

    if (!p) {
      return NextResponse.json(
        { ok: false, erreur: "Ce lien n'est plus valable." },
        { status: 404 }
      );
    }

    if (!p.raison_sociale) {
      return NextResponse.json(
        { ok: false, erreur: "Renseignez votre fiche avant de télécharger le devis." },
        { status: 400 }
      );
    }

    // ⚠️ LA TABLE `tarifs` EST COMMUNE A TOUS LES PRODUITS : le filtre sur
    // `produit` est OBLIGATOIRE. Sans lui, ce devis imprimerait aussi les
    // abonnements de Mr CRM. Une requete PostgREST sans filtre rend tout,
    // et personne ne le voit.
    const { data: lignes } = await supabase
      .from("tarifs")
      .select("offre, poste, libelle, montant, pourcentage, seuil_min, seuil_max, optionnel")
      .eq("produit", PRODUIT)
      .limit(200);

    const offre = p.offre === "avec_catalogue" ? "avec_catalogue" : "sans_catalogue";
    const g = rangerTarifs(lignes || [], offre);

    const nbActifs = Number(p.stagiaires_estimes) || 0;
    const dureeMois = Number(p.duree_moyenne_mois) || 0;
    const cout = coutStagiaires(nbActifs, g.paliers);

    const avecCatalogue = offre === "avec_catalogue";
    const marqueDue = avecCatalogue ? 0 : (p.marque_blanche ? g.marque_blanche : 0);
    const bpfDu = avecCatalogue ? 0 : (p.accompagnement_bpf ? g.accompagnement_bpf : 0);

    const mensuelFixe = g.abonnement + marqueDue + bpfDu;
    const mensuelTotal = mensuelFixe + cout.total;
    const coutParStagiaire = nbActifs > 0 && dureeMois > 0
      ? Math.round((mensuelTotal * dureeMois / nbActifs) * 100) / 100
      : null;

    // ── Le document ────────────────────────────────────────────────────────
    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
    const encre = rgb(0.12, 0.12, 0.14);
    const or = rgb(0.62, 0.53, 0.33);
    const gris = rgb(0.45, 0.45, 0.45);

    let page = pdf.addPage([595, 842]);
    let y = 800;

    function saut(besoin: number) {
      if (y - besoin < 70) {
        page = pdf.addPage([595, 842]);
        y = 800;
      }
    }

    function ecrire(t: string, taille: number, police: any, couleur: any, decalage: number) {
      saut(taille + 6);
      page.drawText(ascii(t), { x: 50 + decalage, y: y, size: taille, font: police, color: couleur });
      y = y - taille - 6;
    }

    function ligne(g1: string, d1: string, forte?: boolean) {
      saut(18);
      page.drawText(ascii(g1), { x: 55, y: y, size: 10, font: forte ? gras : normal, color: encre });
      const police = forte ? gras : normal;
      const largeur = police.widthOfTextAtSize(ascii(d1), 10);
      page.drawText(ascii(d1), { x: 545 - largeur, y: y, size: 10, font: police, color: or });
      y = y - 16;
    }

    function paragraphe(t: string, taille: number, couleur: any) {
      const mots = ascii(t).split(" ");
      let courante = "";
      for (const mot of mots) {
        const essai = courante ? courante + " " + mot : mot;
        if (normal.widthOfTextAtSize(essai, taille) > 490) {
          saut(taille + 4);
          page.drawText(courante, { x: 55, y: y, size: taille, font: normal, color: couleur });
          y = y - taille - 4;
          courante = mot;
        } else {
          courante = essai;
        }
      }
      if (courante) {
        saut(taille + 4);
        page.drawText(courante, { x: 55, y: y, size: taille, font: normal, color: couleur });
        y = y - taille - 4;
      }
    }

    function titreCadre(t: string) {
      y = y - 12;
      saut(32);
      page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 20, color: rgb(0.95, 0.94, 0.90) });
      page.drawText(ascii(t), { x: 55, y: y + 2, size: 11, font: gras, color: or });
      y = y - 28;
    }

    // En-tete
    ecrire("DEVIS", 20, gras, or, 0);
    ecrire(EMETTEUR.produit + " - Plateforme de formation", 12, normal, gris, 0);
    y = y - 6;

    const aujourdhui = new Date();
    const dateFr = aujourdhui.toLocaleDateString("fr-FR");
    const validite = new Date(aujourdhui.getTime() + 30 * 86400000).toLocaleDateString("fr-FR");

    ecrire(
      "Devis n° " + (p.numero_devis || "-") + "   -   " + dateFr
      + "   -   Validite : " + validite + "   -   Prix hors taxes",
      9, normal, gris, 0
    );

    titreCadre("EMETTEUR");
    ligne("Denomination", EMETTEUR.nom);
    ligne("Adresse", EMETTEUR.adresse);
    ligne("Identifiant", EMETTEUR.identifiant);
    ligne("Contact", EMETTEUR.contact);

    titreCadre("DESTINATAIRE");
    ligne("Raison sociale", p.raison_sociale || "-");
    if (p.contact_nom) ligne("Contact", p.contact_nom);
    if (p.contact_email) ligne("Adresse electronique", p.contact_email);
    if (p.telephone) ligne("Telephone", p.telephone);
    const lieu = [p.adresse, [p.code_postal, p.ville].filter(Boolean).join(" "), p.pays]
      .filter(Boolean).join(", ");
    if (lieu) ligne("Adresse", lieu);
    ligne("SIRET", p.siret || "-");
    ligne("Numero de declaration d'activite", p.numero_da || "-");

    titreCadre("OBJET");
    paragraphe(
      avecCatalogue
        ? "Mise a disposition d'un espace de formation en ligne au nom de "
          + (p.raison_sociale || "votre organisme")
          + ", sur lequel l'organisme diffuse ses formations a ses stagiaires - les siennes, "
          + "et celles qu'il retient dans le catalogue AcadeMIA - et qui produit au fil des "
          + "sessions les elements attendus pour le bilan pedagogique et financier."
        : "Mise a disposition d'un espace de formation en ligne sur lequel "
          + (p.raison_sociale || "votre organisme")
          + " diffuse ses formations a ses stagiaires, et qui produit au fil des sessions "
          + "les elements attendus pour le bilan pedagogique et financier.",
      10, encre
    );

    y = y - 4;
    if (p.marque_blanche) {
      paragraphe(
        "Marque blanche. L'espace, les formations, les documents et les courriels adresses "
        + "aux stagiaires portent le nom et les couleurs de votre organisme. Le nom de "
        + "l'editeur n'apparait pas pour eux. Vous fixez vos prix de vente.",
        10, encre
      );
    } else {
      paragraphe(
        "Sans l'option marque blanche, la plateforme fonctionne a l'identique et vos "
        + "stagiaires voient la marque " + EMETTEUR.produit + ". Cette option peut etre "
        + "ajoutee a tout moment.",
        10, encre
      );
    }

    titreCadre("TARIFICATION");
    ligne("Mise en place (espace, import, parametrage, prise en main) - une fois",
          euros(g.mise_en_place));
    ligne("Abonnement mensuel", euros(g.abonnement));

    if (avecCatalogue) {
      ligne("Marque blanche", "comprise");
      ligne("Accompagnement jusqu'au bilan pedagogique et financier", "compris");
      ligne("Part sur le chiffre d'affaires brut realise sur le catalogue",
            g.part_catalogue + " %");
    } else {
      if (marqueDue > 0) ligne("Marque blanche : votre nom, vos couleurs", euros(marqueDue));
      if (bpfDu > 0) ligne("Accompagnement jusqu'au bilan pedagogique et financier", euros(bpfDu));
    }

    y = y - 4;
    // 🚨 LA DEGRESSIVITE S ANNONCE, ELLE NE SE DEDUIT PAS. Sans cette
    // phrase, les trois lignes qui suivent se lisent comme trois tarifs
    // separes ; l organisme qui compte grandir ne voit pas ce qu il y
    // gagnerait. Meme correction que sur l ecran, le 03/09.
    paragraphe("Stagiaire actif, par mois - le tarif baisse avec le nombre :", 10, encre);
    for (const pal of g.paliers) {
      const borne = pal.max === null
        ? "au-dela du " + (pal.min - 1) + "e"
        : "du " + ordinal(pal.min) + " au " + ordinal(pal.max);
      ligne("Stagiaire actif, " + borne, euros(pal.prix) + " / stagiaire / mois");
    }

    y = y - 4;
    paragraphe(
      "Stagiaire actif : stagiaire inscrit a au moins un parcours non termine au cours du "
      + "mois. Un stagiaire qui a termine ou abandonne n'est plus facture le mois suivant. "
      + "La degressivite s'applique au nombre de stagiaires actifs dans le mois.",
      9, gris
    );

    // ── LA SIGNATURE ELECTRONIQUE ──────────────────────────────────────────
    // 🚨 LE PRIX S IMPRIME MEME QUAND LE LOT EST COMPRIS. « La signature est
    // un cadeau, jamais un du » : un lot offert sans montant a cote ne se
    // retient pas, et ne se regrette pas non plus.
    if (g.signature_unitaire > 0) {
      titreCadre("SIGNATURE ELECTRONIQUE");

      const offertes = avecCatalogue || p.marque_blanche ? g.signatures_offertes : 0;

      if (offertes > 0) {
        // 🚨 PAS DE « VALEUR X EUR » — 03/09. Chiffrer le cadeau le
        // rapetisse : cinquante euros a cote d un abonnement de deux cents
        // ne pese rien. Le prix a l unite et les lots suivent ; le prospect
        // fait le calcul s il le veut.
        ligne(String(offertes) + " signatures comprises chaque annee", "comprises", true);
        y = y - 2;
        paragraphe(
          "Elles se renouvellent tant que votre offre est en cours. Au-dela, les signatures "
          + "sont facturees a l'unite ou par lot, aux tarifs ci-dessous.",
          9, gris
        );
        y = y - 4;
      }

      ligne("A l'unite", euros(g.signature_unitaire));
      for (const l of g.signature_lots) {
        ligne("Lot de " + l.nombre + " signatures - " + euros(l.unitaire) + " l'unite",
              euros(l.prix));
      }

      y = y - 4;
      paragraphe(
        "Un credit par signature apposee : trois signataires sur un meme document consomment "
        + "trois credits. Les credits achetes sont valables un an a compter de l'achat.",
        9, gris
      );
      y = y - 2;
      // 🚨 DESCRIPTION FACTUELLE, AUCUNE QUALIFICATION JURIDIQUE. Decision
      // de Jacques du 03/09 : on decrit ce que la fonction produit, on ne
      // dit pas ce qu elle vaut devant un juge, et on ne nomme personne.
      paragraphe(
        "Chaque signature produit un dossier de preuve : identite du signataire verifiee par "
        + "courriel, code a six chiffres, trace manuscrit horodate, consentement scelle, "
        + "empreinte cryptographique et chainage au registre. Il s'agit d'une signature "
        + "electronique simple, integree a la plateforme : le document part depuis le dossier "
        + "du stagiaire et y revient signe. Pour un acte exigeant une signature qualifiee, "
        + "recourez a un prestataire agree.",
        9, gris
      );
    }

    // ⚠️ LECTURE EN COUT PAR STAGIAIRE, JAMAIS EN TOTAL ANNUEL.
    if (coutParStagiaire !== null) {
      titreCadre("LECTURE PRATIQUE");
      paragraphe(
        "Sur la base de " + nbActifs + " stagiaire(s) en formation en moyenne chaque mois "
        + "et d'une duree moyenne de " + dureeMois + " mois, le suivi complet d'un stagiaire "
        + "represente " + euros(coutParStagiaire) + " sur toute sa formation - inscription, "
        + "presences, evaluations, documents signes et sa part du bilan compris.",
        10, encre
      );
      if (avecCatalogue) {
        y = y - 2;
        paragraphe(
          "Sur les formations du catalogue, vous fixez vos prix ; la part de "
          + g.part_catalogue + " % porte sur ce que vous encaissez sur ces formations.",
          10, encre
        );
      }
    }

    titreCadre("CONDITIONS");
    paragraphe(
      "Facturation mensuelle a terme echu pour l'abonnement, les options et les stagiaires "
      + "actifs ; mise en place facturee a la signature.",
      10, encre
    );
    paragraphe("Sans engagement de duree ; resiliation par courriel avec un preavis d'un mois.", 10, encre);
    paragraphe(
      "Vos donnees - stagiaires, resultats, documents - vous appartiennent et vous sont "
      + "restituees sur demande, dans un format exploitable.",
      10, encre
    );
    paragraphe(
      "Prix hors taxes. " + EMETTEUR.nom + " est une societe de droit americain ; la TVA "
      + "applicable depend de votre situation (autoliquidation le cas echeant).",
      10, encre
    );

    titreCadre("BON POUR ACCORD");
    y = y - 6;
    paragraphe("Nom, qualite, date, signature - ou signature electronique via l'espace fourni.", 10, gris);
    y = y - 26;
    page.drawLine({
      start: { x: 55, y: y },
      end: { x: 300, y: y },
      thickness: 0.7,
      color: gris,
    });

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii(EMETTEUR.produit + " - " + EMETTEUR.nom + " - Devis n° "
              + (p.numero_devis || "-") + " - Page " + (i + 1) + "/" + pages.length),
        { x: 50, y: 34, size: 7.5, font: normal, color: gris }
      );
    }

    // LA DATE D ENVOI EST POSEE AU PREMIER TELECHARGEMENT. Elle sert au
    // suivi : sans elle, on ne sait pas depuis quand un devis dort.
    if (!p.devis_envoye_le) {
      await supabase
        .from("prospects_devis")
        .update({
          devis_envoye_le: new Date().toISOString(),
          statut: "devis_envoye",
          updated_at: new Date().toISOString(),
        })
        .eq("jeton", jeton)
        .eq("produit", PRODUIT);
    }

    const octets = await pdf.save();
    const nomFichier = "devis-" + (p.numero_devis || "mrlms") + ".pdf";

    return new NextResponse(Buffer.from(octets), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + nomFichier + '"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
