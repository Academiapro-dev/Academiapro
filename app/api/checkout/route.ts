import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LS_API = "https://api.lemonsqueezy.com/v1";
const KEY = process.env.LEMONSQUEEZY_API_KEY || "";

let cacheStoreId: string | null = null;
let cacheVariantId: string | null = null;

function prixPalier(base: number, palier: string): number {
  if (palier === "elearning") return Math.round(base * 0.5);
  if (palier === "plus") return Math.round(base * 0.7);
  if (palier === "cv2") return base + 800;
  if (palier === "cv3") return base + 1800;
  return base;
}

async function lsGet(path: string) {
  const r = await fetch(LS_API + path, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: "Bearer " + KEY,
    },
    cache: "no-store",
  });
  return r.json();
}

async function trouverProduit() {
  if (cacheStoreId && cacheVariantId) return;
  const prods = await lsGet("/products?page[size]=100");
  const prod = (prods.data || []).find((p: any) =>
    String(p.attributes.name || "").toLowerCase().includes("academia")
  );
  if (!prod) throw new Error("Produit AcademIA introuvable dans Lemon Squeezy");
  cacheStoreId = String(prod.attributes.store_id);
  const vars = await lsGet("/variants?filter[product_id]=" + prod.id);
  if (!vars.data || !vars.data.length) throw new Error("Variante introuvable");
  cacheVariantId = String(vars.data[0].id);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("formation") || "";
    const formule = url.searchParams.get("formule") || "cv1";
    const valides = ["elearning", "plus", "cv1", "cv2", "cv3", "bootcamp"];
    if (!valides.includes(formule)) {
      return NextResponse.json({ error: "formule invalide" }, { status: 400 });
    }
    const { data: f, error } = await supabase
      .from("formations")
      .select("code, titre, prix")
      .eq("code", code)
      .single();
    if (error || !f) {
      return NextResponse.json({ error: "formation introuvable: " + code }, { status: 404 });
    }
    const estBootcamp = String(f.titre || "").startsWith("Bootcamp") || formule === "bootcamp";
    const prixFormule = estBootcamp ? f.prix : prixPalier(f.prix, formule);
    const prixPromo = Math.round(prixFormule * 0.9);
    await trouverProduit();
    const corps = {
      data: {
        type: "checkouts",
        attributes: {
          custom_price: prixPromo * 100,
          product_options: {
            name: f.titre,
            description: "Formation " + f.code + " - formule " + formule,
            redirect_url: "https://academiapro.fr/dashboard",
          },
          checkout_data: {
            custom: { formation: f.code, formule: formule },
          },
        },
        relationships: {
          store: { data: { type: "stores", id: cacheStoreId } },
          variant: { data: { type: "variants", id: cacheVariantId } },
        },
      },
    };
    const r = await fetch(LS_API + "/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: "Bearer " + KEY,
      },
      body: JSON.stringify(corps),
    });
    const j = await r.json();
    const lien = j && j.data && j.data.attributes && j.data.attributes.url;
    if (!lien) {
      return NextResponse.json({ error: "checkout refuse", detail: j }, { status: 500 });
    }
    return NextResponse.redirect(lien, 302);
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
