import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { specialite: string } }): Promise<Metadata> {
  return {
    title: `Séance ${params.specialite} - AcadémIA Pro`,
    description: `Réservez votre séance thérapeutique ${params.specialite} avec nos experts IA`,
  }
}

export default function SeanceSpecialitePage({ params }: { params: { specialite: string } }) {
  const { specialite } = params

  const specialites: Record<string, { titre: string; description: string; prix: string; duree: string }> = {
    hypnose: {
      titre: 'Hypnose Thérapeutique',
      description: 'Séance d hypnose pour libérer vos blocages et transformer votre vie',
      prix: '79€',
      duree: '60 minutes'
    },
    sophrologie: {
      titre: 'Sophrologie',
      description: 'Techniques de relaxation et de gestion du stress par la sophrologie',
      prix: '59€',
      duree: '45 minutes'
    },
    coaching: {
      titre: 'Coaching Personnel',
      description: 'Accompagnement personnalisé pour atteindre vos objectifs',
      prix: '89€',
      duree: '60 minutes'
    },
    pnl: {
      titre: 'PNL - Programmation Neuro-Linguistique',
      description: 'Reprogrammez vos schémas mentaux avec la PNL',
      prix: '79€',
      duree: '60 minutes'
    },
    meditation: {
      titre: 'Méditation Guidée',
      description: 'Séance de méditation guidée pour retrouver calme et sérénité',
      prix: '49€',
      duree: '45 minutes'
    },
  }

  const info = specialites[specialite] || {
    titre: specialite.charAt(0).toUpperCase() + specialite.slice(1),
    description: `Séance thérapeutique spécialisée en ${specialite}`,
    prix: '69€',
    duree: '60 minutes'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#fff', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ color: '#c8a96e', fontSize: '12px', letterSpacing: '3px', margin: '0 0 16px' }}>
            SÉANCE THÉRAPEUTIQUE
          </p>
          <h1 style={{ color: '#fff', fontSize: '36px', margin: '0 0 16px' }}>
            {info.titre}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', margin: '0' }}>
            {info.description}
          </p>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '32px', marginBottom: '32px', border: '1px solid #c8a96e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <p style={{ color: '#c8a96e', fontSize: '12px', margin: '0 0 4px' }}>PRIX</p>
              <p style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', margin: '0' }}>{info.prix}</p>
            </div>
            <div>
              <p style={{ color: '#c8a96e', fontSize: '12px', margin: '0 0 4px' }}>DURÉE</p>
              <p style={{ color: '#fff', fontSize: '24px', margin: '0' }}>{info.duree}</p>
            </div>
          </div>
          
          <button style={{
            width: '100%',
            background: 'linear-gradient(135deg, #c8a96e, #a07840)',
            color: '#050508',
            border: 'none',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Réserver ma séance — {info.prix}
          </button>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '24px', border: '1px solid rgba(200,169,110,0.3)' }}>
          <h3 style={{ color: '#c8a96e', margin: '0 0 16px' }}>Ce qui est inclus</h3>
          <ul style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '2', paddingLeft: '20px' }}>
            <li>Séance individuelle avec expert certifié IA</li>
            <li>Suivi personnalisé post-séance</li>
            <li>Replay disponible 48h</li>
            <li>Support par messagerie 7 jours</li>
            <li>Garantie satisfaction 100%</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
