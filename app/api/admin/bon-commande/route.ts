import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";

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

    // Les frais de mise en service sont decides en negociant : ils arrivent
    // avec la demande, et sont enregistres a la fiche pour memoire.
    let frais = org.frais_installation !== null && org.frais_installation !== undefined
      ? Number(org.frais_installation)
      : 0;

    if (b.frais_installation !== undefined && b.frais_installation !== null && b.frais_installation !== "") {
      const saisi = Number(String(b.frais_installation).replace(",", "."));
      if (isNaN(saisi) || saisi < 0 || saisi > 100000) {
        return NextResponse.json({ ok: false, erreur: "Frais de mise en service invalides." }, { status: 400 });
      }
      frais = saisi;
      await supabase
        .from("organismes_formation")
        .update({ frais_installation: frais, updated_at: new Date().toISOString() })
        .eq("tenant_id", b.tenant_id);
    }

    const plein = Number(org.abonnement_mensuel) || 0;
    const enLancement = b.lancement !== false && !!org.lancement_jusqu_au;
    const mensuel = enLancement ? Math.round(plein / 2) : plein;

    // DEUX FORMULES, ET LE CLIENT CHOISIT.
    //
    //  - Sans gestion : il suit lui-meme ses stagiaires, et la part sur le
    //    catalogue est pleine (40 % par defaut).
    //  - Avec gestion : l Editeur prend en charge le suivi administratif,
    //    facture par stagiaire, et la part sur le catalogue est reduite
    //    (10 % par defaut) — sans quoi il ne resterait presque rien au
    //    Client sur ses ventes.
    //
    // ⚠️ CES DEUX VALEURS NE SONT QUE DES SECOURS. Le taux vient TOUJOURS de
    // la fiche client ; celui du bon de commande de reference est de 35 %.
    // Si taux_prelevement est laisse vide a la creation d un client, le bon
    // sortira donc a 40 % — verifier la fiche avant d editer.
    const gestionSouscrite = org.gestion_souscrite === true;

    const taux = org.taux_prelevement !== null && org.taux_prelevement !== undefined
      ? Number(org.taux_prelevement)
      : (gestionSouscrite ? 10 : 40);
    const plancher = org.plancher_stagiaire !== null && org.plancher_stagiaire !== undefined
      ? Number(org.plancher_stagiaire)
      : 30;
    const apport = org.taux_apport !== null && org.taux_apport !== undefined
      ? Number(org.taux_apport)
      : 50;

    // Le forfait ne figure au bon que si le Client a souscrit la gestion.
    const gestion = gestionSouscrite && org.forfait_gestion !== null && org.forfait_gestion !== undefined
      ? Number(org.forfait_gestion)
      : 0;

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
      page.drawText(ascii(droite), { x: 265, y: y, size: 10, font: gras, color: noir });
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

    titreBloc("FORMULE RETENUE");
    paire("Suivi administratif des stagiaires", gestionSouscrite ? "assure par l Editeur" : "assure par le Client");
    y = y - 4;
    ligne(
      gestionSouscrite
        ? "Le Client a retenu la formule avec gestion administrative : l Editeur prend en charge le "
          + "suivi de ses stagiaires, facture par stagiaire inscrit. En contrepartie, la part sur "
          + "les formations du catalogue de l Editeur est reduite."
        : "Le Client a retenu la formule sans gestion administrative : il assure lui-meme le suivi "
          + "de ses stagiaires. La part sur les formations du catalogue de l Editeur est celle "
          + "indiquee ci-dessous.",
      9, normal, noir, 5
    );

    if (frais > 0) {
      titreBloc("MISE EN SERVICE");
      paire("Frais uniques a la signature", euros(frais));
      y = y - 4;
      ligne(
        "Couvrent l ouverture du compte, la configuration du catalogue et des prix, la mise aux " +
        "couleurs du Client, la reprise de ses donnees et l accompagnement au demarrage. Factures " +
        "une seule fois, a la signature.",
        9, normal, gris, 5
      );
    }

    // 🚨 CE QUE COUVRE L ABONNEMENT — LES TROIS BRIQUES SONT NOMMEES.
    //
    // Corrige le 16/08 : le paragraphe decrivait « la plateforme complete »
    // sans jamais nommer LE SUIVI COMMERCIAL. Un client pouvait donc croire
    // qu il fallait le payer en supplement — ou l Editeur decouvrir apres
    // coup qu il pensait l avoir. Le CRM est vendu 35 EUR HT par utilisateur
    // et par mois QUAND IL EST PRIS SEUL ; dans le pack il est compris, sans
    // aucun compteur d utilisateurs. Decision de Jacques du meme jour : ne
    // pas cumuler un quatrieme axe de facturation par-dessus l abonnement,
    // la part sur le catalogue et le minimum par stagiaire.
    titreBloc("ABONNEMENT");
    ligne(
      "Trois briques comprises dans un seul abonnement, sans option a ajouter : " +
      "(1) LA PLATEFORME D APPRENTISSAGE - diffusion des formations, creation de ses propres " +
      "contenus sans limite de nombre, questionnaires corriges erreur par erreur, classes " +
      "virtuelles, suivi de chaque stagiaire et attestations de fin de formation ; " +
      "(2) LE SUIVI COMMERCIAL - prospects, etapes, relances redigees, motifs de perte, page " +
      "publique de l organisme, sans limite d utilisateurs ; " +
      "(3) LE CATALOGUE DE L EDITEUR - formations pretes a vendre sous le nom du Client, " +
      "ouvertes selon l annexe ci-apres.",
      10, normal, noir, 5
    );
    y = y - 4;
    ligne(
      "S y ajoutent les documents administratifs a l en-tete du Client, la signature " +
      "electronique et son archivage, les evaluations, le registre des reclamations, les " +
      "dossiers de ses formateurs, le suivi de sa sous-traitance et son bilan pedagogique et " +
      "financier prepare cadre par cadre. STAGIAIRES ILLIMITES ET UTILISATEURS ILLIMITES.",
      10, normal, noir, 5
    );
    y = y - 6;

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

    // 🚨 CE QUI N EST PAS COMPRIS DANS L ILLIMITE — AJOUTE LE 16/08.
    //
    // « Stagiaires illimites et utilisateurs illimites » se lit vite comme
    // « tout est illimite ». Or le SMS et la voix sont les DEUX SEULS postes
    // ou chaque usage coute reellement de l argent a l Editeur : Brevo
    // facture chaque message, Plivo chaque minute. Un forfait illimite ferait
    // travailler a perte des qu un client envoie en volume — et l interim,
    // qui est la premiere cible, est precisement du volume.
    //
    // LE SMS PORTE SON PRIX, PAS LA VOIX : le tarif de revente du message est
    // arrete (0,12 EUR degressif a 0,08), celui de la minute ne l est pas —
    // le tarif d accroche des operateurs concerne les lignes fixes et les
    // appels d origine europeenne, alors que le trafic reel ira vers des
    // mobiles. Le prix se fixera sur un mois de cout constate. On n ecrit
    // pas au contrat un tarif qu on devra corriger.
    titreBloc("OPTIONS FACTUREES A L USAGE");
    ligne(
      "CES DEUX OPTIONS NE SONT PAS COMPRISES DANS L ABONNEMENT. Elles ne sont dues que si le " +
      "Client les active, et facturees a ce qu il consomme reellement. L illimite porte sur les " +
      "stagiaires et les utilisateurs, jamais sur les envois ni sur les communications.",
      10, gras, noir, 5
    );
    y = y - 6;
    paire("Envoi de SMS", "0,12 EUR HT le message");
    y = y - 2;
    ligne(
      "Degressif jusqu a 0,08 EUR HT selon le volume mensuel. Aucun abonnement : les credits " +
      "sont prepayes et sans expiration. Les messages partent sous le nom de l organisme du " +
      "Client. La prospection par SMS suppose le consentement prealable du destinataire, y " +
      "compris entre professionnels ; le Client en demeure seul responsable.",
      9, normal, noir, 5
    );
    y = y - 4;
    paire("Appels depuis la plateforme", "a l ouverture du service");
    y = y - 2;
    ligne(
      "La location du numero est refacturee au Client a son cout, sans marge. Seules les minutes " +
      "reellement consommees portent la marge de l Editeur, decomptees a la seconde. Le tarif a " +
      "la minute est communique au Client a l ouverture du service et porte a l avenant. Aucun " +
      "montant n est du les mois ou le Client n appelle pas.",
      9, normal, noir, 5
    );

    titreBloc("PART SUR LES FORMATIONS DU CATALOGUE DE L EDITEUR");
    paire("Taux", taux + " % du prix de vente hors taxes");
    if (!gestionSouscrite) {
      paire("Minimum par stagiaire inscrit", euros(plancher));
      y = y - 4;
      ligne(
        "Le minimum par stagiaire est du pour chaque inscription sur une formation du catalogue de " +
        "l Editeur, QUE LA FORMATION AIT ETE VENDUE OU NON. Lorsque la part calculee au taux " +
        "ci-dessus lui est superieure, seule cette part est due.",
        9, normal, noir, 5
      );
    } else {
      y = y - 4;
      ligne(
        "Ce taux reduit est la contrepartie de la gestion administrative souscrite ci-dessous. Il " +
        "cesserait de s appliquer si le Client renoncait a cette prestation, le taux plein etant " +
        "alors retabli par avenant.",
        9, normal, noir, 5
      );
    }
    y = y - 4;
    ligne(
      "AUCUNE PART N EST DUE SUR LES FORMATIONS CREEES PAR LE CLIENT : elles lui appartiennent " +
      "en propre. Le nombre d inscriptions enregistre par la plateforme fait foi ; le Client n a " +
      "aucune declaration de chiffre d affaires a fournir.",
      9, normal, gris, 5
    );

    if (gestion > 0) {
      titreBloc("GESTION ADMINISTRATIVE");
      paire("Forfait par stagiaire inscrit", euros(gestion));
      y = y - 4;
      ligne(
        "Couvre, pour l ensemble des stagiaires du Client : conventions et contrats, convocations, " +
        "feuilles d emargement, evaluations, attestations de fin de formation, pieces " +
        "justificatives attendues lors d un audit et preparation du bilan pedagogique et financier.",
        9, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "Ce forfait est tout compris : il remplace le minimum par stagiaire et ne s y ajoute pas. " +
        "Le Client demeure seul responsable de l exactitude des informations transmises, de la " +
        "verification des documents produits et du depot de ses declarations.",
        9, normal, gris, 5
      );
    }

    titreBloc("AFFAIRES ORIENTEES PAR L EDITEUR");
    paire("Partage du produit HT", apport + " % pour l Editeur");
    y = y - 4;
    ligne(
      "S applique aux demandes que l Editeur oriente vers le Client, notamment lorsqu un " +
      "financement par un operateur de competences est sollicite et que seul le Client detient " +
      "la certification exigee. Ce partage est distinct de la part ci-dessus.",
      9, normal, noir, 5
    );
    y = y - 4;
    ligne(
      "Les formations du catalogue ne sont enregistrees ni au RNCP ni au repertoire specifique : " +
      "elles ne sont eligibles a aucun financement au titre du compte personnel de formation.",
      9, normal, gris, 5
    );

    titreBloc("REPARTITION DES ROLES");
    ligne(
      "Le Client demeure seul prestataire de formation : sa certification, son numero de " +
      "declaration, ses attestations, sa responsabilite. L Editeur fournit le contenu, la " +
      "plateforme, la correction des evaluations et les documents.",
      9, normal, noir, 5
    );
    y = y - 4;
    ligne(
      "Toute intervention en presence, l evaluation pratique, le recrutement des formateurs, leur " +
      "remuneration et la verification de leurs habilitations relevent exclusivement du Client. " +
      "Pour les actions reglementees, l Editeur fournit les supports theoriques et l acces a " +
      "distance ; il ne delivre aucune habilitation ni certification.",
      9, normal, noir, 5
    );

    if ((catalogue || []).length > 0) {
      titreBloc("ANNEXE - FORMATIONS OUVERTES");

      saut(20);
      page.drawText(ascii("Code"), { x: 55, y: y, size: 9, font: gras, color: vert });
      page.drawText(ascii("Formation"), { x: 110, y: y, size: 9, font: gras, color: vert });
      page.drawText(ascii("Prix de vente"), { x: 450, y: y, size: 9, font: gras, color: vert });
      y = y - 14;

      for (const c of catalogue || []) {
        saut(14);
        const prix = Number(c.prix_vente_public) || Number(c.prix_contractuel) || 0;
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
        "Le Client fixe librement le prix auquel il vend a ses stagiaires. La part due a l Editeur " +
        "se calcule sur ce prix.",
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
      "Le Client declare avoir pris connaissance des conditions generales de vente accessibles a " +
      "academiapro.fr/pack/cgv et les accepter sans reserve. Les presentes mentions prevalent sur " +
      "toute indication tarifaire publiee par ailleurs.",
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

    const octets = Buffer.from(await pdf.save());

    // ARCHIVAGE. Sans depot, le signataire ne peut pas relire ce qu il signe,
    // et la signature regenererait un fichier different de celui qui lui a
    // ete presente. Le bon suit donc le meme chemin que les contrats.
    const empreinte = crypto.createHash("sha256").update(octets).digest("hex");
    const chemin = String(b.tenant_id) + "/" + reference + ".pdf";

    const { error: erreurDepot } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, octets, { contentType: "application/pdf", upsert: true });

    if (erreurDepot) {
      return NextResponse.json(
        { ok: false, erreur: "Archivage impossible : " + erreurDepot.message },
        { status: 500 }
      );
    }

    await supabase.from("organisme_documents").insert({
      tenant_id: b.tenant_id,
      type: "bon_commande",
      stagiaire_email: org.email_contact,
      formation_code: null,
      reference: reference,
      pdf_chemin: chemin,
      pdf_sha256: empreinte,
      pdf_octets: octets.length,
      donnees: {
        titre: "Bon de commande",
        contrepartie: org.raison_sociale || null,
        frais: frais,
        mensuel: mensuel,
        plein: plein,
        taux: taux,
        plancher: plancher,
        gestion: gestion,
        gestion_souscrite: gestionSouscrite,
        apport: apport,
        lancement_jusqu_au: org.lancement_jusqu_au,
        formations: (catalogue || []).length,
      },
    });

    await supabase.from("coffre_documents").insert({
      tenant_id: b.tenant_id,
      categorie: "bon_commande",
      titre: "Bon de commande - " + (org.raison_sociale || reference),
      contrepartie: org.raison_sociale || org.email_contact,
      reference: reference,
      chemin: chemin,
      empreinte_sha256: empreinte,
      octets: octets.length,
      signe: false,
      depose_par: session.email,
      notes: "Edite depuis la fiche du client",
    });

    return new NextResponse(new Uint8Array(octets), {
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
