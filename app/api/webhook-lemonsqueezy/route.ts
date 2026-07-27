import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

function sansAccents(s: string): string {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

    if (nouvel && evenement === "order_created" && formation && email) {
      const { error: erreurAcces } = await supabase
        .from("acces_formations")
        .upsert(
          { email: email, formation: formation, formule: formule },
          { onConflict: "email,formation", ignoreDuplicates: true }
        );
      if (!erreurAcces) {
        active = true;
        await supabase
          .from("commandes_lemonsqueezy")
          .update({ traite: true })
          .eq("identifiant_ls", identifiant);
      }
    }

    return NextResponse.json({ ok: true, active: active });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
