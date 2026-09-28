// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LA PAIE DANS L ESPACE MR COMPTABLE
//
// Le meme ecran que /admin/paie, a une adresse que le client peut ouvrir.
//
// POURQUOI UNE SECONDE ADRESSE : tout /admin est reserve a l administrateur
// par le middleware, SAUF /admin/compliance, ouvert a tout compte connecte
// qui porte un organisme. Un cabinet, un collaborateur ou un sous-traitant
// n aurait donc jamais pu ouvrir /admin/paie : il y prenait un « page
// introuvable ». Loger l ecran ici evite de toucher au middleware.
//
// ⚠️ UN SEUL CODE : ce fichier ne fait qu afficher l ecran de
// app/admin/paie/page.tsx. Toute correction se fait la-bas, jamais ici —
// deux copies finiraient par diverger.
// ⚠️ LA PROTECTION N EST PAS DANS L ECRAN : c est la route
// /api/paie/dossier qui verifie la session, l organisme et les droits de
// chaque geste.
// ═══════════════════════════════════════════════════════════════════════
import PagePaie from "../../paie/page";

export default function BulletinsDePaie() {
  return <PagePaie />;
}
