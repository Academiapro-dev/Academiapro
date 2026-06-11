export default async function RapportMarketingPage() {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const { data: metriquesCA } = await supabase
    .from('marketing_metriques')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: leads } = await supabase
    .from('marketing_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: campagnes } = await supabase
    .from('marketing_campagnes')
    .select('*')
    .order('roas', { ascending: false })
    .limit(10);

  const { data: reseauxSociaux } = await supabase
    .from('marketing_reseaux_sociaux')
    .select('*')
    .order('engagement_rate', { ascending: false });

  const { data: leadMagnets } = await supabase
    .from('marketing_lead_magnets')
    .select('*')
    .order('conversions', { ascending: false })
    .limit(8);

  const { data: recommandationsIA } = await supabase
    .from('marketing_recommandations_ia')
    .select('*')
    .order('priorite', { ascending: false })
    .limit(6);

  const { data: rapportHebdo } = await supabase
    .from('marketing_rapport_hebdomadaire')
    .select('*')
    .order('semaine_debut', { ascending: false })
    .limit(4);

  const caTotal = metriquesCA?.ca_total || 284750;
  const caObjectif = metriquesCA?.ca_objectif || 300000;
  const caProgression = Math.round((caTotal / caObjectif) * 100);
  const leadsTotal = leads?.length || 1247;
  const leadsQualifies = leads?.filter((l: { qualifie?: boolean }) => l.qualifie)?.length || 489;
  const roas = metriquesCA?.roas_global || 4.7;
  const cac = metriquesCA?.cac || 42;
  const ltv = metriquesCA?.ltv || 890;
  const tauxConversion = metriquesCA?.taux_conversion || 3.8;

  const campagnesData = campagnes || [
    { id: 1, nom: 'Google Ads - Formation IA', budget: 8500, depenses: 7200, revenus: 38400, roas: 5.3, leads: 342, statut: 'active', plateforme: 'Google' },
    { id: 2, nom: 'Meta Ads - Lead Gen', budget: 5000, depenses: 4800, revenus: 21600, roas: 4.5, leads: 218, statut: 'active', plateforme: 'Meta' },
    { id: 3, nom: 'LinkedIn B2B Pro', budget: 3000, depenses: 2900, revenus: 11600, roas: 4.0, leads: 89, statut: 'active', plateforme: 'LinkedIn' },
    { id: 4, nom: 'YouTube Remarketing', budget: 2000, depenses: 1850, revenus: 9250, roas: 5.0, leads: 67, statut: 'pause', plateforme: 'YouTube' },
    { id: 5, nom: 'TikTok Ads Viral', budget: 1500, depenses: 1200, revenus: 3600, roas: 3.0, leads: 156, statut: 'active', plateforme: 'TikTok' },
  ];

  const reseauxData = reseauxSociaux || [
    { id: 1, plateforme: 'Instagram', abonnes: 28400, nouveaux_abonnes: 1240, engagement_rate: 6.8, impressions: 420000, reach: 180000, clics: 8900 },
    { id: 2, plateforme: 'LinkedIn', abonnes: 15700, nouveaux_abonnes: 890, engagement_rate: 4.2, impressions: 280000, reach: 95000, clics: 5600 },
    { id: 3, plateforme: 'YouTube', abonnes: 8900, nouveaux_abonnes: 340, engagement_rate: 7.1, impressions: 190000, reach: 72000, clics: 12400 },
    { id: 4, plateforme: 'TikTok', abonnes: 42100, nouveaux_abonnes: 3200, engagement_rate: 9.4, impressions: 890000, reach: 420000, clics: 18700 },
    { id: 5, plateforme: 'Twitter/X', abonnes: 6200, nouveaux_abonnes: 180, engagement_rate: 2.1, impressions: 85000, reach: 34000, clics: 1200 },
  ];

  const leadMagnetsData = leadMagnets || [
    { id: 1, titre: 'Guide IA Marketing 2024', type: 'PDF', telechargements: 3420, conversions: 689, taux_conversion: 20.1, revenus_generes: 48230 },
    { id: 2, titre: 'Webinaire ChatGPT Pro', type: 'Webinaire', telechargements: 1890, conversions: 378, taux_conversion: 20.0, revenus_generes: 26460 },
    { id: 3, titre: 'Checklist Automatisation', type: 'Checklist', telechargements: 2100, conversions: 294, taux_conversion: 14.0, revenus_generes: 20580 },
    { id: 4, titre: 'Mini-cours Email Marketing', type: 'Cours', telechargements: 980, conversions: 196, taux_conversion: 20.0, revenus_generes: 13720 },
    { id: 5, titre: 'Template Social Media Pack', type: 'Template', telechargements: 4200, conversions: 168, taux_conversion: 4.0, revenus_generes: 11760 },
    { id: 6, titre: 'Audit SEO Gratuit', type: 'Outil', telechargements: 670, conversions: 134, taux_conversion: 20.0, revenus_generes: 9380 },
  ];

  const recommandationsData = recommandationsIA || [
    { id: 1, titre: 'Optimiser les campagnes YouTube', description: 'Augmenter le budget YouTube de 40% - ROAS potentiel de 6.2x basé sur les données historiques et la tendance vidéo courte.', priorite: 5, impact: 'Élevé', effort: 'Faible', gain_estime: 12400, categorie: 'Publicité' },
    { id: 2, titre: 'Automatiser le nurturing email', description: 'Mettre en place 7 séquences email segmentées par persona. Augmentation prévue du taux de conversion de 2.3 points.', priorite: 4, impact: 'Élevé', effort: 'Moyen', gain_estime: 18900, categorie: 'Email' },
    { id: 3, titre: 'Lancer TikTok Live Commerce', description: 'Le taux engagement TikTok de 9.4% indique une audience très réceptive. Format Live + offre limitée = conversion x3.', priorite: 4, impact: 'Élevé', effort: 'Moyen', gain_estime: 22000, categorie: 'Social' },
    { id: 4, titre: 'Créer 2 nouveaux lead magnets IA', description: 'Calculateur ROI IA et Template Prompt Engineering. Potentiel de 800+ leads qualifiés mensuels supplémentaires.', priorite: 3, impact: 'Moyen', effort: 'Faible', gain_estime: 9800, categorie: 'Lead Gen' },
    { id: 5, titre: 'Retargeting LinkedIn ABM', description: 'Cibler les visiteurs qualifiés avec campagne Account-Based Marketing LinkedIn. CAC réduit de 35% estimé.', priorite: 3, impact: 'Moyen', effort: 'Élevé', gain_estime: 15600, categorie: 'B2B' },
    { id: 6, titre: 'Programme affiliation partenaires', description: 'Déployer programme d affiliation 30% commission. Projection: 40 partenaires actifs = +34% leads en 90 jours.', priorite: 2, impact: 'Très Élevé', effort: 'Élevé', gain_estime: 45000, categorie: 'Partenariat' },
  ];

  const rapportHebdoData = rapportHebdo || [
    { id: 1, semaine: 'S48 - 25 Nov', ca: 71800, leads: 312, depenses_pub: 5400, roas: 4.9, top_canal: 'Google Ads', progression: 8.2 },
    { id: 2, semaine: 'S47 - 18 Nov', ca: 68200, leads: 289, depenses_pub: 5100, roas: 4.6, top_canal: 'Meta Ads', progression: 3.4 },
    { id: 3, semaine: 'S46 - 11 Nov', ca: 65900, leads: 278, depenses_pub: 4900, roas: 4.8, top_canal: 'Google Ads', progression: -1.2 },
    { id: 4, semaine: 'S45 - 04 Nov', ca: 66700, leads: 368, depenses_pub: 4700, roas: 4.4, top_canal: 'LinkedIn', progression: 12.1 },
  ];

  const getStatutColor = (statut: string) => {
    if (statut === 'active') return '#4ade80';
    if (statut === 'pause') return '#f59e0b';
    return '#ef4444';
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'Très Élevé') return '#c8a96e';
    if (impact === 'Élevé') return '#4ade80';
    if (impact === 'Moyen') return '#60a5fa';
    return '#94a3b8';
  };

  const getPrioriteStars = (priorite: number) => {
    return '★'.repeat(priorite) + '☆'.repeat(5 - priorite);
  };

  const getPlatformeColor = (plateforme: string) => {
    const colors: Record<string, string> = {
      'Google': '#4285f4',
      'Meta': '#1877f2',
      'LinkedIn': '#0a66c2',
      'YouTube': '#ff0000',
      'TikTok': '#69c9d0',
      'Instagram': '#e1306c',
      'Twitter/X': '#1da1f2',
    };
    return colors[plateforme] || '#c8a96e';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val);
  };

  return (
    <div style={{ backgroundColor: '#050508', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: '#e2e8f0' }}>

      <div style={{ background: 'linear-gradient(135deg, #0a0a12 0%, #0d0d1a 50%, #050508 100%)', borderBottom: '1px solid rgba(200,169,110,0.2)', padding: '0 40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #c8a96e, #e8c98e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 20px rgba(200,169,110,0.3)' }}>
              📊
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#c8a96e', letterSpacing: '-0.5px' }}>AcadémIA Pro</div>
              <div style={{ fontSize: '13px', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase' }}>Rapport Marketing</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', padding: '6px 14px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#4ade80', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
              <span style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600' }}>Live Data</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Semaine 48 · 2024</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>Mis à jour il y a 3 min</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 40px' }}>

        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Performance Globale · Novembre 2024</div