import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// CE QUE LE DOCUMENT DIT, CETTE PAGE DOIT LE DIRE AUSSI.
//
// Elle annoncait « Certificat Authentique » alors que le document delivre est
// une attestation de fin de formation, et porte lui-meme la mention qu il ne
// constitue ni un titre, ni un diplome, ni une certification enregistree.
// Deux ecrans du meme parcours qui se contredisent, c est l employeur ou le
// financeur qui le remarque en premier.

export default async function VerifierPage({ params }: { params: { numero: string } }) {
  const { data: certif } = await supabase
    .from("certificats_delivres")
    .select("*")
    .eq("certif_id", params.numero)
    .single();

  const estValide = !!certif;

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "60px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 24px" }}>
          VÉRIFICATION D'ATTESTATION / CERTIFICATE OF COMPLETION CHECK
        </p>
        {estValide ? (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.5)", borderRadius: "16px", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h1 style={{ color: "#22c55e", fontSize: "28px", margin: "0 0 6px" }}>Attestation authentique</h1>
            <p style={{ color: "rgba(34,197,94,0.8)", fontSize: "15px", margin: "0 0 16px" }}>Authentic certificate of completion</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", margin: "0 0 8px" }}>Numéro / Number : {params.numero}</p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", margin: "0 0 4px", fontWeight: "bold" }}>{certif.nom}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0 0 4px" }}>{certif.formation_titre}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "0 0 20px" }}>
              Délivrée le / Issued on {new Date(certif.date_obtention).toLocaleDateString("fr-FR")}
            </p>

            {/* Celui qui verifie veut lire le document, pas seulement savoir
                qu il existe : le detail du parcours et la portee y figurent. */}
            <a
              href={"/attestation?certif=" + encodeURIComponent(params.numero)}
              style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 26px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}
            >
              Voir l'attestation
            </a>
          </div>
        ) : (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.5)", borderRadius: "16px", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
            <h1 style={{ color: "#ef4444", fontSize: "28px", margin: "0 0 6px" }}>Attestation non reconnue</h1>
            <p style={{ color: "rgba(239,68,68,0.8)", fontSize: "15px", margin: "0 0 16px" }}>Certificate not recognized</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0" }}>
              Ce numéro ne figure pas dans notre base. / This number is not in our database.
            </p>
          </div>
        )}

        {/* LA PORTEE, MEME ICI. Celui qui verifie est souvent un employeur ou
            un financeur : il doit savoir ce que vaut ce document avant d en
            tirer une conclusion. */}
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "26px auto 0", maxWidth: "520px" }}>
          Ce document atteste du suivi d'une formation et de la réussite de ses évaluations.
          Il ne constitue ni une certification professionnelle, ni un titre, ni un diplôme
          reconnu par un État ou une autorité publique.
        </p>
      </div>
    </div>
  );
}
