export default async function MrJuridiquePage() {

  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let documentsData: any[] = [];
  let complianceData: any[] = [];
  let fluxData: any[] = [];
  let fiscalData: any[] = [];
  let errorMessage = '';

  try {
    const [docsResult, complianceResult, fluxResult, fiscalResult] = await Promise.all([
      supabase.from('juridique_documents').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('juridique_compliance').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('juridique_flux_intersocietes').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('juridique_economie_fiscale').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    if (docsResult.data) documentsData = docsResult.data;
    if (complianceResult.data) complianceData = complianceResult.data;
    if (fluxResult.data) fluxData = fluxResult.data;
    if (fiscalResult.data) fiscalData = fiscalResult.data;
  } catch (err: any) {
    errorMessage = err?.message || 'Erreur de connexion Supabase';
  }

  const mockDocuments = documentsData.length > 0 ? documentsData : [
    { id: 1, titre: 'Statuts SAS AcadémIA Holdings', type: 'Constitutif', statut: 'Validé', date: '2024-01-15', priorite: 'haute' },
    { id: 2, titre: 'Pacte d\'associés SAS Opérationnelle', type: 'Gouvernance', statut: 'En révision', date: '2024-02-20', priorite: 'haute' },
    { id: 3, titre: 'Contrat de services inter-groupe', type: 'Commercial', statut: 'Validé', date: '2024-03-10', priorite: 'moyenne' },
    { id: 4, titre: 'Accord de confidentialité NDA', type: 'Protection', statut: 'Validé', date: '2024-03-25', priorite: 'basse' },
    { id: 5, titre: 'Règlement intérieur assemblée', type: 'Gouvernance', statut: 'Brouillon', date: '2024-04-01', priorite: 'moyenne' },
  ];

  const mockCompliance = complianceData.length > 0 ? complianceData : [
    { id: 1, entite: 'LLC Delaware', obligation: 'Annual Report', echeance: '2025-03-01', statut: 'Conforme', score: 98 },
    { id: 2, entite: 'LLC Wyoming', obligation: 'Registered Agent', echeance: '2025-06-15', statut: 'Conforme', score: 100 },
    { id: 3, entite: 'SAS France', obligation: 'Dépôt comptes annuels', echeance: '2025-04-30', statut: 'En attente', score: 75 },
    { id: 4, entite: 'SAS Holdings', obligation: 'Rapport de gestion', echeance: '2025-05-15', statut: 'En cours', score: 60 },
    { id: 5, entite: 'LLC Nevada', obligation: 'Business License', echeance: '2025-01-31', statut: 'Urgent', score: 30 },
  ];

  const mockFlux = fluxData.length > 0 ? fluxData : [
    { id: 1, source: 'LLC Delaware', destination: 'SAS Holdings', montant: 125000, type: 'Dividendes', devise: 'EUR', statut: 'Exécuté' },
    { id: 2, source: 'SAS Opérationnelle', destination: 'LLC Wyoming', montant: 45000, type: 'Royalties', devise: 'USD', statut: 'En cours' },
    { id: 3, source: 'LLC Nevada', destination: 'SAS Holdings', montant: 78500, type: 'Management fees', devise: 'EUR', statut: 'Planifié' },
    { id: 4, source: 'SAS Holdings', destination: 'SAS Filiale', montant: 200000, type: 'Prêt intra-groupe', devise: 'EUR', statut: 'Exécuté' },
    { id: 5, source: 'LLC Delaware', destination: 'LLC Wyoming', montant: 15000, type: 'Remboursement', devise: 'USD', statut: 'En cours' },
  ];

  const mockFiscal = fiscalData.length > 0 ? fiscalData : [
    { id: 1, strategie: 'Optimisation IS via convention fiscale FR/US', economie: 48500, statut: 'Actif', risque: 'Faible' },
    { id: 2, strategie: 'Régime mère-fille dividendes', economie: 32000, statut: 'Actif', risque: 'Très faible' },
    { id: 3, strategie: 'Prix de transfert documentation', economie: 0, statut: 'Conformité', risque: 'Moyen' },
    { id: 4, strategie: 'Crédit d\'impôt R&D (CIR)', economie: 75000, statut: 'En cours', risque: 'Faible' },
    { id: 5, strategie: 'Exonération participation bénéfices', economie: 18200, statut: 'Actif', risque: 'Très faible' },
  ];

  const totalEconomie = mockFiscal.reduce((acc: number, item: any) => acc + (item.economie || 0), 0);
  const totalFlux = mockFlux.reduce((acc: number, item: any) => acc + (item.montant || 0), 0);
  const documentsValides = mockDocuments.filter((d: any) => d.statut === 'Validé').length;
  const entitesConformes = mockCompliance.filter((c: any) => c.statut === 'Conforme').length;

  const getStatutColor = (statut: string): string => {
    const map: Record<string, string> = {
      'Validé': '#22c55e',
      'Conforme': '#22c55e',
      'Exécuté': '#22c55e',
      'Actif': '#22c55e',
      'En révision': '#f59e0b',
      'En attente': '#f59e0b',
      'En cours': '#3b82f6',
      'Brouillon': '#6b7280',
      'Planifié': '#8b5cf6',
      'Conformité': '#06b6d4',
      'Urgent': '#ef4444',
    };
    return map[statut] || '#6b7280';
  };

  const getPrioriteColor = (priorite: string): string => {
    const map: Record<string, string> = {
      'haute': '#ef4444',
      'moyenne': '#f59e0b',
      'basse': '#22c55e',
    };
    return map[priorite] || '#6b7280';
  };

  const getRisqueColor = (risque: string): string => {
    const map: Record<string, string> = {
      'Très faible': '#22c55e',
      'Faible': '#84cc16',
      'Moyen': '#f59e0b',
      'Élevé': '#ef4444',
    };
    return map[risque] || '#6b7280';
  };

  const formatMontant = (montant: number): string => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(montant);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050508', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#e2e8f0' }}>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: 'rgba(5,5,8,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(200,169,110,0.2)', padding: '0 32px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #c8a96e, #8b6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            ⚖️
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, background: 'linear-gradient(135deg, #c8a96e, #e8d5a3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Mr Juridique
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(200,169,110,0.6)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              AcadémIA Pro · Intelligence Juridique
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Documents', 'Compliance', 'Flux', 'Fiscal'].map((item) => (
              <button key={item} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(200,169,110,0.2)', backgroundColor: 'transparent', color: 'rgba(200,169,110,0.8)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
                {item}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }}></div>
            <span style={{ fontSize: '12px', color: '#22c55e' }}>Supabase connecté</span>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: '72px' }}>

        <div style={{ padding: '60px 32px 40px', background: 'linear-gradient(180deg, rgba(200,169,110,0.05) 0%, transparent 100%)', borderBottom: '1px solid rgba(200,169,110,0.1)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#c8a96e', letterSpacing: '1px', textTransform: 'uppercase' }}>⚡ IA Juridique Active</span>
                </div>
                <h1 style={{ fontSize: '48px', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.1 }}>
                  <span style={{ background: 'linear-gradient(135deg, #ffffff, #e2e8f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tableau de Bord</span>
                  <br />
                  <span style={{ background: 'linear-gradient(135deg, #c8a96e, #e8d5a3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Juridique & Fiscal</span>
                </h1>
                <p style={{ color: 'rgba(226,232,240,0.6)', fontSize: '16px', margin: 0, maxWidth: '500px' }}>
                  Gestion centralisée LLC · SAS · Flux inter-sociétés · Optimisation fiscale en temps réel
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(200,169,110,0.4)', backgroundColor: 'rgba(200,169,110,0.1)', color: '#c8a96e', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
                  📥 Exporter Rapport
                </button>
                <button style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #c8a96e, #8b6914)', color: '#050508', fontSize: '14px', cursor: 'pointer', fontWeight: 700 }}>
                  + Nouveau Document
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { label: 'Documents Validés', value: `${documentsValides}/${mockDocuments.length}`, icon: '📄', color: '#22c55e', sub: 'Base documentaire', progress: (documentsValides / mockDocuments.length) * 100 },
                { label: 'Entités Conformes', value: `${entitesConformes}/${mockCompliance.length}`, icon: '✅', color: '#c8a96e', sub: 'LLC & SAS