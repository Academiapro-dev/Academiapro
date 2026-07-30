import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

// VERROU. Un cours propre n appartient qu a son organisme : seul un membre ou
// un stagiaire de cet organisme peut le lire, et seulement s il est publie.
// L editeur y accede pour le service apres-vente.
export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, erreur: "Formation non precisee." }, { status: 400 });
    }

    const estAdmin = ADMINS.indexOf(session.email) >= 0;

    let requete = supabase
      .from("organisme_cours")
      .select("*")
      .eq("code", code)
      .limit(1);

    // L organisme du lecteur decide de ce qu il peut voir.
    if (session.tenantId) {
      requete = requete.eq("tenant_id", session.tenantId);
    } else if (estAdmin) {
      const t = url.searchParams.get("tenant");
      if (t) requete = requete.eq("tenant_id", t);
    } else {
      return NextResponse.json(
        { ok: false, erreur: "Cette formation ne fait pas partie de votre espace." },
        { status: 403 }
      );
    }

    const { data: cours } = await requete.maybeSingle();

    if (!cours) {
      return NextResponse.json({ ok: false, erreur: "Formation introuvable." }, { status: 404 });
    }

    // Un brouillon reste invisible des stagiaires. L organisme et l editeur
    // peuvent le relire pour verifier avant publication.
    const estMembre = session.role !== "stagiaire";
    if (!cours.publie && !estMembre && !estAdmin) {
      return NextResponse.json(
        { ok: false, erreur: "Cette formation n est pas encore ouverte." },
        { status: 403 }
      );
    }

    const { data: modules } = await supabase
      .from("organisme_modules")
      .select("id, chapitre, chapitre_titre, numero, titre, type, contenu")
      .eq("cours_id", cours.id)
      .eq("tenant_id", cours.tenant_id)
      .order("chapitre", { ascending: true })
      .order("numero", { ascending: true })
      .limit(500);

    // Le module demande, s il y en a un : on ne renvoie qu un contenu a la fois.
    const ch = url.searchParams.get("chapitre");
    const mo = url.searchParams.get("module");

    let contenu = null;
    let moduleCourant = null;

    if (ch && mo) {
      const trouve = (modules || []).find(function (m: any) {
        return String(m.chapitre) === String(ch) && String(m.numero) === String(mo);
      });
      if (trouve) {
        contenu = trouve.contenu || "";
        moduleCourant = { chapitre: trouve.chapitre, numero: trouve.numero, titre: trouve.titre, type: trouve.type };
      }
    }

    // Le plan, sans les contenus : c est ce que le sommaire affiche.
    const chapitres: any = {};
    for (const m of modules || []) {
      const c = m.chapitre || 1;
      if (!chapitres[c]) {
        chapitres[c] = { numero: c, titre: m.chapitre_titre || "Chapitre " + c, modules: [] };
      }
      chapitres[c].modules.push({
        numero: m.numero,
        titre: m.titre,
        type: m.type,
        redige: !!(m.contenu && String(m.contenu).trim().length > 200),
      });
    }

    const plan = Object.keys(chapitres)
      .map(function (k) { return chapitres[k]; })
      .sort(function (a: any, b: any) { return a.numero - b.numero; });

    return NextResponse.json({
      ok: true,
      cours: {
        code: cours.code,
        titre: cours.titre,
        domaine: cours.domaine,
        duree: cours.duree,
        objectifs: cours.objectifs,
        publie: cours.publie,
      },
      chapitres: plan,
      module: moduleCourant,
      contenu: contenu,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
