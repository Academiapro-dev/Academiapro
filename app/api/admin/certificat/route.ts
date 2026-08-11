import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 30;

// Comptes autorises a emettre une attestation pour quelqu'un d'autre
// (generateur manuel de l'admin). Ajouter une adresse ici si besoin.
const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function envoyerEmailAttestation(email: string, nom: string, formation: string, certifId: string) {
  if (!email) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AcadémIA Pro <certificats@academiapro.fr>",
        to: email,
        subject: "Votre attestation de fin de formation",
        // LE LIEN MENE AU DOCUMENT, PAS AU CONTROLE.
        //
        // Il pointait vers /verifier, la page qui dit seulement si le numero
        // existe. Le destinataire, lui, veut son attestation : le detail de
        // son parcours, ses notes, la mention de portee — tout cela est sur
        // /attestation, qui fait foi.
        html: "<p>Bonjour " + nom + ",</p><p>Vous avez terminé la formation <strong>" + formation + "</strong>. Votre attestation de fin de formation est disponible.</p><p>Vous pouvez la consulter et l'imprimer à tout moment : <a href=\"https://academiapro.fr/attestation?certif=" + encodeURIComponent(certifId) + "\">academiapro.fr/attestation</a></p><p>L'équipe AcadémIA Pro</p>",
      }),
    });
  } catch (e) {
    console.error("Erreur envoi email attestation:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nom, formation, code, date, niveau, userEmail, jeton_interne } = await req.json();

    // ---- Verrou ----
    //
    // DEUX CHEMINS D APPEL, ET UN SEUL PORTAIT UN COOKIE.
    //
    // La route etait appelee depuis /api/progression quand tous les modules
    // sont valides : un fetch de serveur a serveur, qui ne transporte AUCUN
    // cookie. emailDeSession() renvoyait donc vide, la route repondait 401, et
    // l attestation n etait jamais emise — d ou une table restee vide malgre
    // un parcours complet. L appel interne s authentifie desormais par un
    // jeton partage, jamais expose au navigateur.
    const emailSession = emailDeSession();
    const appelInterne =
      !!jeton_interne &&
      !!process.env.SESSION_SECRET &&
      jeton_interne === process.env.SESSION_SECRET;

    if (!emailSession && !appelInterne) {
      return NextResponse.json({ success: false, error: "non connecte" }, { status: 401 });
    }

    const estAdmin = !appelInterne && ADMINS.indexOf(emailSession || "") >= 0;

    // Appel interne : la cible est celle que la progression a transmise.
    // Un eleve ne peut emettre que pour lui-meme ; l'admin garde son
    // generateur manuel.
    const emailCible = appelInterne
      ? (userEmail || null)
      : (estAdmin ? (userEmail || emailSession) : emailSession);

    if (!appelInterne && !estAdmin) {
      const { data: acces } = await supabase
        .from("acces_formations")
        .select("formation")
        .ilike("email", emailSession || "")
        .eq("formation", code)
        .maybeSingle();

      if (!acces) {
        return NextResponse.json(
          { success: false, error: "formation non acquise" },
          { status: 403 }
        );
      }
    }
    // ---- Fin du verrou ----

    const certifId = `ACAD-${code}-${Date.now().toString(36).toUpperCase()}`;

    // LE DOCUMENT DIT CE QU IL EST, ET RIEN DE PLUS.
    //
    // Il portait « Certificat Officiel », un badge « Expert » et la mention
    // d une « certification officielle […] reconnue ». AcadeMIA Pro n est pas
    // organisme certificateur : ces termes exposent l editeur autant que le
    // stagiaire, qui pourrait croire detenir un titre enregistre. Le document
    // atteste ce qui est verifiable — le suivi et la reussite des evaluations.
    const certifHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Attestation ${formation} - AcadémIA Pro</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
  .certificat {
    width: 1050px;
    height: 720px;
    background: linear-gradient(160deg, #0d0d2b 0%, #080818 35%, #0d0d25 65%, #0a0a20 100%);
    position: relative;
    padding: 45px 70px;
    font-family: Georgia, serif;
    color: #fff;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .filigrane {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-15deg);
    font-size: 160px;
    font-weight: bold;
    color: rgba(212,175,55,0.025);
    white-space: nowrap;
    pointer-events: none;
    letter-spacing: 5px;
  }
  .bordure-ext {
    position: absolute;
    top: 10px; left: 10px; right: 10px; bottom: 10px;
    border: 2px solid #D4AF37;
    pointer-events: none;
  }
  .bordure-int {
    position: absolute;
    top: 17px; left: 17px; right: 17px; bottom: 17px;
    border: 1px solid rgba(212,175,55,0.35);
    pointer-events: none;
  }
  .ornement {
    position: absolute;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #D4AF37;
  }
  .o-tl { top: 5px; left: 5px; }
  .o-tr { top: 5px; right: 5px; }
  .o-bl { bottom: 5px; left: 5px; }
  .o-br { bottom: 5px; right: 5px; }
  .ligne-horiz {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4), rgba(212,175,55,0.7), rgba(212,175,55,0.4), transparent);
    left: 70px;
    right: 70px;
  }
  .lh-top { top: 28px; }
  .lh-bot { bottom: 28px; }

  .entete {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 5px;
  }
  .logo-zone { text-align: left; }
  .logo-text { color: #D4AF37; font-size: 20px; font-weight: bold; letter-spacing: 5px; }
  .logo-sub { color: rgba(212,175,55,0.5); font-size: 9px; letter-spacing: 3px; margin-top: 3px; }
  .trophee { font-size: 45px; }
  .certif-label { text-align: right; }
  .certif-label-text { color: rgba(212,175,55,0.6); font-size: 10px; letter-spacing: 5px; text-transform: uppercase; }
  .certif-num { color: rgba(255,255,255,0.25); font-size: 9px; margin-top: 4px; }

  .corps { text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 10px 0; }
  .certifie-text { color: rgba(255,255,255,0.45); font-size: 13px; font-style: italic; margin-bottom: 8px; letter-spacing: 2px; }
  .nom {
    font-size: 62px;
    color: #D4AF37;
    font-style: italic;
    text-shadow: 0 0 40px rgba(212,175,55,0.25), 0 2px 4px rgba(0,0,0,0.5);
    margin-bottom: 12px;
    line-height: 1.1;
  }
  .sep {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 8px auto;
    width: 400px;
  }
  .sep-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent); }
  .sep-star { color: #D4AF37; font-size: 8px; }
  .pour-avoir { color: rgba(255,255,255,0.4); font-size: 12px; letter-spacing: 1px; margin: 8px 0 5px; }
  .formation-nom { font-size: 22px; color: #fff; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; }
  .badge-niveau {
    display: inline-block;
    background: linear-gradient(135deg, #D4AF37, #b8930a);
    color: #0a0a1a;
    padding: 5px 22px;
    border-radius: 30px;
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .attestation {
    color: rgba(255,255,255,0.3);
    font-size: 11px;
    line-height: 1.7;
    font-style: italic;
    max-width: 650px;
    margin: 0 auto;
  }

  .pied {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 15px;
    border-top: 1px solid rgba(212,175,55,0.2);
  }
  .pied-col { text-align: center; }
  .pied-label { color: rgba(255,255,255,0.25); font-size: 8px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px; }
  .pied-val { color: #D4AF37; font-size: 13px; font-weight: bold; }
  .sig-nom { font-style: italic; font-size: 20px; color: #D4AF37; }
  .sig-titre { color: rgba(255,255,255,0.3); font-size: 9px; letter-spacing: 1px; margin-top: 2px; }
  .etoiles-pied { color: #D4AF37; font-size: 10px; letter-spacing: 4px; margin-top: 3px; }
  .qr { width: 55px; height: 55px; border: 1px solid rgba(212,175,55,0.35); display: flex; align-items: center; justify-content: center; font-size: 22px; margin: 0 auto 3px; background: rgba(212,175,55,0.04); }
  .qr-text { color: rgba(212,175,55,0.4); font-size: 8px; }
</style>
</head>
<body>
<div class="certificat">
  <div class="filigrane">AcadémIA</div>
  <div class="bordure-ext"></div>
  <div class="bordure-int"></div>
  <div class="ligne-horiz lh-top"></div>
  <div class="ligne-horiz lh-bot"></div>
  <div class="ornement o-tl">❧</div>
  <div class="ornement o-tr">❧</div>
  <div class="ornement o-bl">❧</div>
  <div class="ornement o-br">❧</div>

  <div class="entete">
    <div class="logo-zone">
      <div class="logo-text">ACADÉMIA PRO</div>
      <div class="logo-sub">Formation Professionnelle par l'IA</div>
    </div>
    <div class="trophee">🎓</div>
    <div class="certif-label">
      <div class="certif-label-text">Attestation de fin de formation</div>
      <div class="certif-num">${certifId}</div>
    </div>
  </div>

  <div class="corps">
    <div class="certifie-text">La présente attestation est délivrée à</div>
    <div class="nom">${nom}</div>
    <div class="sep">
      <div class="sep-line"></div>
      <div class="sep-star">★ ★ ★</div>
      <div class="sep-line"></div>
    </div>
    <div class="pour-avoir">pour avoir suivi et achevé la formation</div>
    <div class="formation-nom">${formation}</div>
    <div><span class="badge-niveau">${niveau || "Formation achevée"}</span></div>
    <div class="attestation">
      Cette attestation rend compte du suivi intégral du parcours et de la réussite des<br/>
      évaluations qui le jalonnent. Elle ne constitue ni un diplôme, ni un titre, ni une<br/>
      certification professionnelle enregistrée.
    </div>
  </div>

  <div class="pied">
    <div class="pied-col">
      <div class="pied-label">Code Formation</div>
      <div class="pied-val">${code}</div>
      <div class="etoiles-pied">★ ★ ★ ★ ★</div>
    </div>
    <div class="pied-col">
      <div class="pied-label">Signature</div>
      <div class="sig-nom">Jacques Lalou</div>
      <div class="sig-titre">Fondateur · AcadémIA Pro</div>
    </div>
    <div class="pied-col">
      <div class="pied-label">Vérification</div>
      <div class="qr">🔐</div>
      <div class="qr-text">academiapro.fr/verifier</div>
    </div>
    <div class="pied-col">
      <div class="pied-label">Date de délivrance</div>
      <div class="pied-val">${date}</div>
    </div>
  </div>
</div>
</body>
</html>`;

    await supabase.from("certificats_delivres").insert({
      certif_id: certifId,
      user_email: emailCible || null,
      nom,
      formation_code: code,
      formation_titre: formation,
      niveau: niveau || "Formation achevee",
      certif_html: certifHtml,
    });

    if (emailCible) {
      await envoyerEmailAttestation(emailCible, nom, formation, certifId);
    }

    return NextResponse.json({
      success: true,
      certif_html: certifHtml,
      certif_id: certifId,
      nom,
      formation,
    });

  } catch (error) {
    return NextResponse.json({ error: "Erreur generation attestation" }, { status: 500 });
  }
}
