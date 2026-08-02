import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { lecture, dossiersAutorises } from "../../../../lib/droits";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Sans cette option, Next met en cache le resultat des requetes et la route
// travaille sur des donnees perimees — un dossier cree a l instant reste
// introuvable.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

// Siren de remplacement, utilise uniquement pour un dossier qui n'en a pas
// (la LLC americaine). Toute societe francaise porte le sien.
const SIREN_PLACEHOLDER = "000000000";

// Format de date FEC : AAAAMMJJ
function dateFec(d: string | null): string {
  if (!d) return "";
  return d.slice(0, 10).replace(/-/g, "");
}

// Montant FEC : virgule decimale, deux chiffres
function montantFec(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
}

// Nettoie un champ texte : pas de pipe, pas de retour ligne
function champ(s: string | null): string {
  if (!s) return "";
  return String(s).replace(/[|\r\n\t]/g, " ").trim();
}

export async function GET(req: NextRequest) {
  try {
    // LA VRAIE SESSION, PAS UN COOKIE. Se contenter de constater la presence
    // d un cookie ne dit ni qui demande, ni ce qu il a le droit de lire.
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json(
        { error: "Connectez-vous pour produire un FEC." },
        { status: 401 }
      );
    }

    // CHOIX DU DOSSIER. On ne devine jamais : avec plusieurs dossiers et
    // aucun precise, on refuse. Melanger les ecritures de deux societes
    // dans un meme FEC serait une faute grave.
    const codeDemande = (req.nextUrl.searchParams.get("societe") || "").trim().toUpperCase();
    const idDemande = (req.nextUrl.searchParams.get("societe_id") || "").trim();

    // Un collaborateur ne voit que les dossiers qui lui sont confies. Un
    // dossier hors de sa portee doit lui repondre « introuvable » : lui dire
    // qu il existe mais lui est interdit serait deja un renseignement.
    const autorises = await dossiersAutorises();

    let requete = supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, siren, exercice_debut, exercice_fin, actif");

    if (autorises !== null) {
      if (autorises.length === 0) {
        return NextResponse.json(
          { error: "Aucun dossier ne vous est confie." },
          { status: 403 }
        );
      }
      requete = requete.in("id", autorises);
    }

    const { data: dossiers, error: erreurDossiers } = await requete.limit(500);

    if (erreurDossiers) {
      return NextResponse.json(
        { error: "Lecture des dossiers: " + erreurDossiers.message },
        { status: 500 }
      );
    }

    const liste = (dossiers || []).filter(function (s: any) { return s.actif !== false; });

    if (liste.length === 0) {
      return NextResponse.json(
        { error: "Aucun dossier comptable. Ouvrez-en un avant de produire un FEC." },
        { status: 404 }
      );
    }

    let dossier: any = null;

    if (idDemande) {
      dossier = liste.find(function (s: any) { return s.id === idDemande; }) || null;
    } else if (codeDemande) {
      dossier = liste.find(function (s: any) {
        return String(s.code || "").trim().toUpperCase() === codeDemande;
      }) || null;
    } else if (liste.length === 1) {
      dossier = liste[0];
    }

    if (!dossier) {
      if (!codeDemande && !idDemande) {
        return NextResponse.json(
          {
            error: "Precisez le dossier : ?societe=CODE",
            dossiers: liste.map(function (s: any) {
              return { code: s.code, raison_sociale: s.raison_sociale };
            }),
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: "Dossier introuvable.",
          demande: codeDemande || idDemande,
          dossiers_connus: liste.map(function (s: any) {
            return { code: s.code, raison_sociale: s.raison_sociale };
          }),
        },
        { status: 404 }
      );
    }

    // LE BARRAGE DE LECTURE, en second rideau : meme si le dossier a ete
    // trouve, on verifie qu il est bien ouvert a cette session.
    const refus = await lecture(dossier.id);
    if (refus) return refus;

    // PERIODE. L annee demandee prime ; a defaut on prend l exercice inscrit
    // au dossier ; en dernier recours l annee civile en cours.
    const anneeDemandee = parseInt(req.nextUrl.searchParams.get("year") || "", 10);

    let debut: string;
    let fin: string;

    if (anneeDemandee) {
      debut = anneeDemandee + "-01-01";
      fin = anneeDemandee + "-12-31";
    } else if (dossier.exercice_debut && dossier.exercice_fin) {
      debut = String(dossier.exercice_debut).slice(0, 10);
      fin = String(dossier.exercice_fin).slice(0, 10);
    } else {
      const annee = new Date().getFullYear();
      debut = annee + "-01-01";
      fin = annee + "-12-31";
    }

    const { data: lignes, error } = await supabase
      .from("compta_ecritures")
      .select(
        "journal_code, journal_lib, ecriture_num, ecriture_date, compte_num, compte_lib, comp_aux_num, comp_aux_lib, piece_ref, piece_date, ecriture_lib, debit, credit, lettrage, date_lettrage, valid_date, montant_devise, devise"
      )
      .eq("societe_id", dossier.id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .order("ecriture_date", { ascending: true })
      .order("ecriture_num", { ascending: true })
      .order("credit", { ascending: true })
      .limit(50000);

    if (error) {
      return NextResponse.json(
        { error: "Lecture ecritures: " + error.message },
        { status: 500 }
      );
    }

    if (!lignes || lignes.length === 0) {
      return NextResponse.json(
        {
          error: "Aucune ecriture pour " + dossier.raison_sociale
            + " entre le " + debut + " et le " + fin + ".",
          dossier: dossier.code,
        },
        { status: 404 }
      );
    }

    // CONTROLE D EQUILIBRE. Un FEC desequilibre est rejete par l administration.
    let totalDebit = 0;
    let totalCredit = 0;
    for (const l of lignes) {
      totalDebit = totalDebit + (Number(l.debit) || 0);
      totalCredit = totalCredit + (Number(l.credit) || 0);
    }
    const ecart = Math.round((totalDebit - totalCredit) * 100) / 100;

    if (Math.abs(ecart) > 0.01 && req.nextUrl.searchParams.get("forcer") !== "1") {
      return NextResponse.json(
        {
          error: "Ecritures desequilibrees : debit " + montantFec(totalDebit)
            + " contre credit " + montantFec(totalCredit)
            + ", ecart de " + montantFec(ecart)
            + ". Corrigez avant de produire le FEC, ou ajoutez &forcer=1 pour l obtenir tel quel.",
          debit: totalDebit,
          credit: totalCredit,
          ecart: ecart,
        },
        { status: 409 }
      );
    }

    const entete = [
      "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
      "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
      "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
      "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise",
    ].join("|");

    const corps = lignes.map((l) =>
      [
        champ(l.journal_code),
        champ(l.journal_lib),
        champ(l.ecriture_num),
        dateFec(l.ecriture_date),
        champ(l.compte_num),
        champ(l.compte_lib),
        champ(l.comp_aux_num),
        champ(l.comp_aux_lib),
        champ(l.piece_ref),
        dateFec(l.piece_date),
        champ(l.ecriture_lib),
        montantFec(Number(l.debit || 0)),
        montantFec(Number(l.credit || 0)),
        champ(l.lettrage),
        dateFec(l.date_lettrage),
        dateFec(l.valid_date),
        l.devise && l.devise !== "EUR" ? montantFec(Number(l.montant_devise || 0)) : "",
        l.devise && l.devise !== "EUR" ? champ(l.devise) : "",
      ].join("|")
    );

    const contenu = [entete, ...corps].join("\r\n") + "\r\n";

    // NOM DU FICHIER : SIREN du dossier suivi de la date de cloture.
    const siren = dossier.siren
      ? String(dossier.siren).replace(/\D/g, "").padStart(9, "0").slice(0, 9)
      : SIREN_PLACEHOLDER;
    const nomFichier = siren + "FEC" + dateFec(fin) + ".txt";

    return new NextResponse(contenu, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + nomFichier + '"',
        "Cache-Control": "no-store",
        "X-Nb-Lignes": String(lignes.length),
        "X-Dossier": champ(dossier.code),
        "X-Equilibre": Math.abs(ecart) <= 0.01 ? "oui" : "non",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e && e.message ? e.message : e) },
      { status: 500 }
    );
  }
}
