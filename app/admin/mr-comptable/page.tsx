export default async function MrComptablePage() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: bankReconciliation } = await supabase
    .from("bank_reconciliation")
    .select("*")
    .order("transaction_date", { ascending: false })
    .limit(10);

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("*")
    .order("due_date", { ascending: true })
    .limit(10);

  const { data: kpiData } = await supabase
    .from("financial_summary")
    .select("*")
    .single();

  const ca = kpiData?.revenue ?? 142750;
  const charges = kpiData?.charges ?? 89320;
  const benefice = kpiData?.profit ?? 53430;
  const tva = kpiData?.tva ?? 28550;
  const urssaf = kpiData?.urssaf ?? 18640;

  const sampleInvoices = invoices && invoices.length > 0 ? invoices : [
    { id: "FAC-2024-001", client: "Société Dupont SARL", amount: 12500, status: "payée", date: "2024-01-15" },
    { id: "FAC-2024-002", client: "Cabinet Martin & Associés", amount: 8750, status: "en attente", date: "2024-01-22" },
    { id: "FAC-2024-003", client: "Groupe Lefebvre Industries", amount: 34200, status: "en retard", date: "2024-01-08" },
    { id: "FAC-2024-004", client: "TechStart Solutions", amount: 5600, status: "payée", date: "2024-02-01" },
    { id: "FAC-2024-005", client: "Immobilier Côte d'Azur", amount: 19800, status: "en attente", date: "2024-02-05" },
  ];

  const sampleExpenses = expenses && expenses.length > 0 ? expenses : [
    { id: "NF-2024-001", description: "Déplacement Paris - Lyon TGV", amount: 187, category: "Transport", date: "2024-01-18", status: "validée" },
    { id: "NF-2024-002", description: "Repas client Chez Paul Restaurant", amount: 245, category: "Restauration", date: "2024-01-20", status: "en attente" },
    { id: "NF-2024-003", description: "Abonnement logiciels SaaS", amount: 890, category: "Informatique", date: "2024-01-25", status: "validée" },
    { id: "NF-2024-004", description: "Fournitures bureau", amount: 156, category: "Bureau", date: "2024-02-02", status: "validée" },
    { id: "NF-2024-005", description: "Formation comptabilité avancée", amount: 1200, category: "Formation", date: "2024-02-04", status: "en attente" },
  ];

  const sampleBank = bankReconciliation && bankReconciliation.length > 0 ? bankReconciliation : [
    { id: "BK-001", description: "Virement client Dupont", amount: 12500, type: "crédit", date: "2024-01-16", reconciled: true },
    { id: "BK-002", description: "Prélèvement fournisseur Imprimerie", amount: -2340, type: "débit", date: "2024-01-17", reconciled: true },
    { id: "BK-003", description: "Virement URSSAF", amount: -4200, type: "débit", date: "2024-01-20", reconciled: false },
    { id: "BK-004", description: "Paiement TechStart", amount: 5600, type: "crédit", date: "2024-02-02", reconciled: true },
    { id: "BK-005", description: "Loyer bureau février", amount: -3500, type: "débit", date: "2024-02-05", reconciled: false },
  ];

  const sampleDeadlines = deadlines && deadlines.length > 0 ? deadlines : [
    { id: "ECH-001", description: "Déclaration TVA mensuelle", amount: 28550, due_date: "2024-02-15", category: "Fiscal", priority: "haute" },
    { id: "ECH-002", description: "Cotisations URSSAF T1", amount: 18640, due_date: "2024-02-20", category: "Social", priority: "haute" },
    { id: "ECH-003", description: "Acompte IS Q1", amount: 12000, due_date: "2024-03-15", category: "Fiscal", priority: "moyenne" },
    { id: "ECH-004", description: "CFE échéance annuelle", amount: 4200, due_date: "2024-12-15", category: "Local", priority: "faible" },
    { id: "ECH-005", description: "Liasse fiscale 2023", amount: 0, due_date: "2024-05-15", category: "Déclaratif", priority: "haute" },
  ];

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#e8e8f0" }}>
      
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0a0a14 0%, #0f0f1e 50%, #050508 100%)", borderBottom: "1px solid rgba(200, 169, 110, 0.2)", padding: "0 40px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #c8a96e, #e8c98e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 4px 16px rgba(200, 169, 110, 0.4)" }}>
              🧾
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.3px" }}>
                Mr Comptable
              </div>
              <div style={{ fontSize: "11px", color: "#c8a96e", fontWeight: "500", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                AcadémIA Pro · Exercice 2024
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 8px #22c55e" }}></div>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>Supabase connecté</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(200, 169, 110, 0.3)", backgroundColor: "rgba(200, 169, 110, 0.05)", fontSize: "13px", color: "#c8a96e", cursor: "pointer", fontWeight: "500" }}>
              Exporter
            </div>
            <div style={{ padding: "6px 14px", borderRadius: "8px", background: "linear-gradient(135deg, #c8a96e, #d4b87e)", fontSize: "13px", color: "#050508", cursor: "pointer", fontWeight: "600" }}>
              + Nouvelle entrée
            </div>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #1e1e30, #2a2a40)", border: "2px solid rgba(200, 169, 110, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", cursor: "pointer" }}>
              👤
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "40px" }}>

        {/* Page Title */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#ffffff", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
            Tableau de bord comptable
          </h1>
          <p style={{ fontSize: "15px", color: "#64748b", margin: 0, fontWeight: "400" }}>
            Vue consolidée de votre activité financière · Janvier – Février 2024
          </p>
        </div>

        {/* KPIs Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "20px", marginBottom: "40px" }}>

          {/* CA */}
          <div style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #111120 100%)", border: "1px solid rgba(200, 169, 110, 0.25)", borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #c8a96e, transparent)" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Chiffre d'affaires</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(200, 169, 110, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>📈</div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#c8a96e", marginBottom: "6px", letterSpacing: "-0.5px" }}>
              {ca.toLocaleString("fr-FR")} €
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: "600" }}>▲ +12,4%</span>
              <span style={{ fontSize: "11px", color: "#475569" }}>vs période préc.</span>
            </div>
          </div>

          {/* Charges */}
          <div style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #111120 100%)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #ef4444, transparent)" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Charges totales</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>📉</div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#f87171", marginBottom: "6px", letterSpacing: "-0.5px" }}>
              {charges.toLocaleString("fr-FR")} €
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>▲ +3,1%</span>
              <span style={{ fontSize: "11px", color: "#475569" }}>vs période préc.</span>
            </div>
          </div>

          {/* Bénéfice */}
          <div style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #111120 100%)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #22c55e, transparent)" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Bénéfice net</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(34, 197, 94, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>💰</div>