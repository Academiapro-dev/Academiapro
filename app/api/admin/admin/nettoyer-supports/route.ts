import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../../lib/session";



export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function reparerEncodage(s: string): string {
  let t = String(s || "");
  if (!/\u00C3[\u0080-\u00BF]/.test(t)) return t;
  const propre = t.replace(/[^\u0000-\u00FF]/g, "");
  const octets = new Uint8Array(propre.length);
  for (let i = 0; i < propre.length; i++) {
    octets[i] = propre.charCodeAt(i) & 0xff;
  }
  try {
    return new TextDecoder("utf-8").decode(octets).normalize("NFC");
  } catch (e) {
    return t;
  }
}

function nettoyer(html: string): string {
  let t = String(html || "");
  t = t.replace(/Certification\s*:\s*[^<|]{0,60}(?=(&nbsp;)*\s*(\||<))/gi, " ");
  t = t.replace(/(Tarif|Prix)\s*:\s*[^<|]{0,40}(?=(&nbsp;)*\s*(\||<))/gi, " ");
  t = t.replace(/\bcertifi\u00E9e?\s+RS\b/gi, "professionnel");
  t = t.replace(/\bRS\s+([A-Z\u00C0-\u00DC][\w\u00C0-\u00FF-]{2,30})/g, "$1");
  t = t.replace(/(&nbsp;)*\s*\|\s*(&nbsp;)*\s*\|/g, " | ");
  return t;
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const executer = url.searchParams.get("executer") === "oui";
    const debut = Number(url.searchParams.get("debut") || 0);
    const taille = Math.min(Number(url.searchParams.get("taille") || 15), 25);

    const { data: fichiers, error: erreurListe } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (erreurListe) {
      return NextResponse.json({ ok: false, erreur: erreurListe.message }, { status: 500 });
    }

    const supports = (fichiers || [])
      .map((f) => f.name)
      .filter((n) => n.indexOf("_support_cours.html") > 0)
      .sort();

    const lot = supports.slice(debut, debut + taille);
    const modifies: string[] = [];
    const inchanges: string[] = [];
    const echecs: any[] = [];

    for (const nom of lot) {
      try {
        const { data } = await supabase.storage.from(BUCKET).download(nom);
        if (!data) {
          echecs.push({ nom: nom, erreur: "telechargement vide" });
          continue;
        }

        const source = await data.text();
        const corrige = nettoyer(reparerEncodage(source));

        if (corrige === source) {
          inchanges.push(nom);
          continue;
        }

        if (!executer) {
          modifies.push(nom);
          continue;
        }

        const sauvegarde = await supabase.storage
          .from(BUCKET)
          .upload("originaux/" + nom, new Blob([source], { type: "text/html" }), { upsert: false });

        if (sauvegarde.error) {
          const msg = String(sauvegarde.error.message || "").toLowerCase();
          if (msg.indexOf("exists") < 0 && msg.indexOf("duplicate") < 0) {
            echecs.push({ nom: nom, erreur: "sauvegarde impossible : " + sauvegarde.error.message });
            continue;
          }
        }

        const ecriture = await supabase.storage
          .from(BUCKET)
          .upload(nom, new Blob([corrige], { type: "text/html" }), { upsert: true });

        if (ecriture.error) {
          echecs.push({ nom: nom, erreur: ecriture.error.message });
          continue;
        }

        modifies.push(nom);
      } catch (e: any) {
        echecs.push({ nom: nom, erreur: String(e) });
      }
    }

    const suivant = debut + taille;
    return NextResponse.json({
      ok: true,
      mode: executer ? "EXECUTION" : "SIMULATION - aucun fichier touche",
      total_supports: supports.length,
      lot: debut + " a " + Math.min(suivant, supports.length),
      a_modifier: modifies.length,
      deja_propres: inchanges.length,
      echecs: echecs,
      exemples: modifies.slice(0, 10),
      suite: suivant < supports.length
        ? "/api/admin/nettoyer-supports?debut=" + suivant + (executer ? "&executer=oui" : "")
        : "TERMINE",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
