import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "documents-signes";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// ---------------------------------------------------------------------------
// RETOUR DGFIP, TRANSMIS PAR TELEDEC.
//
// Cette route est PUBLIQUE, et elle ne peut pas etre autre chose : TELEDEC
// n a pas de session chez nous, et son serveur appelle sans en-tete que nous
// controlions. Elle est donc protegee par la REFERENCE elle-meme.
//
// La reference est posee par nous dans #REFERENCE-DOSSIER a l envoi. Elle
// doit etre ALEATOIRE et longue : un numero sequentiel se devine, et
// quiconque le devinerait pourrait ecrire un faux retour dans le dossier
// d un client.
//
// Une reference inconnue est REFUSEE. On ne cree jamais de ligne depuis un
// appel entrant : seule une declaration reellement envoyee peut recevoir
// une reponse.
//
// STATUTS, tels que Thomas Brethiot les a decrits :
//   OK      = declaration acceptee, accuse de reception
//   ERREUR  = rejet, avec le detail dans declarationErreurs
//   SENT    = transmise, en attente
//   CREATED = creee, pas encore transmise
//
// LES CHAMPS A null NE SONT PAS EMIS. On ne recoit que ce qui est
// renseigne : chaque lecture doit donc tolerer l absence.
// ---------------------------------------------------------------------------

function texte(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

function date(v: any): string | null {
  if (!v) return null;
  const t = String(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });

    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Charge utile illisible." }, { status: 400 });
    }

    // La reference nous appartient : c est elle qui rattache le retour au
    // bon dossier, et elle seule autorise l ecriture.
    const reference = texte(b.reference);

    if (!reference) {
      return NextResponse.json({ ok: false, erreur: "Reference absente." }, { status: 400 });
    }

    const { data: declaration } = await supabase
      .from("teledec_declarations")
      .select("id, tenant_id, societe_id, reference, statut")
      .eq("reference", reference)
      .maybeSingle();

    // Reference inconnue : on refuse, et on ne dit pas pourquoi. Une reponse
    // detaillee permettrait de chercher les references valables une a une.
    if (!declaration) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const statutBrut = String(b.status || b.declarationStatus || b.statut || "")
      .trim()
      .toUpperCase();

    const statut = statutBrut === "OK" ? "acceptee"
      : statutBrut === "ERREUR" ? "rejetee"
      : statutBrut === "SENT" ? "transmise"
      : statutBrut === "CREATED" ? "creee"
      : "inconnu";

    // Les erreurs de rejet arrivent sous deux formes : anomalies de fond et
    // anomalies de syntaxe. On garde les deux telles quelles, sans les
    // interpreter : c est ce que le comptable devra lire pour corriger.
    const erreurs =
      b.declarationErreurs || b.erreursSyntaxiques
        ? {
            declaration: b.declarationErreurs || null,
            syntaxe: b.erreursSyntaxiques || null,
          }
        : null;

    const modifications: any = {
      statut: statut,
      statut_libelle: texte(b.statusLibelle) || texte(b.libelle),
      declaration_id: texte(b.declarationId),
      reference_dgfip: texte(b.referenceDGFiP) || texte(b.referenceDGFIP),
      numero_traitement_dgfip: texte(b.numeroTraitementDGFiP) || texte(b.numeroTraitementDGFIP),
      date_heure_dgfip: texte(b.dateHeureDGFiP) || texte(b.dateHeureDGFIP),
      lien_pdf: texte(b.lienPdf),
      erreurs: erreurs,
      charge_utile: b,
      repondu_le: new Date().toISOString(),
    };

    // Ce que le retour nous apprend sur la declaration elle-meme. Un dossier
    // peut porter plusieurs obligations fiscales : le rof dit laquelle a
    // ete servie, et le comptable en a besoin pour s y retrouver.
    if (texte(b.siren)) modifications.siren = texte(b.siren);
    if (texte(b.formulaire)) modifications.formulaire = texte(b.formulaire);
    if (b.millesime) modifications.millesime = String(b.millesime);
    if (texte(b.rof)) modifications.rof = texte(b.rof);
    if (texte(b.declarationType)) modifications.declaration_type = texte(b.declarationType);
    if (texte(b.nom)) modifications.nom_entreprise = texte(b.nom);
    if (date(b.dateDebut)) modifications.periode_debut = date(b.dateDebut);
    if (date(b.dateFin)) modifications.periode_fin = date(b.dateFin);
    if (texte(b.compte)) modifications.compte_teledec = texte(b.compte);

    // LE PDF. Il arrive en base64 quand sa taille le permet, sinon par un
    // lien valable une heure. On le depose CHEZ NOUS dans les deux cas :
    // un lien qui expire ne vaut rien pour un dossier qu il faudra rouvrir
    // dans trois ans.
    let pdfDepose = false;

    try {
      let octets: Buffer | null = null;

      if (b.pdf && typeof b.pdf === "string" && b.pdf.length > 100) {
        const brut = b.pdf.indexOf(",") >= 0 ? b.pdf.split(",").pop() : b.pdf;
        octets = Buffer.from(String(brut), "base64");
      } else if (modifications.lien_pdf) {
        const r = await fetch(modifications.lien_pdf);
        if (r.ok) octets = Buffer.from(await r.arrayBuffer());
      }

      if (octets && octets.length > 1000) {
        const chemin = String(declaration.tenant_id) + "/liasses/" + reference + ".pdf";
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(chemin, octets, { contentType: "application/pdf", upsert: true });

        if (!error) {
          modifications.pdf_chemin = chemin;
          pdfDepose = true;
        }
      }
    } catch (e) {
      // Le depot du PDF ne doit jamais faire echouer le retour : TELEDEC
      // rejouerait l appel, et le statut serait perdu entre-temps.
    }

    const { error: eMaj } = await supabase
      .from("teledec_declarations")
      .update(modifications)
      .eq("id", declaration.id);

    if (eMaj) {
      // On renvoie une erreur pour que TELEDEC rejoue : leur file de reprise
      // est notre filet de securite.
      return NextResponse.json({ ok: false, erreur: eMaj.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      reference: reference,
      statut: statut,
      pdf: pdfDepose,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// TELEDEC peut appeler l adresse en GET pour verifier qu elle repond avant
// d y envoyer quoi que ce soit. On ne divulgue rien.
export async function GET() {
  return NextResponse.json({ ok: true, service: "callback" });
}
