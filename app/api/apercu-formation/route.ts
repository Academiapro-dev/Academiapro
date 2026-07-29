import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Reparation appliquee a une CHAINE COURTE : un titre de module.
// Sur un document entier, un seul caractere exotique suffisait a tout annuler.
function reparerEncodage(s: string): string {
  let t = String(s || "");
  try { t = t.normalize("NFC"); } catch (e) {}
  if (!/\u00C3[\u0080-\u00BF]/.test(t)) return t;

  // On retire ce qui ne peut pas provenir d un octet latin-1 mal interprete,
  // au lieu de renoncer a reparer.
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

function texteBrut(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// La duree est stockee en base sous forme de texte : "130h", "100 h".
function heuresDeLaBase(duree: any): number {
  const m = String(duree || "").match(/(\d{1,4})/);
  return m ? parseInt(m[1], 10) : 0;
}

export async function GET(req: Request) {
  try {
    const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, version: 8, erreur: "code manquant" }, { status: 400 });
    }

    // La base est la seule source de verite du commercial : titre, prix ET duree.
    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix, duree")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, version: 8, erreur: "formation introuvable" }, { status: 404 });
    }

    const { data } = await supabase.storage
      .from(BUCKET)
      .download(code + "_support_cours.html");

    let modules: string[] = [];

    if (data) {
      const brut = texteBrut((await data.text()).slice(0, 150000));
      // On ne retient que l intitule : les durees du document d origine ne font
      // pas foi, seule la duree totale de la base est annoncee au client.
      const motif = /Module\s*(\d{1,2})\s*[:\-\u2013\u2014]?\s*([^()\u00B7|]{3,70}?)\s*\((\d{1,3})\s*h\)/g;
      let m;
      while ((m = motif.exec(brut)) !== null) {
        const ligne = reparerEncodage(m[2].replace(/\s+/g, " ").trim());
        if (ligne && modules.indexOf(ligne) < 0) modules.push(ligne);
        if (modules.length >= 25) break;
      }
    }

    return NextResponse.json({
      ok: true,
      version: 8,
      code: fiche.code,
      titre: fiche.titre,
      domaine: fiche.domaine,
      niveau: fiche.niveau,
      prix: fiche.prix,
      support_disponible: data ? true : false,
      nb_modules: modules.length,
      heures_programme: heuresDeLaBase(fiche.duree),
      modules: modules,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, version: 8, erreur: String(e) }, { status: 500 });
  }
}
