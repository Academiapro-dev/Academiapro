import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email, formation_code } = await req.json()

  const { data: stagiaire, error } = await supabase
    .from('stagiaires')
    .select('*')
    .eq('email', email)
    .eq('formation_code', formation_code)
    .eq('statut_paiement', 'payé')
    .single()

  if (error || !stagiaire) {
    return NextResponse.json({ error: 'Accès refusé. Votre inscription n\'est pas encore finalisée.' }, { status: 403 })
  }

  const lienPDF = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/formations-pdf/${formation_code}_support_cours.html`

  await resend.emails.send({
    from: 'AcadémIA Pro <onboarding@resend.dev>',
    to: email,
    subject: `📚 Votre support de cours — ${formation_code}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;">
        <div style="background:linear-gradient(135deg,#050508,#1a1a2e);padding:40px;text-align:center;border-radius:12px;">
          <h1 style="color:#c8a96e;font-size:28px;margin:0 0 8px;">AcadémIA Pro</h1>
          <p style="color:rgba(255,255,255,0.6);margin:0;">Votre support de cours est prêt</p>
        </div>
        <div style="padding:32px 0;">
          <p style="font-size:16px;color:#333;">Bonjour ${stagiaire.nom},</p>
          <p style="font-size:15px;color:#555;line-height:1.7;">
            Votre support de cours complet pour la formation <strong>${formation_code}</strong> est disponible.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${lienPDF}" style="background:#c8a96e;color:#050508;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
              📚 Accéder à mon support de cours
            </a>
          </div>
          <p style="font-size:13px;color:#888;">Ce lien est personnel et confidentiel.</p>
        </div>
      </div>
    `
  })

  await supabase
    .from('stagiaires')
    .update({ pdf_envoye: true })
    .eq('email', email)
    .eq('formation_code', formation_code)

  return NextResponse.json({ success: true, message: 'Support de cours envoyé !' })
}
