import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 90;

const ADMINS = ["contact@academiapro.fr"];

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

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function euros(n: number): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    }

    // LE BARRAGE : la revision expose toutes les faiblesses d un dossier.
    const refus = await lecture(id);
    if (refus) return refus;

    const { data: dossier } = await supabase
      .from("compta_societes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const debut = String(dossier.exercice_debut || "").slice(0, 10) || "1900-01-01";
    const fin = String(dossier.exercice_fin || "").slice(0, 10) || "2999-12-31";

    const { data: lignes } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, debit, credit, piece_ref, lettrage, ecriture_num, ecriture_date, journal_code")
      .eq("societe_id", id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .limit(50000);

    const mouvements = lignes || [];

    const { data: communs } = await supabase
      .from("compta_comptes").select("numero, lettrable").is("societe_id", null).limit(2000);
    const { data: propres } = await supabase
      .from("compta_comptes").select("numero, lettrable").eq("societe_id", id).limit(2000);

    const plan: any = {};
    for (const c of communs || []) plan[c.numero] = c;
    for (const c of propres || []) plan[c.numero] = c;

    const comptes: any = {};
    let debitTotal = 0;
    let creditTotal = 0;
    const sansPiece: any[] = [];
    const horsPlan: string[] = [];

    for (const l of mouvements) {
      const num = String(l.compte_num);
      if (!comptes[num]) comptes[num] = { numero: num, libelle: l.compte_lib, debit: 0, credit: 0, ouvertes: 0 };
      comptes[num].debit = r2(comptes[num].debit + (Number(l.debit) || 0));
      comptes[num].credit = r2(comptes[num].credit + (Number(l.credit) || 0));
      if (plan[num] && plan[num].lettrable && !l.lettrage) comptes[num].ouvertes += 1;

      debitTotal = r2(debitTotal + (Number(l.debit) || 0));
      creditTotal = r2(creditTotal + (Number(l.credit) || 0));

      if (!l.piece_ref && l.journal_code !== "AN") sansPiece.push(l.ecriture_num);
      if (!plan[num] && horsPlan.indexOf(num) < 0) horsPlan.push(num);
    }

    function solde(num: string): number {
      const c = comptes[num];
      return c ? r2(c.debit - c.credit) : 0;
    }

    const anomalies: any[] = [];

    function signaler(gravite: string, titre: string, detail: string, geste: string) {
      anomalies.push({ gravite: gravite, titre: titre, detail: detail, geste: geste });
    }

    // 🆕 LES LIBELLES D ANOMALIES SONT AFFICHES TELS QUELS sur l ecran de
    // revision, sous les yeux d un expert-comptable. Accentues le 02/09.

    const ecart = r2(debitTotal - creditTotal);
    if (Math.abs(ecart) > 0.01) {
      signaler("grave", "Balance déséquilibrée",
        "Débit " + euros(debitTotal) + " contre crédit " + euros(creditTotal) + ", écart de " + euros(ecart) + ".",
        "Cherchez l'écriture fautive dans le journal avant toute autre chose.");
    }

    for (const num of Object.keys(comptes)) {
      if (num.startsWith("471") || num.startsWith("472") || num.startsWith("467")) {
        const s = solde(num);
        if (Math.abs(s) > 0.005) {
          signaler("grave", "Compte d'attente non soldé",
            "Le compte " + num + " porte encore " + euros(s) + ".",
            "Affectez ces montants à leur compte définitif.");
        }
      }
    }

    const caisse = solde("530000");
    if (caisse < -0.005) {
      signaler("grave", "Caisse créditrice",
        "La caisse présente un solde de " + euros(caisse) + ", ce qui est impossible.",
        "Une dépense a été enregistrée sans son alimentation, ou un encaissement manque.");
    }

    const clients = solde("411000");
    if (clients < -0.005) {
      signaler("moyen", "Clients créditeurs",
        "Le compte clients présente un solde créditeur de " + euros(clients) + ".",
        "Avances reçues ou avoirs non affectés : vérifiez le lettrage.");
    }
    const fournisseurs = solde("401000");
    if (fournisseurs > 0.005) {
      signaler("moyen", "Fournisseurs débiteurs",
        "Le compte fournisseurs présente un solde débiteur de " + euros(fournisseurs) + ".",
        "Acomptes versés ou double règlement : vérifiez le lettrage.");
    }

    const aDecaisser = r2(-solde("445510"));
    const collectee = r2(-solde("445710"));
    const deductible = r2(solde("445660") + solde("445620"));
    const attendu = r2(collectee - deductible);
    if (collectee > 0.005 && Math.abs(r2(aDecaisser - attendu)) > 1) {
      signaler("moyen", "TVA incohérente",
        "La collectée moins la déductible donne " + euros(attendu)
        + " alors que le compte 445510 porte " + euros(aDecaisser) + ".",
        "Passez ou corrigez l'écriture de liquidation depuis l'écran TVA.");
    }

    for (const num of Object.keys(comptes)) {
      const c = comptes[num];
      if (c.ouvertes >= 10) {
        signaler("faible", "Lettrage en retard",
          "Le compte " + num + " compte " + c.ouvertes + " mouvements non lettrés.",
          "Lettrez ce compte : son solde n'est pas exploitable en l'état.");
      }
    }

    const { data: releves } = await supabase
      .from("compta_releves")
      .select("id")
      .eq("societe_id", id)
      .is("ecriture_num", null)
      .eq("ignore", false)
      .limit(1000);

    if ((releves || []).length > 0) {
      signaler("moyen", "Banque non rapprochée",
        (releves || []).length + " ligne(s) de relevé sans écriture correspondante.",
        "Passez par le rapprochement bancaire avant de clôturer.");
    }

    const { data: immos } = await supabase
      .from("compta_immobilisations")
      .select("id")
      .eq("societe_id", id)
      .is("date_sortie", null)
      .limit(500);

    const dotationPassee = mouvements.some(function (l: any) {
      return String(l.ecriture_num || "").indexOf("DOTATION") >= 0;
    });

    if ((immos || []).length > 0 && !dotationPassee) {
      signaler("moyen", "Dotation aux amortissements non passée",
        (immos || []).length + " bien(s) immobilisés, aucune écriture de dotation sur l'exercice.",
        "Passez la dotation depuis l'écran des immobilisations.");
    }

    const uniques = Array.from(new Set(sansPiece));
    if (uniques.length > 0) {
      signaler("faible", "Écritures sans référence de pièce",
        uniques.length + " écriture(s) n'ont aucune référence de pièce.",
        "Une pièce manquante est le premier reproche d'un contrôleur.");
    }

    if (horsPlan.length > 0) {
      signaler("faible", "Comptes absents du plan",
        horsPlan.length + " compte(s) mouvementés ne figurent pas au plan : " + horsPlan.slice(0, 8).join(", ") + ".",
        "Ajoutez-les au plan comptable pour qu'ils portent un libellé stable.");
    }

    const resultatBenefice = r2(-solde("120000"));
    const resultatPerte = solde("129000");
    if (Math.abs(resultatBenefice) < 0.005 && Math.abs(resultatPerte) < 0.005) {
      const produits = Object.keys(comptes)
        .filter(function (n) { return n.charAt(0) === "7"; })
        .reduce(function (s, n) { return r2(s - solde(n)); }, 0);
      if (Math.abs(produits) > 0.005) {
        signaler("faible", "Exercice non clôturé",
          "Les comptes de gestion sont encore ouverts.",
          "C'est normal en cours d'exercice ; à la clôture, passez par l'écran dédié.");
      }
    }

    const graves = anomalies.filter(function (a: any) { return a.gravite === "grave"; }).length;
    const moyennes = anomalies.filter(function (a: any) { return a.gravite === "moyen"; }).length;

    return NextResponse.json({
      ok: true,
      dossier: { code: dossier.code, raison_sociale: dossier.raison_sociale },
      exercice: { debut: debut, fin: fin },
      nb_lignes: mouvements.length,
      nb_comptes: Object.keys(comptes).length,
      debit: debitTotal,
      credit: creditTotal,
      equilibre: Math.abs(ecart) < 0.01,
      total: anomalies.length,
      graves: graves,
      moyennes: moyennes,
      faibles: anomalies.length - graves - moyennes,
      verdict: graves > 0 ? "bloquant" : moyennes > 0 ? "a_corriger" : anomalies.length > 0 ? "a_surveiller" : "sain",
      anomalies: anomalies,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
