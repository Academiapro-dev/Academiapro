import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kpxrbwsbhmggoajtxzqn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  const trimestre = req.nextUrl.searchParams.get("trimestre") || "";
  if (!trimestre) return NextResponse.json({ error: "trimestre requis" }, { status: 400 });

  const SB = { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY };

  // 1) Recuperer les factures du trimestre
  const rf = await fetch(SUPABASE_URL + "/rest/v1/factures?trimestre=eq." + trimestre + "&select=*&order=numero", { headers: SB });
  const factures = await rf.json();
  if (!Array.isArray(factures) || factures.length === 0) {
    return NextResponse.json({ error: "aucune facture" }, { status: 404 });
  }

  const zip = new JSZip();

  // 2) Ajouter un CSV recap
  const entete = "Numero;Date;Client;Pays;Type;HT;TauxTVA;TVA;TTC;Paiement;Nature";
  const lignes = factures.map((f: any) => [
    f.numero, f.date_emission, '"'+(f.client_nom||"")+'"', f.client_pays, f.type_client,
    Number(f.montant_ht).toFixed(2), f.taux_tva, Number(f.montant_tva).toFixed(2),
    Number(f.montant_ttc).toFixed(2), f.statut_paiement||"", f.est_avoir?"AVOIR":"FACTURE"
  ].join(";"));
  const csv = "\ufeff" + entete + "\n" + lignes.join("\n");
  zip.file("recapitulatif_" + trimestre + ".csv", csv);

  // 3) Telecharger chaque PDF et l'ajouter au zip
  for (const f of factures) {
    if (!f.pdf_url) continue;
    try {
      const rp = await fetch(SUPABASE_URL + "/storage/v1/object/documents-comptables/" + f.pdf_url, { headers: SB });
      if (rp.ok) {
        const buf = await rp.arrayBuffer();
        zip.file(f.numero + ".pdf", buf);
      }
    } catch (e) { /* ignore ce pdf */ }
  }

  // 4) Generer le zip
  const contenuZip = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(contenuZip as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="export_' + trimestre + '.zip"',
    },
  });
}
