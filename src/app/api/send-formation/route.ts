import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { FORMATIONS } from '../../../data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

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

  // Récupérer la formation
  const formation = FORMATIONS.find((f: any) => f.code === formation_code)
  if (!formation) {
    return NextResponse.json({ error: 'Formation introuvable.' }, { status: 404 })
  }

  // Générer le contenu HTML du support de cours
  const chapitres = (formation as any).chapitres || []
  let programmeHTML = ''
  
  chapitres.forEach((chapitre: any) => {
    programmeHTML += `
      <div style="margin-bottom:32px;">
        <h2 style="color:#c8a96e;font-size:20px;border-bottom:2px solid #c8a96e;padding-bottom:8px;">
          Chapitre ${chapitre.num} — ${chapitre.titre}
        </h2>
        <p style="color:#666;font-size:13px;">${chapitre.heures}</p>
    `
    chapitre.modules?.forEach((m: any) => {
      programmeHTML += `
        <div style="background:#f9f9f9;border-left:4px solid #c8a96e;padding:16px;margin:12px 0;border-radius:4px;">
          <h3 style="font-size:15px;margin:0 0 8px;">Module ${m.num} — ${m.titre} <span style="color:#999;font-size:12px;">(${m.heures})</span></h3>
          <p style="color:#555;font-size:13px;line-height:1.6;">${m.contenu}</p>
        </div>
      `
    })
    programmeHTML += `</div>`
  })

  // Envoyer l'email avec le support de cours
  await resend.emails.send({
    from: 'AcadémIA Pro <onboarding@resend.dev>',
    to: email,
    subject: `📚 Votre support de cours — ${formation.titre}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;background:#050508;color:#fff;padding:40px;">
        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="color:#c8a96e;font-size:32px;">AcadémIA Pro</h1>
          <p style="color:#999;">Support de cours officiel</p>
        </div>
        <div style="background:#111;padding:32px;border-radius:16px;margin-bottom:32px;">
          <div style="font-size:48px;margin-bottom:16px;">${formation.icon}</div>
          <h1 style="color:#fff;font-size:28px;margin-bottom:8px;">${formation.titre}</h1>
          <p style="color:#c8a96e;">Formation ${formation.code} · ${formation.heures} · ${formation.duree}</p>
          <p style="color:#999;line-height:1.7;">${formation.description}</p>
        </div>
        <div style="background:#fff;color:#000;padding:32px;border-radius:16px;">
          <h2 style="color:#c8a96e;font-size:24px;margin-bottom:24px;">Programme complet</h2>
          ${programmeHTML}
        </div>
        <div style="text-align:center;margin-top:32px;color:#666;font-size:12px;">
          <p>Ce document est strictement personnel et confidentiel.</p>
          <p>© AcadémIA Pro — Tous droits réservés</p>
        </div>
      </div>
    `
  })

  // Marquer le PDF comme envoyé
  await supabase
    .from('stagiaires')
    .update({ pdf_envoye: true })
    .eq('email', email)
    .eq('formation_code', formation_code)

  return NextResponse.json({ success: true, message: 'Support de cours envoyé !' })
}

