import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LS_API = "https://api.lemonsqueezy.com/v1";
const KEY = process.env.LEMONSQUEEZY_API_KEY || "";
const SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("confirmer") !== "oui") {
      return NextResponse.json({ info: "ajouter ?confirmer=oui pour creer le webhook" });
    }
    if (!KEY || !SECRET) {
      return NextResponse.json({
        error: "variable absente (cle: " + (KEY ? "oui" : "NON") +
          ", secret: " + (SECRET ? "oui" : "NON") + ")",
      }, { status: 500 });
    }
    const entetes = {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: "Bearer " + KEY,
    };
    const s = await fetch(LS_API + "/stores?page[size]=10", { headers: entetes, cache: "no-store" });
    const sj = await s.json().catch(() => null);
    const magasin = sj && sj.data && sj.data[0];
    if (!magasin) {
      return NextResponse.json({ error: "magasin introuvable", detail: sj }, { status: 500 });
    }
    const w = await fetch(LS_API + "/webhooks?page[size]=100", { headers: entetes, cache: "no-store" });
    const wj = await w.json().catch(() => null);
    const existant = ((wj && wj.data) || []).find((x: any) =>
      String(x.attributes.url || "").includes("academiapro.fr/api/webhook-lemonsqueezy")
    );
    if (existant) {
      return NextResponse.json({
        ok: true, deja_en_place: true,
        url: existant.attributes.url,
        evenements: existant.attributes.events,
      });
    }
    const corps = {
      data: {
        type: "webhooks",
        attributes: {
          url: "https://academiapro.fr/api/webhook-lemonsqueezy",
          events: ["order_created", "order_refunded"],
          secret: SECRET,
        },
        relationships: { store: { data: { type: "stores", id: String(magasin.id) } } },
      },
    };
    const r = await fetch(LS_API + "/webhooks", {
      method: "POST", headers: entetes, body: JSON.stringify(corps),
    });
    const j = await r.json().catch(() => null);
    if (r.status !== 201) {
      return NextResponse.json({ error: "creation refusee " + r.status, detail: j }, { status: 500 });
    }
    return NextResponse.json({
      ok: true, cree: true,
      url: j.data.attributes.url,
      evenements: j.data.attributes.events,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
