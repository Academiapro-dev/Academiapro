import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LA FIN DE L APPEL — 06/09.
//
// 🚨 CETTE ROUTE EST APPELEE PAR PLIVO, PAS PAR LE NAVIGATEUR. Quand
// l appel se termine, Plivo y poste la duree, le cout et l etat final.
// C est le seul moment ou l on connait ce qu il faut facturer.
//
// ⚠️ ELLE N A PAS DE SESSION — Plivo n a pas de cookie. Elle est donc
// protegee autrement : elle ne touche QU UNE LIGNE DEJA CREEE par la route
// d appel, retrouvee par son identifiant Plivo. Sans cet identifiant, elle
// ne fait rien. Personne ne peut donc s en servir pour ecrire une ligne
// arbitraire ni vider un credit.
//
// 🚨 LE DECOMPTE SE FAIT ICI, ET NULLE PART AILLEURS. Contrairement aux
// SMS, dont le prix est connu d avance, un appel se paie a la duree : on
// ne peut debiter qu une fois raccroche.
//
// ⚠️ ON GARDE LE COUT OPERATEUR *ET* LE PRIX FACTURE. Sans le cout, on ne
// saurait jamais si la marge tient. Sans le prix, on ne pourrait pas
// facturer. Les deux se lisent ensuite dans l export.
// ══════════════════════════════════════════════════════════════════════════

// Le prix de revente, en euros la minute. ⚠️ IL DOIT RESTER EGAL A LA
// LIGNE `telephonie` DE LA TABLE `tarifs` (produit = 'crm'). Deux valeurs
// qui divergent factureraient autre chose que ce que le devis annonce.
const PRIX_MINUTE = 0.12;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    // Plivo poste en formulaire, pas en JSON.
    let d: any = {};
    try {
      const f = await req.formData();
      f.forEach(function (v: any, k: string) { d[k] = String(v); });
    } catch (e) {
      d = await req.json().catch(function () { return {}; });
    }

    const appelId = String(d.RequestUUID || d.CallUUID || "").trim();
    if (!appelId) {
      // ⚠️ ON REPOND 200 MALGRE TOUT. Plivo reessaie sur une erreur, et
      // reessayer ne servirait a rien ici : l appel est fini.
      return NextResponse.json({ ok: true, info: "sans identifiant" });
    }

    const { data: ligne } = await supabase
      .from("crm_appels")
      .select("id, tenant_id, duree_sec, etat")
      .eq("appel_id", appelId)
      .limit(1)
      .maybeSingle();

    if (!ligne) {
      return NextResponse.json({ ok: true, info: "appel inconnu" });
    }

    // 🚨 UN SEUL DECOMPTE PAR APPEL. Plivo peut poster deux fois — une par
    // jambe, ou en cas de reessai. Si la duree est deja posee, on s arrete.
    if (ligne.duree_sec !== null && ligne.duree_sec !== undefined) {
      return NextResponse.json({ ok: true, info: "deja traite" });
    }

    const duree = parseInt(String(d.Duration || d.BillDuration || "0"), 10) || 0;
    const cout = parseFloat(String(d.TotalCost || "0")) || 0;
    const etat = String(d.CallStatus || d.HangupCause || "termine");

    // ⚠️ LA FACTURATION SE FAIT A LA MINUTE ENTAMEE, comme l annonce le
    // devis : « facture a la minute entamee ». Plivo compte a la seconde ;
    // arrondir au-dessus est ce qui a ete promis, pas une invention.
    const minutes = duree > 0 ? Math.ceil(duree / 60) : 0;
    const prix = Math.round(minutes * PRIX_MINUTE * 10000) / 10000;

    await supabase
      .from("crm_appels")
      .update({
        duree_sec: duree,
        duree_min: minutes || null,
        etat: etat,
        cout_operateur: cout || null,
        prix_facture: prix || null,
      })
      .eq("id", ligne.id);

    // ---- LE DECOMPTE ----
    //
    // ⚠️ UN APPEL SANS DUREE NE SE FACTURE PAS. Sonnerie sans reponse,
    // occupe, numero invalide : rien n a ete consomme, rien n est debite.
    if (duree > 0 && ligne.tenant_id) {
      const { data: orga } = await supabase
        .from("organismes_formation")
        .select("id, minutes_credits")
        .eq("tenant_id", ligne.tenant_id)
        .limit(1)
        .maybeSingle();

      if (orga) {
        // ⚠️ LE SOLDE NE DESCEND PAS SOUS ZERO. Un appel plus long que le
        // credit restant est possible — on ne coupe pas une communication
        // en cours. Le solde tombe a zero, et le prochain appel est refuse.
        const reste = Math.max(0, Number(orga.minutes_credits || 0) - duree);
        await supabase
          .from("organismes_formation")
          .update({ minutes_credits: reste })
          .eq("id", orga.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[organisme/appeler/fin] " + String(e));
    // ⚠️ 200 MEME EN CAS D ERREUR : un 500 ferait reessayer Plivo en
    // boucle, et chaque reessai risquerait un second decompte.
    return NextResponse.json({ ok: true, erreur: String(e) });
  }
}
