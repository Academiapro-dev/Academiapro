import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// PURGE RGPD DES PROSPECTS DU CRM — 09/09.
//
// LA REGLE (deja ecrite pour MysterLLC) : un prospect qui n est pas devenu
// client se conserve TROIS ANS a compter du dernier contact, pas plus.
// Ici la seule date connue est `derniere_interaction` ; elle sert de borne.
//
// CE QUE FAIT LA PURGE : elle ANONYMISE, elle ne supprime pas. La fiche
// reste (les statistiques de pertes gardent leur sens), mais tout ce qui
// identifie une personne est efface : email, nom, telephone, notes,
// LinkedIn, dirigeant, champs libres. `anonymise_le` marque la date.
//
// CE QU ELLE NE TOUCHE JAMAIS :
//   - les clients (statut 'client'), quel que soit leur age ;
//   - les fiches sans tenant ;
//   - le tenant de Jacques (TENANT_EXCLU) : ses 105 fiches sont a lui,
//     pas a un organisme client ;
//   - une fiche deja anonymisee.
//
// 🚨 DEUX MODES. `?compter=1` COMPTE, par tenant, sans rien ecrire : c est
// le mode a lancer d abord, et a relancer avant d activer le cron. Sans
// parametre, elle anonymise, par lots de 200, et rend ce qu elle a fait.
//
// ⚠️ Vercel appelle les crons avec `Authorization: Bearer CRON_SECRET`
// quand la variable existe. Si elle existe et ne correspond pas : refus.
// Si elle n existe pas, la route reste ouverte, comme les autres crons du
// projet — a poser le jour ou on la veut fermee.
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ANNEES = 3;
const LOT = 200;
const TENANT_EXCLU = "048da817-b4d1-40d8-9107-88fe87e600ee";
const STATUTS_PURGEABLES = ["prospect", "perdu"];

function borne(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - ANNEES);
  return d.toISOString();
}

// Vercel passe le secret en en-tete ; un humain qui verifie depuis Safari
// le passe dans l adresse (?cle=...). Meme valeur, deux portes.
function autorise(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return true;
  if (req.headers.get("authorization") === "Bearer " + secret) return true;
  return new URL(req.url).searchParams.get("cle") === secret;
}

export async function GET(req: NextRequest) {
  if (!autorise(req)) {
    return NextResponse.json({ ok: false, erreur: "Acces refuse" }, { status: 401 });
  }

  const url = new URL(req.url);
  const compter = url.searchParams.get("compter") === "1";
  const limite = borne();

  // Les candidates : anciennes, non clientes, d un tenant client, jamais
  // anonymisees.
  const { data: candidates, error } = await supabase
    .from("crm")
    .select("id, tenant_id, statut, derniere_interaction")
    .in("statut", STATUTS_PURGEABLES)
    .lt("derniere_interaction", limite)
    .is("anonymise_le", null)
    .not("tenant_id", "is", null)
    .neq("tenant_id", TENANT_EXCLU)
    .limit(compter ? 10000 : LOT);

  if (error) {
    return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  }

  const parTenant: Record<string, number> = {};
  for (const c of candidates || []) {
    parTenant[c.tenant_id] = (parTenant[c.tenant_id] || 0) + 1;
  }

  if (compter) {
    return NextResponse.json({
      ok: true,
      mode: "comptage",
      regle: "statut prospect ou perdu, derniere_interaction avant " + limite.slice(0, 10) + ", tenant client",
      total: (candidates || []).length,
      par_tenant: parTenant,
      rien_n_a_ete_modifie: true,
    });
  }

  const maintenant = new Date().toISOString();
  let anonymisees = 0;
  const echecs: any[] = [];

  for (const c of candidates || []) {
    // L email doit rester unique et lisible comme « purge » : on garde
    // l identifiant de la fiche dedans.
    const { error: eUp } = await supabase
      .from("crm")
      .update({
        email: "anonyme-" + c.id + "@purge.rgpd",
        nom: null,
        telephone: null,
        notes: null,
        linkedin: null,
        dirigeant_prenom: null,
        dirigeant_nom: null,
        ville: null,
        champs: null,
        formation_interesse: null,
        anonymise_le: maintenant,
      })
      .eq("id", c.id);
    if (eUp) echecs.push({ id: c.id, erreur: eUp.message });
    else anonymisees = anonymisees + 1;
  }

  return NextResponse.json({
    ok: true,
    mode: "purge",
    borne: limite.slice(0, 10),
    anonymisees,
    par_tenant: parTenant,
    echecs: echecs.slice(0, 20),
    reste_probablement: (candidates || []).length === LOT,
  });
}
