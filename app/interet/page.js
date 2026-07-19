'use client';
import { useState } from 'react';

export default function PageInteret() {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [interet, setInteret] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [etat, setEtat] = useState('formulaire');
  const [erreur, setErreur] = useState('');

  const domaines = [
    'Ressources Humaines', 'Juridique et Droit', 'Gestion et Comptabilite',
    'Marketing et Communication', 'Informatique et IA', 'Therapies et Bien-etre',
    'Langues', 'Autre'
  ];

  async function envoyer() {
    setErreur('');
    if (!email || !email.includes('@')) { setErreur('Merci de saisir un email valide.'); return; }
    if (!consent) { setErreur('Merci de cocher la case de consentement pour recevoir nos informations.'); return; }
    setEtat('envoi');
    try {
      const r = await fetch('/api/enregistrer-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, email, interet, message, consentement: consent })
      });
      const d = await r.json();
      if (r.ok) { setEtat('merci'); } else { setEtat('formulaire'); setErreur(d.erreur || 'Une erreur est survenue.'); }
    } catch (e) {
      setEtat('formulaire'); setErreur('Connexion impossible, reessayez.');
    }
  }

  if (etat === 'merci') {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 16 }}>Merci !</h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
          Votre inscription est bien enregistree. Vous recevrez un email de bienvenue
          avec notre catalogue et serez parmi les premiers informes du lancement
          et de l&apos;Offre Fondateur.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Restez informe</h1>
      <p style={{ marginBottom: 28, lineHeight: 1.6 }}>
        263 formations professionnelles avec IA integree. Laissez vos coordonnees
        pour recevoir le catalogue et profiter de l&apos;Offre Fondateur au lancement.
      </p>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Prenom</label>
      <input value={prenom} onChange={(e) => setPrenom(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', marginBottom: 18, borderRadius: 8, border: '1px solid #ccc' }} />
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Email *</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', marginBottom: 18, borderRadius: 8, border: '1px solid #ccc' }} />
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Domaine qui vous interesse</label>
      <select value={interet} onChange={(e) => setInteret(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', marginBottom: 18, borderRadius: 8, border: '1px solid #ccc' }}>
        <option value="">-- Choisir --</option>
        {domaines.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Votre message (optionnel)</label>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
        placeholder="Dites-nous ce que vous cherchez"
        style={{ width: '100%', padding: '10px 12px', marginBottom: 18, borderRadius: 8, border: '1px solid #ccc', fontFamily: 'inherit' }} />
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 22, fontSize: '0.9rem', lineHeight: 1.5 }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
        <span>J&apos;accepte de recevoir par email les informations et offres d&apos;AcademIA Pro.
        Je peux me desinscrire a tout moment. Voir notre politique de confidentialite.</span>
      </label>
      {erreur && <p style={{ color: '#b00020', marginBottom: 16 }}>{erreur}</p>}
      <button onClick={envoyer} disabled={etat === 'envoi'}
        style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#1a56db', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
        {etat === 'envoi' ? 'Envoi...' : 'Recevoir le catalogue'}
      </button>
    </main>
  );
}
