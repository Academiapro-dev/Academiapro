import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { nom, formation, code, date, niveau } = await req.json();
    const certifId = `ACAD-${code}-${Date.now().toString(36).toUpperCase()}`;

    const certifHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Certificat ${formation} - AcadémIA Pro</title>
<style>
  body { margin: 0; padding: 20px; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .page { width: 900px; }
  .certificat {
    width: 900px;
    min-height: 680px;
    background: linear-gradient(160deg, #0d0d2b 0%, #0a0a1a 40%, #12122a 70%, #0d0d2b 100%);
    position: relative;
    padding: 55px 65px;
    box-sizing: border-box;
    font-family: Georgia, serif;
    color: #fff;
    overflow: hidden;
  }
  .filigrane {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 120px;
    font-weight: bold;
    color: rgba(200,169,110,0.04);
    letter-spacing: 10px;
    white-space: nowrap;
    pointer-events: none;
    font-family: Georgia, serif;
  }
  .bordure-ext {
    position: absolute;
    top: 12px; left: 12px; right: 12px; bottom: 12px;
    border: 2px solid #D4AF37;
    pointer-events: none;
  }
  .bordure-int {
    position: absolute;
    top: 20px; left: 20px; right: 20px; bottom: 20px;
    border: 1px solid rgba(212,175,55,0.4);
    pointer-events: none;
  }
  .coin {
    position: absolute;
    width: 50px;
    height: 50px;
  }
  .coin svg { width: 50px; height: 50px; }
  .c-tl { top: 8px; left: 8px; }
  .c-tr { top: 8px; right: 8px; transform: scaleX(-1); }
  .c-bl { bottom: 8px; left: 8px; transform: scaleY(-1); }
  .c-br { bottom: 8px; right: 8px; transform: scale(-1); }
  .entete { text-align: center; margin-bottom: 25px; position: relative; }
  .logo-text {
    color: #D4AF37;
    font-size: 26px;
    font-weight: bold;
    letter-spacing: 6px;
    text-transform: uppercase;
  }
  .etoiles { color: #D4AF37; font-size: 14px; letter-spacing: 8px; margin: 6px 0; }
  .titre-certif {
    font-size: 12px;
    letter-spacing: 8px;
    color: rgba(212,175,55,0.7);
    text-transform: uppercase;
    margin: 15px 0 8px;
  }
  .separateur {
    display: flex;
    align-items: center;
    gap: 15px;
    margin: 12px auto;
    max-width: 500px;
  }
  .sep-ligne { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #D4AF37, transparent); }
  .sep-losange { color: #D4AF37; font-size: 10px; }
  .decerne { text-align: center; font-size: 14px; color: rgba(255,255,255,0.55); margin: 10px 0 5px; font-style: italic; }
  .nom {
    text-align: center;
    font-size: 52px;
    color: #D4AF37;
    margin: 8px 0 15px;
    font-style: italic;
    text-shadow: 0 0 30px rgba(212,175,55,0.3);
  }
  .texte-formation { text-align: center; color: rgba(255,255,255,0.55); font-size: 13px; margin-bottom: 8px; }
  .formation-titre {
    text-align: center;
    font-size: 20px;
    color: #fff;
    font-weight: bold;
    margin-bottom: 5px;
    letter-spacing: 1px;
  }
  .niveau-badge {
    display: inline-block;
    background: linear-gradient(135deg, #D4AF37, #a07840);
    color: #0a0a1a;
    padding: 4px 18px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .niveau-wrap { text-align: center; margin: 8px 0 18px; }
  .texte-attestation {
    text-align: center;
    color: rgba(255,255,255,0.45);
    font-size: 12px;
    line-height: 1.8;
    max-width: 600px;
    margin: 0 auto 25px;
    font-style: italic;
  }
  .pied {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 18px;
    border-top: 1px solid rgba(212,175,55,0.25);
    margin-top: 5px;
  }
  .pied-item { text-align: center; }
  .pied-label { color: rgba(255,255,255,0.3); font-size: 9px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 5px; }
  .pied-valeur { color: #D4AF37; font-size: 13px; font-weight: bold; }
  .signature-nom { font-style: italic; font-size: 18px; color: #D4AF37; }
  .signature-titre { color: rgba(255,255,255,0.35); font-size: 10px; letter-spacing: 1px; }
  .qr-box {
    width: 70px; height: 70px;
    border: 1px solid rgba(212,175,55,0.4);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 4px;
    background: rgba(212,175,55,0.05);
    font-size: 28px;
  }
  .certif-id { color: rgba(255,255,255,0.25); font-size: 9px; letter-spacing: 1px; text-align: center; margin-top: 10px; }
  .sceau {
    position: absolute;
    bottom: 80px;
    right: 80px;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 2px solid rgba(212,175,55,0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(212,175,55,0.05);
    font-size: 9px;
    color: rgba(212,175,55,0.5);
    letter-spacing: 1px;
    text-align: center;
    text-transform: uppercase;
  }
</style>
</head>
<body>
<div class="page">
<div class="certificat">

  <div class="filigrane">AcadémIA Pro</div>

  <div class="bordure-ext"></div>
  <div class="bordure-int"></div>

  <div class="coin c-tl">
    <svg viewBox="0 0 50 50" fill="none">
      <path d="M5 45 L5 5 L45 5" stroke="#D4AF37" stroke-width="2"/>
      <path d="M5 35 L5 15 M15 5 L35 5" stroke="#D4AF37" stroke-width="0.8" opacity="0.5"/>
      <circle cx="5" cy="5" r="3" fill="#D4AF37"/>
    </svg>
  </div>
  <div class="coin c-tr">
    <svg viewBox="0 0 50 50" fill="none">
      <path d="M5 45 L5 5 L45 5" stroke="#D4AF37" stroke-width="2"/>
      <path d="M5 35 L5 15 M15 5 L35 5" stroke="#D4AF37" stroke-width="0.8" opacity="0.5"/>
      <circle cx="5" cy="5" r="3" fill="#D4AF37"/>
    </svg>
  </div>
  <div class="coin c-bl">
    <svg viewBox="0 0 50 50" fill="none">
      <path d="M5 45 L5 5 L45 5" stroke="#D4AF37" stroke-width="2"/>
      <path d="M5 35 L5 15 M15 5 L35 5" stroke="#D4AF37" stroke-width="0.8" opacity="0.5"/>
      <circle cx="5" cy="5" r="3" fill="#D4AF37"/>
    </svg>
  </div>
  <div class="coin c-br">
    <svg viewBox="0 0 50 50" fill="none">
      <path d="M5 45 L5 5 L45 5" stroke="#D4AF37" stroke-width="2"/>
      <path d="M5 35 L5 15 M15 5 L35 5" stroke="#D4AF37" stroke-width="0.8" opacity="0.5"/>
      <circle cx="5" cy="5" r="3" fill="#D4AF37"/>
    </svg>
  </div>

  <div class="entete">
    <div style="font-size:40px;margin-bottom:5px;">🏆</div>
    <div class="logo-text">AcadémIA Pro</div>
    <div class="etoiles">★ ★ ★ ★ ★</div>
  </div>

  <div class="titre-certif">Certificat de Réussite</div>

  <div class="separateur">
    <div class="sep-ligne"></div>
    <div class="sep-losange">◆</div>
    <div class="sep-ligne"></div>
  </div>

  <div class="decerne">Ce certificat est décerné à</div>
  <div class="nom">${nom}</div>

  <div class="separateur">
    <div class="sep-ligne"></div>
    <div class="sep-losange">◆</div>
    <div class="sep-ligne"></div>
  </div>

  <div class="texte-formation">pour avoir complété avec excellence la formation</div>
  <div class="formation-titre">${formation}</div>
  <div class="niveau-wrap"><span class="niveau-badge">${niveau || "Expert"}</span></div>

  <div class="texte-attestation">
    Cette certification officielle atteste des compétences acquises, validées et reconnues<br/>
    par la plateforme d'excellence AcadémIA Pro — Formation Professionnelle par l'Intelligence Artificielle
  </div>

  <div class="pied">
    <div class="pied-item">
      <div class="pied-label">Code Formation</div>
      <div class="pied-valeur">${code}</div>
    </div>
    <div class="pied-item">
      <div class="pied-label">Signature</div>
      <div class="signature-nom">Jacques Lalou</div>
      <div class="signature-titre">Fondateur · AcadémIA Pro</div>
    </div>
    <div class="pied-item">
      <div class="pied-label">Vérification</div>
      <div class="qr-box">🔐</div>
      <div style="color:rgba(212,175,55,0.5);font-size:9px;">academiapro.fr/verify</div>
    </div>
    <div class="pied-item">
      <div class="pied-label">Date</div>
      <div class="pied-valeur">${date}</div>
    </div>
  </div>

  <div class="certif-id">Certificat N° ${certifId} — Document officiel AcadémIA Pro</div>

</div>
</div>
</body>
</html>`;

    return NextResponse.json({
      success: true,
      certif_html: certifHtml,
      certif_id: certifId,
      nom,
      formation,
    });

  } catch (error) {
    return NextResponse.json({ error: "Erreur generation certificat" }, { status: 500 });
  }
}
