import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LS_API = "https://api.lemonsqueezy.com/v1";
const KEY = process.env.LEMONSQUEEZY_API_KEY || "";

// Noms exacts des trois produits Lemon Squeezy, une fois normalises.
const NOM_COMPTANT = "formation academia pro";
const NOM_4X = "formation academia pro - 4 fois";
const NOM_12M = "formation academia pro - 12 mois";

// La formule 12 mois est un accompagnement sur un an : majoration de 20 %.
const MAJORATION_12M = 1.2;

// En dessous de ce montant, l echelonnement n est pas propose.
const MINIMUM_ECHELONNE = 300;

let cacheStoreId: string | null = null;
const cacheVariantes: { [nom: string]: string } = {};

function prixPalier(base: number, palier: string): number {
  if (palier === "elearning") return Math.round(base * 0.5);
  if (palier === "plus") return Math.round(base * 0.7);
  if (palier === "cv2") return base + 800;
  if (palier === "cv3") return base + 1800;
  return base;
}

// Minuscules, sans accents, tirets uniformises, espaces reduits.
function normaliser(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

async function lsGet(path: string) {
  const r = await fetch(LS_API + path, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: "Bearer " + KEY,
    },
    cache: "no-store",
  });
  const j = await r.json().catch(() => null);
  return { status: r.status, j };
}

// Retrouve un produit par son nom exact et renvoie sa premiere variante.
async function trouverVariante(nomCible: string): Promise<string> {
  if (cacheVariantes[nomCible]) return cacheVariantes[nomCible];

  const res = await lsGet("/products?page[size]=100");
  if (res.status !== 200) {
    throw new Error(
      "Lemon Squeezy repond " + res.status +
      " (cle presente: " + (KEY ? "oui, " + KEY.length + " caracteres" : "NON") + ") - " +
      JSON.stringify((res.j && res.j.errors) || res.j).slice(0, 300)
    );
  }

  const liste = (res.j && res.j.data) || [];
  const noms = liste.map((p: any) => p.attributes.name);
  const prod = liste.find((p: any) => normaliser(p.attributes.name || "") === nomCible);

  if (!prod) {
    throw new Error(
      "Produit introuvable : \"" + nomCible + "\". Produits visibles par la cle : [" +
      noms.join(" | ") +
      "]. Verifier le nom exact et le mode Test/Live."
    );
  }

  cacheStoreId = String(prod.attributes.store_id);

  const vars = await lsGet("/variants?filter[product_id]=" + prod.id);
  if (!vars.j || !vars.j.data || !vars.j.data.length) {
    throw new Error("Aucune variante pour le produit \"" + nomCible + "\"");
  }

  cacheVariantes[nomCible] = String(vars.j.data[0].id);
  return cacheVariantes[nomCible];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("formation") || "";
    let formule = url.searchParams.get("formule") || "cv1";
    const paiement = url.searchParams.get("paiement") || "comptant";

    if (["comptant", "4x", "12m"].indexOf(paiement) === -1) {
      return NextResponse.json({ error: "mode de paiement invalide" }, { status: 400 });
    }

    // Les ateliers (codes SK) ont un prix fixe : ni palier, ni remise.
    const estAtelier = code.toUpperCase().indexOf("SK") === 0;
    if (estAtelier) formule = "atelier";

    const valides = ["elearning", "plus", "cv1", "cv2", "cv3", "bootcamp", "atelier"];
    if (!valides.includes(formule)) {
      return NextResponse.json({ error: "formule invalide" }, { status: 400 });
    }

    if (estAtelier && paiement !== "comptant") {
      return NextResponse.json(
        { error: "les ateliers se reglent comptant" },
        { status: 400 }
      );
    }

    const { data: f, error } = await supabase
      .from("formations")
      .select("code, titre, prix")
      .eq("code", code)
      .single();
    if (error || !f) {
      return NextResponse.json({ error: "formation introuvable: " + code }, { status: 404 });
    }

    // LE PRIX FACTURE EST LE PRIX AFFICHE. Aucune remise n est calculee ici :
    // les 10 % Fondateur s obtiennent avec le code, saisi au paiement et limite
    // aux 100 premiers. Les appliquer deux fois reviendrait a 19 % de remise.
    let prixFinal: number;
    if (estAtelier) {
      prixFinal = f.prix;
    } else {
      const estBootcamp = String(f.titre || "").startsWith("Bootcamp") || formule === "bootcamp";
      prixFinal = estBootcamp ? f.prix : prixPalier(f.prix, formule);
    }

    if (paiement !== "comptant" && prixFinal < MINIMUM_ECHELONNE) {
      return NextResponse.json(
        { error: "echelonnement non disponible en dessous de " + MINIMUM_ECHELONNE + " euros" },
        { status: 400 }
      );
    }

    let nomProduit = NOM_COMPTANT;
    let echeances = 1;
    let prixTotal = prixFinal;
    let montantEcheance = prixFinal;

    // Pour les formules echelonnees, la mensualite est un nombre ENTIER d euros :
    // Lemon Squeezy ne retient que la QUANTITE d un abonnement, pas un prix
    // personnalise, et l unite vaut 1,00 EUR. On arrondit donc a l euro superieur.
    if (paiement === "4x") {
      nomProduit = NOM_4X;
      echeances = 4;
      montantEcheance = Math.ceil(prixFinal / 4);
      prixTotal = montantEcheance * 4;
    } else if (paiement === "12m") {
      nomProduit = NOM_12M;
      echeances = 12;
      montantEcheance = Math.ceil((prixFinal * MAJORATION_12M) / 12);
      prixTotal = montantEcheance * 12;
    }

    const varianteChoisie = await trouverVariante(nomProduit);

    // Si l acheteur est connecte, on preremplit son email de session :
    // l acces est indexe sur cette adresse, autant qu il paie avec.
    const emailConnecte = emailDeSession();

    const donneesCheckout: any = {
      custom: {
        formation: f.code,
        formule: formule,
        paiement: paiement,
        echeances: String(echeances),
        prix_total: String(prixTotal),
      },
    };
    if (emailConnecte) donneesCheckout.email = emailConnecte;

    let libelle: string;
    if (paiement === "4x") {
      libelle = "Formation " + f.code + " - formule " + formule +
        " - 4 mensualites de " + montantEcheance + " EUR (total " + prixTotal + " EUR)";
      donneesCheckout.variant_quantities = [
        { variant_id: Number(varianteChoisie), quantity: montantEcheance },
      ];
    } else if (paiement === "12m") {
      libelle = "Formation " + f.code + " - formule " + formule +
        " - parcours en 12 mois, " + montantEcheance + " EUR par mois (total " +
        prixTotal + " EUR)";
      donneesCheckout.variant_quantities = [
        { variant_id: Number(varianteChoisie), quantity: montantEcheance },
      ];
    } else {
      libelle = (estAtelier ? "Atelier " : "Formation ") + f.code + " - formule " + formule;
    }

    const attributs: any = {
      product_options: {
        name: f.titre,
        description: libelle,
        redirect_url: "https://academiapro.fr/dashboard",
      },
      checkout_data: donneesCheckout,
    };

    // Le prix personnalise ne vaut que pour le paiement unique : Lemon Squeezy
    // ne le conserve pas d une echeance a l autre.
    if (paiement === "comptant") {
      attributs.custom_price = Math.round(montantEcheance * 100);
    }

    const corps = {
      data: {
        type: "checkouts",
        attributes: attributs,
        relationships: {
          store: { data: { type: "stores", id: cacheStoreId } },
          variant: { data: { type: "variants", id: varianteChoisie } },
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
