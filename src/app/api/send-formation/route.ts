import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export const maxDuration = 300



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
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }
  const lienHTML = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/formations-pdf/${formation_code}_support_cours.html`

  const htmlRes = await fetch(lienHTML)
const htmlContent = await htmlRes.text()

const pdfRes = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('api:sk_60bc11c38e94fc7f8a958ef1b491045d74283b3a').toString('base64'),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
  source: htmlContent,

})



  const pdfBuffer = await pdfRes.arrayBuffer()
  const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

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
          <p style="font-size:15px;color:#555;line-height:1.7;">Votre support de cours complet est en pièce jointe.</p>
          <p style="font-size:13px;color:#888;">Document personnel et confidentiel — AcadémIA Pro 2026</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `${formation_code}_support_cours.pdf`,
        content: pdfBase64,
      }
    ]
  })

  await supabase
    .from('stagiaires')
    .update({ pdf_envoye: true })
    .eq('email', email)
    .eq('formation_code', formation_code)

  return NextResponse.json({ success: true, message: 'Support PDF envoyé !' })
}
