"use client";
export default function FactureTemplate({ numero, date, client, formations, total }) {
  return (
    <div style={{ background: "#fff", color: "#000", padding: "60px", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
        <div>
          <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif", fontSize: "28px", margin: 0 }}>AcadémIA Pro LLC</h1>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: "13px" }}>
            30 N Gould St, STE R<br/>
            Sheridan, WY 82801<br/>
            Wyoming — USA<br/>
            contact@academiapro.fr<br/>
            www.academiapro.fr<br/>
            EIN : En cours d'attribution
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: "24px", margin: 0, color: "#333" }}>FACTURE</h2>
          <p style={{ margin: "8px 0 0", color: "#666" }}>N° {numero}<br/>Date : {date}</p>
        </div>
      </div>

      <div style={{ borderTop: "2px solid #c8a96e", borderBottom: "2px solid #c8a96e", padding: "20px 0", marginBottom: "30px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "14px", color: "#666" }}>FACTURER À :</h3>
        <p style={{ margin: 0 }}>{client}</p>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
        <thead>
          <tr style={{ background: "#050508", color: "#c8a96e" }}>
            <th style={{ padding: "12px", textAlign: "left" }}>Formation</th>
            <th style={{ padding: "12px", textAlign: "right" }}>Prix</th>
          </tr>
        </thead>
        <tbody>
          {formations?.map((f, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "12px" }}>{f.titre}</td>
              <td style={{ padding: "12px", textAlign: "right" }}>{f.prix}€</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: "right", borderTop: "2px solid #050508", paddingTop: "16px" }}>
        <p style={{ fontSize: "20px", fontWeight: "bold" }}>Total : {total}€</p>
        <p style={{ fontSize: "12px", color: "#666" }}>TVA non applicable — Société américaine (LLC Wyoming)</p>
      </div>

      <div style={{ marginTop: "60px", paddingTop: "20px", borderTop: "1px solid #eee", fontSize: "11px", color: "#999", textAlign: "center" }}>
        AcadémIA Pro LLC — 30 N Gould St STE R, Sheridan WY 82801 USA — contact@academiapro.fr
      </div>
    </div>
  );
}
