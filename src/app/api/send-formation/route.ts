import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import Anthropic from '@anthropic-ai/sdk'
import { FORMATIONS } from '../../../data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function genererContenuModule(formation: any, chapitre: any, module: any): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Tu es un expert formateur en ${formation.titre}. 
Génère un contenu de cours ULTRA-COMPLET et PROFESSIONNEL pour ce module.

Formation : ${formation.titre} (${formation.code}) — ${formation.tarif}€
Chapitre ${chapitre.num} : ${chapitre.titre}
Module ${module.num} : ${module.titre} (${module.heures})
Points abordés : ${module.contenu}

Génère un support de cours complet avec :
1. Introduction et contexte (pourquoi ce module est essentiel)
2. Objectifs pédagogiques (ce que l'apprenant saura faire)
3. Contenu théorique détaillé avec explications approfondies
4. Exemples concrets et cas pratiques du monde réel
5. Exercices pratiques avec instructions étape par étape
6. Points clés à retenir
7. Ressources et outils recommandés

Le contenu doit être en français, professionnel, et correspondre à une formation à ${formation.tarif}€.
Minimum 800 mots. Format HTML avec balises <h3>, <p>, <ul>, <li>, <strong>, <em>.`
    }]
  })
  return (response.content[0] as any).text
}

export async function POST(req: NextRequest) {
  const { email, formation_code } = await req.json()

  // Vérification stagiaire inscrit et payé
  const { data: stagiaire, error } = await supabase
    .from('stagiaires')
    .select('*')
    .eq('email', email)
    .eq('formation_code', formation_code)
    .eq('statut_paiement', 'payé')
    .single()

  if (error || !stagiaire) {
    return NextResponse.json({ 
      error: 'Accès refusé. Votre inscription n\'est pas encore finalisée.' 
    }, { status: 403 })
  }

  const formation = FORMATIONS.find((f: any) => f.code === formation_code)
  if (!formation) {
    return NextResponse.json({ error: 'Formation introuvable.' }, { status: 404 })
  }

  const chapitres = (formation as any).chapitres || []
  let programmeHTML = ''

  for (const chapitre of chapitres) {
    programmeHTML += `
      <div style="margin-bottom:48px;page-break-inside:avoid;">
        <div style="background:linear-gradient(135deg,#c8a96e,#a07840);padding:24px;border-radius:12px;margin-bottom:24px;">
          <h2 style="color:#fff;font-size:22px;margin:0;font-family:Georgia,serif;">
            Chapitre ${chapitre.num} — ${chapitre.titre}
          </h2>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">
            ${chapitre.modules?.length} modules · ${chapitre.heures}
          </p>
        </div>
    `

    for (const module of (chapitre.modules || [])) {
      const contenuDetaille = await genererContenuModule(formation, chapitre, module)
      
      programmeHTML += `
        <div style="margin-bottom:40px;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
          <div style="background:#f8f4ee;padding:20px 24px;border-bottom:2px solid #c8a96e;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <h3 style="color:#1a1a1a;font-size:18px;margin:0;font-family:Georgia,serif;">
                Module ${module.num} — ${module.titre}
              </h3>
              <span style="background:#c8a96e;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">
                ${module.heures}
              </span>
            </div>
            <p style="color:#666;font-size:13px;margin:8px 0 0;">
              ${module.contenu}
            </p>
          </div>
          <div style="padding:28px;font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#333;">
            ${contenuDetaille}
          </div>
        </div>
      `
    }
    programmeHTML += `</div>`
  }

  await resend.emails.send({
    from: 'AcadémIA Pro <onboarding@resend.dev>',
    to: email,
    subject: `📚 Support de cours complet — ${formation.titre}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; max-width: 900px; margin: 0 auto; background: #fff; }
          h3 { color: #c8a96e; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          strong { color: #1a1a1a; }
        </style>
      </head>
      <body>
        <div style="background:linear-gradient(135deg,#050508,#1a1a2e);padding:60px 40px;text-align:center;">
          <div style="font-size:64px;margin-bottom:16px;">${formation.icon}</div>
          <h1 style="color:#c8a96e;font-size:36px;font-family:Georgia,serif;margin:0 0 8px;">AcadémIA Pro</h1>
          <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;">Support de cours officiel — Document confidentiel</p>
        </div>

        <div style="background:#f8f4ee;padding:40px;border-bottom:4px solid #c8a96e;">
          <h1 style="color:#1a1a1a;font-size:32px;font-family:Georgia,serif;margin:0 0 16px;">${formation.titre}</h1>
          <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:20px;">
            <div><strong>Code :</strong> ${formation.code}</div>
            <div><strong>Durée :</strong> ${formation.heures} · ${formation.duree}</div>
            <div><strong>Certification :</strong> ${formation.cert}</div>
            <div><strong>Stagiaire :</strong> ${stagiaire.nom}</div>
          </div>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0;">${formation.description}</p>
        </div>

        <div style="padding:40px;">
          <h2 style="color:#c8a96e;font-size:28px;font-family:Georgia,serif;border-bottom:2px solid #c8a96e;padding-bottom:16px;margin-bottom:40px;">
            Programme complet détaillé
          </h2>
          ${programmeHTML}
        </div>

        <div style="background:#050508;padding:40px;text-align:center;margin-top:40px;">
          <p style="color:#c8a96e;font-size:16px;font-family:Georgia,serif;margin:0 0 8px;">AcadémIA Pro</p>
          <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">
            Ce document est strictement personnel et confidentiel.<br>
            Reproduction interdite · © AcadémIA Pro ${new Date().getFullYear()}
          </p>
        </div>
      </body>
      </html>
    `
  })

  await supabase
    .from('stagiaires')
    .update({ pdf_envoye: true })
    .eq('email', email)
    .eq('formation_code', formation_code)

  return NextResponse.json({ success: true, message: 'Support de cours complet envoyé !' })
}
