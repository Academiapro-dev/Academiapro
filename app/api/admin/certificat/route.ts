import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { nom, formation, code, date, niveau } = await req.json();

    const certifHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Certificat ${formation} - AcadémIA Pro</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400&display=swap');
  body { margin: 0; padding: 0; background: #050508; }
  .certificat { width: 900px; min-height: 650px; margin: 0 auto; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%); border: 3px solid #c8a96e; position: relative; padding: 60px; box-sizing: border-box; font-family: Georgia, serif; color: #fff; }
  .corner { position: absolute; width: 80px; height: 80px; border-color: #c8a96e; border-style: solid; }
  .tl { top: 20px; left: 20px; border-width: 3px 0 0 3px; }
  .tr { top: 20px; right: 20px; border-width: 3px 3px 0 0; }
  .bl { bottom: 20px; left: 20px; border-width: 0 0 3px 3px; }
  .br { bottom: 20px; right: 20px; border-width: 0 3px 3px 0; }
  .logo { text-align: center; margin-bottom: 30px; }
  .logo-text { color: #c8a96e; font-size: 28px; font-weight: bold; letter-spacing: 4px; }
  .titre { text-align: center; font-size: 14px; letter-spacing: 6px; color: rgba(200,169,110,0.7); margin-bottom: 30px; text-transform: uppercase; }
  .certifie { text-align: center; font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 15px; }
  .nom { text-align: center; font-size: 42px; color: #c8a96e; margin-bottom: 20px; font-style: italic; border-bottom: 1px solid rgba(200,169,110,0.3); padding-bottom: 20px; }
  .texte { text-align: center; color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.8; margin-bottom: 25px; }
  .formation { text-align: center; font-size: 22px; color: #fff; font-weight: bold; margin-bottom: 10px; }
  .niveau { text-align: center; color: #c8a96e; font-size: 14px; margin-bottom: 30px; }
  .infos { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(200,169,110,0.3); }
  .info-item { text-align: center; }
  .info-label { color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; }
  .info-valeur { color: #c8a96e; font-size: 14px; font-weight: bold; }
  .signature { text-align: center; margin-top: 10px; }
  .qr-placeholder { width: 80px; height: 80px; border: 2px solid rgba(200,169,110,0.3); display: flex; align-items: center; justify-content: center; color: rgba(200,169,110,0.5); font-size: 10px; margin: 0 auto; }
  .medaille { font-size: 50px; text-align: center; margin-bottom: 10px; }
</style>
</head>
<body>
<div class="certificat">
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>

  <div class="medaille">🏆</div>
  <div class="logo"><span class="logo-text">AcadémIA Pro</span></div>
  <div class="titre">Certificat de Réussite</div>

  <div class="certifie">Ce certificat est décerné à</div>
  <div class="nom">${nom}</div>

  <div class="texte">
    pour avoir complété avec succès la formation
  </div>
  <div class="formation">${formation}</div>
  <div class="niveau">Niveau ${niveau || "Professionnel"}</div>

  <div class="texte">
    Cette certification atteste des compétences acquises et validées<br/>
    par la plateforme de formation AcadémIA Pro.
  </div>

  <div class="infos">
    <div class="info-item">
      <div class="info-label">Code</div>
      <div class="info-valeur">${code}</div>
    </div>
    <div class="info-item signature">
      <div class="info-label">Signature</div>
      <div class="info-valeur" style="font-style:italic;">Jacques Lalou</div>
      <div style="color:rgba(255,255,255,0.4);font-size:11px;">Fondateur AcadémIA Pro</div>
    </div>
    <div class="info-item">
      <div class="info-label">Date</div>
      <div class="info-valeur">${date}</div>
    </div>
  </div>

  <div style="text-align:center;margin-top:20px;">
    <div class="qr-placeholder">QR Code</div>
    <div style="color:rgba(255,255,255,0.3);font-size:10px;margin-top:5px;">Verification : academiapro.fr/verify/${code}</div>
  </div>
</div>
</body>
</html>`;

    return NextResponse.json({
      success: true,
      certif_html: certifHtml,
      code,
      nom,
      formation,
    });

  } catch (error) {
    return NextResponse.json({ error: "Erreur generation certificat" }, { status: 500 });
  }
}
