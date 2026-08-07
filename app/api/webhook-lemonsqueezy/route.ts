import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
const LS_API = "https://api.lemonsqueezy.com/v1";
const KEY = process.env.LEMONSQUEEZY_API_KEY || "";

const RETRAITS = ["subscription_expired", "order_refunded"];

// FRAIS DU VENDEUR DE REGISTRE. Lemon Squeezy ne les transmet PAS dans le
// message : on applique donc son tarif public. A ajuster s il change.
const FRAIS_LS_PCT = 5;
const FRAIS_LS_FIXE = 0.5;

function sansAccents(s: string): string {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// BASE DE LA COMMISSION : hors taxes, hors remise, ET DEDUCTION FAITE DES
// FRAIS LEMON SQUEEZY. On ne verse pas de commission sur de l argent qui
// n a jamais ete encaisse.
function baseCommission(montantHT: number): number {
  if (!montantHT || montantHT <= 0) return 0;
  const frais = (montantHT * FRAIS_LS_PCT) / 100 + FRAIS_LS_FIXE;
  return Math.max(0, Math.round((montantHT - frais) * 100) / 100);
}

function montantHT(attributs: any): number {
  const centimes =
    typeof attributs.subtotal === "number"
      ? attributs.subtotal - (typeof attributs.discount_total === "number" ? attributs.discount_total : 0)
      : (typeof attributs.total === "number" ? attributs.total : 0) -
        (typeof attributs.tax === "number" ? attributs.tax : 0);

  return Math.max(0, Math.round(centimes) / 100);
}

async function annulerAbonnement(id: string) {
  try {
    await fetch(LS_API + "/subscriptions/" + id, {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: "Bearer " + KEY,
      },
    });
  } catch (e) {
    console.error("annulation abonnement:", e);
  }
}

async function envoyerEmail(email: string, sujet: string, html: string) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AcademIA Pro <bienvenue@academiapro.fr>",
        to: email,
        subject: sujet,
        html: html,
      }),
    });
  } catch (e) {
    console.error("Erreur envoi email:", e);
  }
}

// La commission n est versee QU UNE FOIS PAR VENTE : sur order_created pour
// un paiement comptant, sur subscription_created pour un plan echelonne.
async function crediterAffiliation(code: string, formationCode: string, montant: number) {
  const base = baseCommission(montant);
  if (!code || base <= 0) return;

  try {
    const { data: affilie } = await supabase
      .from("affilies")
      .select("id, code_affiliation, commission_pct, total_ventes, total_gains, statut, nom, email")
      .eq("code_affiliation", code)
      .maybeSingle();

    if (!affilie || String(affilie.statut || "actif") !== "actif") return;

    const taux = Number(affilie.commission_pct) || 15;
    const commission = Math.round(base * taux) / 100;

    await supabase.from("ventes_affiliation").insert({
      code_affiliation: affilie.code_affiliation,
      formation_code: formationCode,
      montant: base,
      commission: commission,
      statut: "a_regler",
    });

    await supabase
      .from("affilies")
      .update({
        total_ventes: (affilie.total_ventes || 0) + 1,
        total_gains: Math.round(((Number(affilie.total_gains) || 0) + commission) * 100) / 100,
      })
      .eq("id", affilie.id);

    if (affilie.email) {
      await envoyerEmail(
        affilie.email,
        "Une vente vous a ete attribuee",
        '<div style="font-family:Georgia,serif;line-height:1.7;color:#1a1a1a">' +
        '<h1 style="color:#c8a96e">Bonne nouvelle</h1>' +
        "<p>Une personne que vous nous avez adressee vient d acheter la formation " +
        formationCode + ".</p>" +
        "<p>Votre commission : <strong>" + commission + " EUR</strong>, soit " + taux +
        " % de " + base + " EUR (montant hors taxes, frais de paiement deduits).</p>" +
        '<p><a href="https://academiapro.fr/partenaire?code=' + affilie.code_affiliation +
        '">Voir votre tableau de bord</a></p>' +
        "<p>AcademIA Pro</p></div>"
      );
    }

    await envoyerEmail(
      "contact@academiapro.fr",
      "Commission a regler : " + commission + " EUR",
      "<p>Partenaire : " + (affilie.nom || affilie.code_affiliation) +
      "<br>Formation : " + formationCode +
      "<br>Base retenue : " + base + " EUR<br>Commission : " + commission + " EUR</p>"
    );
  } catch (e) {
    console.error("affiliation:", e);
  }
}

async function envoyerEmailBienvenue(
  email: string,
  nom: string,
  titre: string,
  estAtelier: boolean,
  paiement: string
) {
  let suite: string;
  if (estAtelier) {
    suite = "<p>Votre atelier est accessible immediatement depuis votre espace.</p>";
  } else if (paiement === "12m") {
    suite =
      "<p>Votre parcours se deroule sur douze mois. Chaque mois, un nouveau volet " +
      "de votre manuel de formation vous sera remis dans votre espace.</p>";
  } else {
    suite =
      "<p>Votre manuel de formation est en cours de preparation. " +
      "Vous recevrez un second message des qu il sera pret.</p>";
  }

  const html =
    '<div style="font-family:Georgia,serif;line-height:1.7;color:#1a1a1a">' +
    '<h1 style="color:#c8a96e">Bienvenue ' + nom + "</h1>" +
    "<p>Votre inscription a <strong>" + titre + "</strong> est confirmee.</p>" +
    '<p><a href="https://academiapro.fr/dashboard">Acceder a votre espace de formation</a></p>' +
    suite +
    "<p>L equipe AcademIA Pro</p>" +
    "</div>";

  await envoyerEmail(email, "Bienvenue sur AcademIA Pro", html);
}

async function envoyerEmailSolde(email: string, titre: string, echeances: number) {
  const html =
    '<div style="font-family:Georgia,serif;line-height:1.7;color:#1a1a1a">' +
    '<h1 style="color:#c8a96e">Votre formation est integralement reglee</h1>' +
    "<p>Nous avons bien recu la derniere de vos " + echeances +
    " mensualites pour <strong>" + titre + "</strong>.</p>" +
    "<p>Aucun autre prelevement ne sera effectue. Votre acces reste ouvert.</p>" +
    "<p>L equipe AcademIA Pro</p>" +
    "</div>";

  await envoyerEmail(email, "Formation soldee - AcademIA Pro", html);
}

async function formationDeLAcheteur(email: string): Promise<string | null> {
  const { data } = await supabase
    .from("commandes_lemonsqueezy")
    .select("formation")
    .eq("email", email)
    .not("formation", "is", null)
    .order("id", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].formation : null;
}

export async function POST(req: Request) {
  try {
    const brut = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const attendu = crypto.createHmac("sha256", SECRET).update(brut).digest("hex");
    const valide =
      SECRET &&
      signature.length === attendu.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(attendu));

    if (!valide) {
      return NextResponse.json({ error: "signature invalide" }, { status: 401 });
    }

    const corps = JSON.parse(brut);
    const evenement = (corps && corps.meta && corps.meta.event_name) || "inconnu";
    const attributs = (corps && corps.data && corps.data.attributes) || {};
    const premierArticle = attributs.first_order_item || {};
    const nomProduit = String(attributs.product_name || premierArticle.product_name || "");

    if (!sansAccents(nomProduit).includes("academia")) {
      return NextResponse.json({ ignore: true });
    }

    const custom = (corps && corps.meta && corps.meta.custom_data) || {};
    const formation = custom.formation || null;
    const formule = custom.formule || null;
    const paiement = String(custom.paiement || "comptant");
    const affiliation = String(custom.affiliation || "").trim().toUpperCase();
    const email = String(attributs.user_email || "").toLowerCase().trim();
    const nom = String(attributs.user_name || "").trim();
    const identifiant = evenement + "-" + String((corps.data && corps.data.id) || "");

    const idAbonnement =
      evenement.indexOf("subscription_payment") === 0
        ? String(attributs.subscription_id || "")
        : String((corps.data && corps.data.id) || "");

    const { data: inseres, error } = await supabase
      .from("commandes_lemonsqueezy")
      .upsert(
        {
          evenement,
          identifiant_ls: identifiant,
          formation,
          formule,
          email: email || null,
          nom_produit: nomProduit,
          montant_centimes: typeof attributs.total === "number" ? attributs.total : null,
          statut: attributs.status || null,
          donnees: corps,
        },
        { onConflict: "identifiant_ls", ignoreDuplicates: true }
      )
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const nouvel = inseres && inseres.length > 0;
    let active = false;
    let retire = false;
    let livraison = "aucune";

    // ---- OUVERTURE D UN PLAN ECHELONNE ----
    if (nouvel && evenement === "subscription_created" && idAbonnement) {
      if (paiement === "4x" || paiement === "12m") {
        const echeancesPrevues =
          parseInt(String(custom.echeances || "0"), 10) || (paiement === "4x" ? 4 : 12);
        const prixTotal = parseFloat(String(custom.prix_total || "0")) || 0;
        const montantEcheance = echeancesPrevues
          ? Math.round((prixTotal * 100) / echeancesPrevues) / 100
          : 0;

        try {
          await supabase.from("plans_paiement").upsert(
            {
              subscription_id: idAbonnement,
              email: email,
              formation_code: formation,
              formule: paiement,
              prix_total: prixTotal,
              montant_echeance: montantEcheance,
              echeances_prevues: echeancesPrevues,
              echeances_payees: 0,
              statut: "en_cours",
            },
            { onConflict: "subscription_id", ignoreDuplicates: true }
          );
        } catch (e) {
          console.error("plans_paiement creation:", e);
        }

        // prix_total vient de notre propre calcul : il est deja hors taxes.
        if (affiliation && formation) {
          await crediterAffiliation(affiliation, String(formation), prixTotal);
        }
      }

      await supabase
        .from("commandes_lemonsqueezy")
        .update({ traite: true })
        .eq("identifiant_ls", identifiant);

      return NextResponse.json({ ok: true, plan: paiement });
    }

    // ---- ECHEANCE ENCAISSEE ----
    if (nouvel && evenement === "subscription_payment_success" && idAbonnement) {
      const { data: plan } = await supabase
        .from("plans_paiement")
        .select("*")
        .eq("subscription_id", idAbonnement)
        .maybeSingle();

      if (plan && plan.statut === "en_cours") {
        const compte = (plan.echeances_payees || 0) + 1;
        const solde = compte >= plan.echeances_prevues;

        await supabase
          .from("plans_paiement")
          .update({
            echeances_payees: compte,
            statut: solde ? "termine" : "en_cours",
            updated_at: new Date().toISOString(),
          })
          .eq("subscription_id", idAbonnement);

        if (solde) {
          await annulerAbonnement(idAbonnement);

          const { data: fiche } = await supabase
            .from("formations")
            .select("titre")
            .eq("code", plan.formation_code)
            .maybeSingle();

          const titre = (fiche && fiche.titre) || String(plan.formation_code);
          if (plan.email) {
            await envoyerEmailSolde(plan.email, titre, plan.echeances_prevues);
          }
        }
      }

      await supabase
        .from("commandes_lemonsqueezy")
        .update({ traite: true })
        .eq("identifiant_ls", identifiant);

      return NextResponse.json({ ok: true, echeance: "enregistree" });
    }

    // ---- ECHEANCE REFUSEE ----
    if (nouvel && evenement === "subscription_payment_failed" && idAbonnement) {
      try {
        await supabase
          .from("plans_paiement")
          .update({ statut: "incident", updated_at: new Date().toISOString() })
          .eq("subscription_id", idAbonnement)
          .eq("statut", "en_cours");
      } catch (e) {
        console.error("plans_paiement incident:", e);
      }

      await supabase
        .from("commandes_lemonsqueezy")
        .update({ traite: true })
        .eq("identifiant_ls", identifiant);

      return NextResponse.json({ ok: true, echeance: "refusee" });
    }

    // ---- RETRAIT D ACCES ----
    if (nouvel && RETRAITS.indexOf(evenement) >= 0 && email) {
      if (evenement === "subscription_expired" && idAbonnement) {
        const { data: plan } = await supabase
          .from("plans_paiement")
          .select("statut")
          .eq("subscription_id", idAbonnement)
          .maybeSingle();

        if (plan && plan.statut === "termine") {
          await supabase
            .from("commandes_lemonsqueezy")
            .update({ traite: true })
            .eq("identifiant_ls", identifiant);

          return NextResponse.json({ ok: true, retire: false, motif: "plan solde" });
        }
      }

      const cible = formation || (await formationDeLAcheteur(email));

      if (cible) {
        await supabase
          .from("acces_formations")
          .delete()
          .eq("email", email)
          .eq("formation", cible);

        try {
          await supabase
            .from("formations_lms")
            .update({ statut: "inactif" })
            .eq("email", email)
            .eq("formation_code", cible);
        } catch (e) {
          console.error("formations_lms retrait:", e);
        }

        try {
          await supabase
            .from("crm")
            .update({ statut: "ancien client", derniere_interaction: new Date().toISOString() })
            .eq("email", email);
        } catch (e) {
          console.error("crm retrait:", e);
        }

        retire = true;
      }

      // Remboursement : la commission n est plus due.
      if (evenement === "order_refunded" && affiliation && cible) {
        try {
          await supabase
            .from("ventes_affiliation")
            .update({ statut: "annulee" })
            .eq("code_affiliation", affiliation)
            .eq("formation_code", cible)
            .eq("statut", "a_regler");
        } catch (e) {
          console.error("affiliation remboursement:", e);
        }
      }

      await supabase
        .from("commandes_lemonsqueezy")
        .update({ traite: true })
        .eq("identifiant_ls", identifiant);

      return NextResponse.json({ ok: true, retire: retire, formation: cible });
    }

    // ---- OUVERTURE D ACCES ----
    if (nouvel && evenement === "order_created" && formation && email) {
      const { error: erreurAcces } = await supabase
        .from("acces_formations")
        .upsert(
          { email: email, formation: formation, formule: formule },
          { onConflict: "email,formation", ignoreDuplicates: true }
        );

      if (!erreurAcces) {
        active = true;

        const { data: fiche } = await supabase
          .from("formations")
          .select("code, titre")
          .eq("code", formation)
          .maybeSingle();

        const titre = (fiche && fiche.titre) || String(formation);
        const estAtelier = String(formation).toUpperCase().indexOf("SK") === 0;

        try {
          await supabase.from("formations_lms").insert({
            email: email,
            formation_code: formation,
            formation_titre: titre,
            date_achat: new Date().toISOString(),
            statut: "actif",
          });
        } catch (e) {
          console.error("formations_lms:", e);
        }

        if (!estAtelier) {
          try {
            await supabase.from("credits_seances").insert({
              user_email: email,
              secondes_restantes: 1200,
              type_seance: "audio",
            });
          } catch (e) {
            console.error("credits_seances:", e);
          }
        }

        try {
          await supabase.from("crm").upsert(
            {
              email: email,
              nom: nom || null,
              statut: "client",
              formation_active: formation,
              derniere_interaction: new Date().toISOString(),
            },
            { onConflict: "email" }
          );
        } catch (e) {
          console.error("crm:", e);
        }

        if (affiliation) {
          await crediterAffiliation(affiliation, String(formation), montantHT(attributs));
        }

        await envoyerEmailBienvenue(email, nom || email, titre, estAtelier, paiement);

        let statutManuel: string;
        if (estAtelier) {
          statutManuel = "sans_objet";
          livraison = "atelier - pas de manuel";
        } else if (paiement === "12m") {
          statutManuel = "progressif";
          livraison = "manuel remis mois par mois";
        } else {
          statutManuel = "a_generer";
          livraison = "manuel a generer";
        }

        await supabase
          .from("commandes_lemonsqueezy")
          .update({ traite: true, manuel_statut: statutManuel })
          .eq("identifiant_ls", identifiant);
      }
    }

    return NextResponse.json({ ok: true, active: active, livraison: livraison });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
