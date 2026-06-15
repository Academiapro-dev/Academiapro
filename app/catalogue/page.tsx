import { Metadata } from "next";

export const metadata: Metadata = {
 title: "Catalogue — AcadémIA Pro",
 description: "238 formations professionnelles",
};

async function getFormations() {
 const res = await fetch(
   `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/formations?select=*&order=code`,
   {
     headers: {
       apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
       Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
     },
     cache: "no-store",
   }
 );
 if (!res.ok) return [];
 return res.json();
}

export default async function CataloguePage() {
 const formations = await getFormations();

 return (
   <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
     <h1 style={{ color: "#c8a96e", fontFamily: "Georgia, serif", textAlign: "center", marginBottom: "10px" }}>
       Catalogue AcadémIA Pro
     </h1>
     <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", marginBottom: "40px" }}>
       {formations.length} formations disponibles
     </p>
     <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
       {formations.map((f: any) => (
         <a
           key={f.code}
           href={`/formation/${f.code}`}
           style={{
             display: "block",
             background: "rgba(255,255,255,0.05)",
             border: "1px solid rgba(200,169,110,0.3)",
             borderRadius: "10px",
             padding: "20px",
             textDecoration: "none",
             color: "#fff",
           }}
         >
           <div style={{ color: "#c8a96e", fontSize: "12px", marginBottom: "8px" }}>{f.code}</div>
           <div style={{ fontFamily: "Georgia, serif", fontSize: "15px", fontWeight: "bold" }}>
             {f.titre}
           </div>
           {f.tarif_euros && (
             <div style={{ color: "#c8a96e", marginTop: "10px", fontSize: "14px" }}>
               {f.tarif_euros}
             </div>
           )}
         </a>
       ))}
     </div>
   </div>
 );
}
