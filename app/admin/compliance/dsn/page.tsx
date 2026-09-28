// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LA DSN DANS L ESPACE MR COMPTABLE
//
// Le meme ecran que /admin/dsn, a une adresse que le client peut ouvrir :
// tout /admin est reserve a l administrateur par le middleware, sauf
// /admin/compliance, ouvert a tout compte connecte qui porte un organisme.
// ⚠️ UN SEUL CODE : toute correction se fait dans app/admin/dsn/page.tsx.
// ⚠️ LA PROTECTION N EST PAS DANS L ECRAN : c est la route /api/dsn/dossier
// qui verifie la session, l organisme, les droits et les garde-fous du
// depot.
// ═══════════════════════════════════════════════════════════════════════
import PageDsn from "../../dsn/page";

export default function DsnDuCabinet() {
  return <PageDsn />;
}
