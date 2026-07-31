import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ADMINS = ["contact@academiapro.fr"];
const MAX_PAR_JOUR = 10;

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

function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\x7E]/g, " ");
}

function sansQCM(contenu: string): string {
  const t = String(contenu || "");
  const debut = t.search(/^#{1,6}\s*QCM/im);
  if (debut < 0) return t;
  return t.slice(0, debut).trim();
}

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
    let tenant = session.tenantId;
    if (!tenant && estAdmin) tenant = url.searchParams.get("tenant");

    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Cette formation ne fait pas partie de votre espace." },
        { status: 403 }
      );
    }

    // LIMITE DE RYTHME. Un catalogue entier ne se telecharge pas en une nuit :
    // au-dela de dix manuels par jour, on suspend et on regarde qui c est.
    if (!estAdmin) {
      const veille = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("organisme_telechargements")
        .select("*", { count: "exact", head: true })
        .eq("email", session.email)
        .gte("telecharge_le", veille);

      if (typeof count === "number" && count >= MAX_PAR_JOUR) {
        return NextResponse.json(
          {
            ok: false,
            erreur:
              "Vous avez telecharge " + MAX_PAR_JOUR +
              " manuels au cours des dernieres vingt-quatre heures. Reessayez demain.",
          },
          { status: 429 }
        );
      }
    }

    const { data: cours } = await supabase
      .from("organisme_cours")
      .select("id, code, titre, duree, objectifs, prerequis, public_cible, publie")
      .eq("code", code)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!cours) {
      return NextResponse.json({ ok: false, erreur: "Formation introuvable." }, { status: 404 });
    }

    if (!cours.publie && session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Cette formation n est pas encore ouverte." },
        { status: 403 }
      );
    }

    const { data: modules } = await supabase
      .from("organisme_modules")
      .select("chapitre, chapitre_titre, numero, titre, type, contenu")
      .eq("cours_id", cours.id)
      .eq("tenant_id", tenant)
      .order("chapitre", { ascending: true })
      .order("numero", { ascending: true })
      .limit(500);

    const utiles = (modules || []).filter(function (m: any) {
      return m.contenu && sansQCM(m.contenu).trim().length > 100;
    });

    if (utiles.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun module redige : le manuel serait vide." },
        { status: 400 }
      );
    }

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, numero_da")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const nomOrganisme = (org && org.raison_sociale) || "Organisme de formation";

    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
    const italique = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const vert = rgb(0.04, 0.24, 0.18);
    const noir = rgb(0.13, 0.13, 0.13);
    const gris = rgb(0.45, 0.45, 0.45);

    let page = pdf.addPage([595, 842]);
    let y = 780;

    function nouvelle() {
      page = pdf.addPage([595, 842]);
      y = 780;
    }

    function saut(besoin: number) {
      if (y - besoin < 75) nouvelle();
    }

    function ecrire(texte: string, taille: number, police: any, couleur: any, interligne: number) {
      const mots = ascii(texte).split(" ");
      let ligne = "";
      const largeurMax = 485;
      for (const mot of mots) {
        const essai = ligne ? ligne + " " + mot : mot;
        if (police.widthOfTextAtSize(essai, taille) > largeurMax) {
          saut(taille + interligne);
          page.drawText(ligne, { x: 55, y: y, size: taille, font: police, color: couleur });
          y = y - taille - interligne;
          ligne = mot;
        } else {
          ligne = essai;
        }
      }
      if (ligne) {
        saut(taille + interligne);
        page.drawText(ligne, { x: 55, y: y, size: taille, font: police, color: couleur });
        y = y - taille - interligne;
      }
    }

    y = 600;
    ecrire(nomOrganisme.toUpperCase(), 12, gras, vert, 6);
    y = y - 20;
    ecrire(cours.titre, 26, gras, noir, 10);
    y = y - 14;
    if (cours.duree) ecrire("Formation de " + cours.duree + " heures", 13, normal, gris, 6);
    ecrire(utiles.length + " modules", 13, normal, gris, 6);
    y = y - 30;
    ecrire("Support de formation", 11, italique, gris, 6);
    if (org && org.numero_da) {
      ecrire("Declaration d activite n " + org.numero_da, 9, normal, gris, 5);
    }
    y = y - 20;
    ecrire("Exemplaire personnel remis a " + session.email, 10, gras, vert, 6);

    nouvelle();
    ecrire("SOMMAIRE", 17, gras, vert, 10);
    y = y - 12;

    let chapitreCourant = -1;
    for (const m of utiles) {
      if (m.chapitre !== chapitreCourant) {
        chapitreCourant = m.chapitre;
        y = y - 8;
        ecrire("Chapitre " + m.chapitre + " · " + (m.chapitre_titre || ""), 11.5, gras, vert, 6);
      }
      ecrire("   " + m.chapitre + "." + m.numero + "  " + m.titre, 10, normal, noir, 5);
    }

    if (cours.objectifs || cours.prerequis || cours.public_cible) {
      nouvelle();
      ecrire("PRESENTATION", 17, gras, vert, 10);
      y = y - 10;

      if (cours.objectifs) {
        ecrire("Objectifs pedagogiques", 11.5, gras, vert, 6);
        ecrire(cours.objectifs, 11, normal, noir, 6);
        y = y - 10;
      }
      if (cours.prerequis) {
        ecrire("Prerequis", 11.5, gras, vert, 6);
        ecrire(cours.prerequis, 11, normal, noir, 6);
        y = y - 10;
      }
      if (cours.public_cible) {
        ecrire("Public concerne", 11.5, gras, vert, 6);
        ecrire(cours.public_cible, 11, normal, noir, 6);
      }
    }

    chapitreCourant = -1;

    for (const m of utiles) {
      if (m.chapitre !== chapitreCourant) {
        chapitreCourant = m.chapitre;
        nouvelle();
        y = 700;
        ecrire("CHAPITRE " + m.chapitre, 13, gras, gris, 8);
        ecrire(m.chapitre_titre || "", 22, gras, vert, 10);
        nouvelle();
      } else {
        nouvelle();
      }

      ecrire(m.chapitre + "." + m.numero + "  " + m.titre, 16, gras, vert, 10);
      y = y - 10;

      const texte = sansQCM(m.contenu);

      for (const brute of texte.split("\n")) {
        const l = brute.trim();
        if (!l || l === "---") {
          y = y - 6;
          continue;
        }
        if (/^#{1,2}\s/.test(l)) {
          y = y - 8;
          ecrire(l.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, ""), 14, gras, vert, 8);
          continue;
        }
        if (/^#{3,6}\s/.test(l)) {
          y = y - 5;
          ecrire(l.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, ""), 12, gras, noir, 7);
          continue;
        }
        if (/^[-*]\s+/.test(l)) {
          ecrire("· " + l.replace(/^[-*]\s+/, "").replace(/\*\*/g, ""), 10.5, normal, noir, 6);
          continue;
        }
        if (l.startsWith("> ")) {
          ecrire(l.replace(/^>\s*/, "").replace(/\*\*/g, ""), 10.5, italique, gris, 6);
          continue;
        }
        ecrire(l.replace(/\*\*/g, "").replace(/`/g, ""), 10.5, normal, noir, 6);
        y = y - 3;
      }
    }

    // FILIGRANE ET PIED DE PAGE NOMINATIFS. Un exemplaire qui circule designe
    // celui qui l a sorti : c est la seule protection qui dissuade vraiment.
    const marque = ascii(session.email);
    const quand = new Date().toLocaleDateString("fr-FR");
    const pages = pdf.getPages();

    for (let i = 0; i < pages.length; i = i + 1) {
      const p = pages[i];

      p.drawText(marque, {
        x: 90,
        y: 250,
        size: 26,
        font: gras,
        color: rgb(0.86, 0.86, 0.86),
        rotate: degrees(38),
        opacity: 0.35,
      });

      if (i > 0) {
        p.drawText(
          ascii(cours.titre + " - " + nomOrganisme + " - page " + i),
          { x: 55, y: 36, size: 7.5, font: normal, color: gris }
        );
      }

      p.drawText(
        ascii("Exemplaire remis a " + session.email + " le " + quand + " - usage personnel, diffusion interdite"),
        { x: 55, y: 24, size: 7, font: normal, color: rgb(0.6, 0.6, 0.6) }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;

    await supabase.from("organisme_telechargements").insert({
      tenant_id: tenant,
      email: session.email,
      type: "manuel",
      code: cours.code,
      adresse_ip: ip ? String(ip).split(",")[0].trim() : null,
      navigateur: req.headers.get("user-agent") || null,
    });

    const octets = await pdf.save();
    const nomFichier = ascii(cours.code + "-" + cours.titre)
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .slice(0, 60);

    return new NextResponse(Buffer.from(octets), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + nomFichier + '.pdf"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
