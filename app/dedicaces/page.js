'use client';

import { useState, useEffect } from 'react';
import { supabaseNavigateur } from '@/lib/supabaseClient';

const TYPES = [
  { code: 'refoua_chelema', libelle: 'Pour la guerison de',
    titre: 'Refoua chelema' },
  { code: 'ilouy_nichmat', libelle: 'A la memoire de',
    titre: 'Ilouy nichmat' },
  { code: 'reussite', libelle: 'Pour la reussite de',
    titre: 'Reussite' },
  { code: 'gratitude', libelle: 'En gratitude pour',
    titre: 'Gratitude' },
];

function libelleType(code) {
  const t = TYPES.find((x) => x.code === code);
  return t ? t.libelle : '';
}

// L alphabet pour le clavier hebreu integre (finales incluses)
const LETTRES = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט',
  'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ',
  'ק', 'ר', 'ש', 'ת', 'ך', 'ם', 'ן', 'ף', 'ץ',
];

// Le ner tamid : la flamme qui encadre le nom en hebreu
function Flamme() {
  return (
    <svg width="13" height="18" viewBox="0 0 13 18" aria-hidden="true">
      <path d="M6.5 0 C8 3.5 12.5 5.5 12.5 10.5 A6 6 0 0 1 0.5 10.5 C0.5 7.5 3 5.5 4.5 3 C5 4.8 6 5.8 6.8 5.4 C6.2 3.5 6.2 1.8 6.5 0 Z"
        fill="#e3c567" />
      <path d="M6.5 6 C7.3 8 9.5 9 9.5 11.5 A3 3 0 0 1 3.5 11.5 C3.5 9.8 5 8.6 5.6 7.2 C5.9 8.2 6.3 8.8 6.5 8.6 Z"
        fill="#c9a227" />
    </svg>
  );
}

export default function Dedicaces() {
  const [session, setSession] = useState(undefined);
  const [uid, setUid] = useState(null);
  const [dedicaces, setDedicaces] = useState(null);
  const [formOuvert, setFormOuvert] = useState(false);
  const [type, setType] = useState('refoua_chelema');
  const [nom, setNom] = useState('');
  const [message, setMessage] = useState('');
  const [nomHebreu, setNomHebreu] = useState('');
  const [clavierOuvert, setClavierOuvert] = useState(false);
  const [editionId, setEditionId] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Le mur appartient a la vitrine (nuit d encre + or). On retire
  // la classe en quittant : les pages d etude restent parchemin.
  useEffect(() => {
    document.body.classList.add('vitrine');
    return () => document.body.classList.remove('vitrine');
  }, []);

  async function chargerMur() {
    const supabase = supabaseNavigateur();
    const { data } = await supabase
      .from('dedicaces')
      .select('id, utilisateur_id, type, nom_dedicace, nom_hebreu,'
        + ' message, date_debut, visible')
      .eq('visible', true)
      .order('created_at', { ascending: false })
      .limit(200);
    setDedicaces(data || []);
  }

  useEffect(() => {
    const supabase = supabaseNavigateur();
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session || null);
      if (data.session) {
        setUid(data.session.user.id);
        await chargerMur();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deposer() {
    const nomFr = nom.trim();
    const nomHe = nomHebreu.trim();
    const nomPropre = nomFr || nomHe;
    if (!nomPropre || enCours) {
      if (!nomPropre) {
        setErreur('Indiquez un nom - en francais ou en hebreu.');
      }
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const supabase = supabaseNavigateur();
      const valeurs = {
        type: type,
        nom_dedicace: nomPropre,
        nom_hebreu: nomHe || null,
        message: message.trim() ? { fr: message.trim() } : {},
      };
      const { error } = editionId
        ? await supabase.from('dedicaces')
            .update(valeurs).eq('id', editionId)
        : await supabase.from('dedicaces')
            .insert({ utilisateur_id: uid, ...valeurs });
      if (error) throw new Error(error.message);
      setNom('');
      setMessage('');
      setNomHebreu('');
      setClavierOuvert(false);
      setEditionId(null);
      setFormOuvert(false);
      await chargerMur();
    } catch (e) {
      setErreur(e.message || 'Depot impossible, reessayez.');
    } finally {
      setEnCours(false);
    }
  }

  async function retirer(id) {
    const supabase = supabaseNavigateur();
    await supabase.from('dedicaces')
      .update({ visible: false })
      .eq('id', id);
    await chargerMur();
  }

  const bouton = {
    padding: '10px 18px', borderRadius: 10,
    border: '1px solid rgba(201, 162, 39, 0.45)',
    background: 'transparent', color: '#f5efe0',
    fontSize: '0.9rem', cursor: 'pointer',
  };

  const boutonOr = {
    padding: '10px 18px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(120deg, #c9a227, #e3c567)',
    color: '#0f1420', fontWeight: 600,
    fontSize: '0.9rem', cursor: 'pointer',
  };

  const champSombre = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', borderRadius: 10,
    border: '1px solid rgba(245, 239, 224, 0.25)',
    background: 'rgba(245, 239, 224, 0.06)',
    color: 'inherit', fontFamily: 'inherit',
  };

  if (session === undefined) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
        <p className="vitrine-texte">Ouverture du mur...</p>
      </main>
    );
  }

  if (session === null) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>
          Mur des dedicaces
        </h1>
        <p className="vitrine-texte" style={{ marginBottom: 20 }}>
          Le mur des dedicaces est reserve aux membres. Connectez-vous
          pour le decouvrir et y deposer la votre.
        </p>
        <a href="/connexion" className="bouton-or">
          Se connecter ou creer un compte
        </a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>
        Mur des dedicaces
      </h1>
      <p className="vitrine-texte" style={{ marginBottom: 6 }}>
        Depuis toujours, l etude de la Torah se dedie : pour la guerison
        d un proche, a la memoire d une ame, pour une reussite, en
        gratitude. Chaque dedicace deposee ici accompagne l etude de
        toute la maison.
      </p>
      <p style={{ color: 'rgba(245, 239, 224, 0.55)',
        fontSize: '0.85rem', marginBottom: 22 }}>
        Les dedicaces sont visibles par tous les membres.
      </p>

      {!formOuvert && (
        <button
          style={{ ...boutonOr, marginBottom: 24 }}
          onClick={() => setFormOuvert(true)}>
          Deposer une dedicace
        </button>
      )}

      {formOuvert && (
        <div style={{ background: 'rgba(201, 162, 39, 0.08)',
          border: '1px solid rgba(201, 162, 39, 0.35)',
          borderRadius: 14, padding: '16px 18px', marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>
            Ma dedicace
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap',
            marginBottom: 12 }}>
            {TYPES.map((t) => (
              <button key={t.code}
                onClick={() => setType(t.code)}
                style={type === t.code
                  ? { ...boutonOr, padding: '8px 14px',
                      fontSize: '0.85rem' }
                  : { ...bouton, padding: '8px 14px',
                      fontSize: '0.85rem' }}>
                {t.titre}
              </button>
            ))}
          </div>
          <input value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder={libelleType(type) + '... (nom, ou nom hebraique)'}
            style={{ ...champSombre, fontSize: '1rem',
              marginBottom: 10 }} />
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
              <input dir="rtl" value={nomHebreu}
                onChange={(e) => setNomHebreu(e.target.value)}
                placeholder="Nom en hebreu (facultatif)"
                style={{ ...champSombre,
                  fontSize: '1.15rem', flex: 1 }} />
              <button onClick={() => setClavierOuvert(!clavierOuvert)}
                style={{ ...bouton, padding: '0 14px' }}>
                {clavierOuvert ? 'Fermer' : 'אב'}
              </button>
            </div>
            {clavierOuvert && (
              <div dir="rtl" style={{ marginTop: 8,
                display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LETTRES.map((l) => (
                  <button key={l}
                    onClick={() => setNomHebreu(nomHebreu + l)}
                    style={{ ...bouton, padding: '8px 0',
                      width: 36, fontSize: '1.05rem' }}>
                    {l}
                  </button>
                ))}
                <button
                  onClick={() => setNomHebreu(nomHebreu + ' ')}
                  style={{ ...bouton, padding: '8px 0',
                    width: 74, fontSize: '0.8rem' }}>
                  espace
                </button>
                <button
                  onClick={() => setNomHebreu(nomHebreu.slice(0, -1))}
                  style={{ ...bouton, padding: '8px 0',
                    width: 48 }}>
                  ⌫
                </button>
              </div>
            )}
          </div>
          <textarea value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Un mot, si vous le souhaitez (facultatif)"
            rows={2}
            style={{ ...champSombre, fontSize: '0.95rem',
              resize: 'vertical', marginBottom: 12 }} />
          {erreur && (
            <p style={{ color: '#c76b5a', marginBottom: 10 }}>{erreur}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={deposer} disabled={enCours}
              style={{ ...boutonOr, opacity: enCours ? 0.6 : 1 }}>
              {enCours
                ? 'Un instant...'
                : editionId ? 'Enregistrer' : 'Deposer'}
            </button>
            <button onClick={() => { setFormOuvert(false); setErreur(null); setEditionId(null); }}
              style={bouton}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {!dedicaces && (
        <p className="vitrine-texte">Chargement du mur...</p>
      )}

      {dedicaces && dedicaces.length === 0 && (
        <p className="vitrine-texte">
          Le mur attend sa premiere dedicace.
        </p>
      )}

      {dedicaces && dedicaces.map((d) => (
        <div key={d.id}
          style={{ background: 'rgba(245, 239, 224, 0.04)',
            border: '1px solid rgba(201, 162, 39, 0.25)',
            borderRadius: 14, padding: '14px 18px', marginBottom: 10 }}>
          <div style={{ fontSize: '0.78rem', color: '#e3c567',
            marginBottom: 2 }}>
            {libelleType(d.type)}
          </div>
          {d.nom_dedicace !== d.nom_hebreu && (
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {d.nom_dedicace}
            </div>
          )}
          {d.nom_hebreu && (
            <div dir="rtl" style={{ display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, fontSize: '1.3rem', marginTop: 8,
              color: '#f5efe0' }}>
              <Flamme />
              <span>{d.nom_hebreu}</span>
              <Flamme />
            </div>
          )}
          {d.message && d.message.fr && (
            <div style={{ color: 'rgba(245, 239, 224, 0.7)',
              fontSize: '0.92rem', marginTop: 4 }}>
              {d.message.fr}
            </div>
          )}
          <div style={{ display: 'flex',
            justifyContent: 'space-between', marginTop: 8,
            fontSize: '0.75rem', color: 'rgba(245, 239, 224, 0.45)' }}>
            <span>
              {new Date(d.date_debut).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
            {d.utilisateur_id === uid && (
              <span style={{ display: 'flex', gap: 14 }}>
              <button
                onClick={() => {
                  setEditionId(d.id);
                  setType(d.type);
                  setNom(d.nom_dedicace === d.nom_hebreu
                    ? '' : d.nom_dedicace);
                  setNomHebreu(d.nom_hebreu || '');
                  setMessage((d.message && d.message.fr) || '');
                  setFormOuvert(true);
                  setErreur(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ border: 'none', background: 'none',
                  color: '#e3c567', fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline' }}>
                Modifier
              </button>
              <button onClick={() => retirer(d.id)}
                style={{ border: 'none', background: 'none',
                  color: '#c76b5a', fontSize: '0.75rem',
                  cursor: 'pointer', textDecoration: 'underline' }}>
                Retirer ma dedicace
              </button>
              </span>
            )}
          </div>
        </div>
      ))}

      <p style={{ marginTop: 24 }}>
        <a href="/etude" className="bouton-or">
          Retour au Beit Midrash
        </a>
      </p>
    </main>
  );
}

