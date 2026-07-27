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

function sansAccents(s: string): string {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function envoyerEmailBienvenue(email: string, nom: string, titre: string, estAtelier: boolean) {
  const suite = estAtelier
    ? "<p>Votre atelier est accessible immediatement depuis votre espace.</p>"
    : "<p>Votre manuel de formation est en cours de preparation. Vous recevrez un second message des qu il sera pret.</p>";

  const html =
    "<div style=\"font-family:Georgia,serif;line-height:1.7;color:#1a1a1a\">" +
    "<h1 style=\"color:#c8a96e\">Bienvenue " + nom + "</h1>" +
    "<p>Votre inscription a <strong>" + titre + "</strong> est confirmee.</p>" +
    "<p><a href=\"https://academiapro.fr/dashboard\">Acceder a votre espace de formation</a></p>" +
    suite +
    "<p>L equipe AcademIA Pro</p>" +
    "</div>";

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
        subject: "Bienvenue sur AcademIA Pro",
        html: html,
      }),
    });
  } catch (e) {
    console.error("Erreur envoi email bienvenue:", e);
  }
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
    const email = String(attributs.user_email || "").toLowerCase().trim();
    const nom = String(attributs.user_name || "").trim();
    const identifiant = evenement + "-" + String((corps.data && corps.data.id) || "");

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
    let livraison = "aucune";

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

        // Acces LMS historique, conserve pour les pages qui le lisent encore.
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

        // Credit de seances audio, uniquement pour les formations completes.
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

        await envoyerEmailBienvenue(email, nom || email, titre, estAtelier);

        // Le manuel demande environ 40 minutes : il ne peut pas etre produit
        // ici. On marque la commande, une route dediee s en charge ensuite.
        livraison = estAtelier ? "atelier - pas de manuel" : "manuel a generer";
        await supabase
          .from("commandes_lemonsqueezy")
          .update({
            traite: true,
            manuel_statut: estAtelier ? "sans_objet" : "a_generer",
          })
          .eq("identifiant_ls", identifiant);
      }
    }

    return NextResponse.json({ ok: true, active: active, livraison: livraison });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
