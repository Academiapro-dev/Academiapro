export default function FormationsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#fff', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ color: '#c8a96e', fontSize: '12px', letterSpacing: '3px', margin: '0 0 12px' }}>CATALOGUE COMPLET</p>
          <h1 style={{ color: '#fff', fontSize: '36px', margin: '0 0 12px' }}>Nos 131 Formations Certifiantes</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', margin: '0 0 24px' }}>
            131 formations · Certification AcadémIA Pro · Paiement 3x sans frais · Garantie 30 jours
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: '#1a1a2e', border: '1px solid #c8a96e', color: '#c8a96e', padding: '6px 16px', borderRadius: '20px', fontSize: '13px' }}>Certification AcadémIA Pro</span>
            <span style={{ background: '#1a1a2e', border: '1px solid #c8a96e', color: '#c8a96e', padding: '6px 16px', borderRadius: '20px', fontSize: '13px' }}>Paiement 3x sans frais</span>
            <span style={{ background: '#1a1a2e', border: '1px solid #c8a96e', color: '#c8a96e', padding: '6px 16px', borderRadius: '20px', fontSize: '13px' }}>Garantie 30 jours</span>
            <span style={{ background: '#1a1a2e', border: '1px solid #c8a96e', color: '#c8a96e', padding: '6px 16px', borderRadius: '20px', fontSize: '13px' }}>Agent IA tuteur 24h/24</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            { code: 'F128', titre: 'Expert Claude et IA Generative', prix: '690', cat: 'IA', duree: '40h' },
            { code: 'F129', titre: 'No-Code et Automatisation IA', prix: '790', cat: 'IA', duree: '45h' },
            { code: 'F130', titre: 'Apps Natives avec IA', prix: '990', cat: 'IA', duree: '60h' },
            { code: 'F131', titre: 'Marketing Digital x IA', prix: '890', cat: 'Marketing', duree: '50h' },
            { code: 'F001', titre: 'Management et Leadership', prix: '490', cat: 'Business', duree: '30h' },
            { code: 'F002', titre: 'Communication Professionnelle', prix: '390', cat: 'Business', duree: '25h' },
            { code: 'F003', titre: 'Gestion du Stress et Bien-etre', prix: '390', cat: 'Bien-etre', duree: '20h' },
            { code: 'F004', titre: 'Anglais Professionnel A1 C2', prix: '590', cat: 'Langues', duree: '80h' },
            { code: 'F005', titre: 'Comptabilite et Gestion', prix: '490', cat: 'Business', duree: '35h' },
            { code: 'F006', titre: 'Ressources Humaines', prix: '490', cat: 'Business', duree: '30h' },
          ].map((f) => (
            <div key={f.code} style={{ background: '#1a1a2e', borderRadius: '12px', padding: '24px', border: '1px solid rgba(200,169,110,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#c8a96e', fontSize: '11px' }}>{f.code}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{f.cat}</span>
              </div>
              <h3 style={{ color: '#fff', fontSize: '15px', margin: '0 0 12px', lineHeight: '1.4' }}>{f.titre}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: '#c8a96e', fontSize: '20px', fontWeight: 'bold' }}>{f.prix}euro</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{f.duree}</span>
              </div>
              <div style={{ background: '#050508', borderRadius: '6px', padding: '6px 12px', marginBottom: '16px', textAlign: 'center' }}>
                <span style={{ color: '#c8a96e', fontSize: '11px' }}>Certification AcademIA Pro</span>
              </div>
              <a href={'/formation/' + f.code.toLowerCase()} style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg, #c8a96e, #a07840)', color: '#050508', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>
                Voir la formation
              </a>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '48px', padding: '32px', background: '#1a1a2e', borderRadius: '16px', border: '1px solid #c8a96e' }}>
          <p style={{ color: '#c8a96e', fontSize: '16px', margin: '0 0 8px' }}>131 formations disponibles</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0' }}>Catalogue complet · Agent IA tuteur inclus · Certification AcademIA Pro</p>
        </div>
      </div>
    </div>
  )
}