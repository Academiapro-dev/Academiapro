// Limiteur de debit en memoire, par IP
const compteurs = new Map<string, { n: number; depuis: number }>();

export function limiter(ip: string, cle: string, max: number, fenetreMs: number): boolean {
  const k = cle + ":" + ip;
  const maintenant = Date.now();
  const c = compteurs.get(k);
  if (!c || maintenant - c.depuis > fenetreMs) {
    compteurs.set(k, { n: 1, depuis: maintenant });
    return true;
  }
  c.n += 1;
  if (c.n > max) return false;
  return true;
}

export function ipDe(req: { headers: { get(n: string): string | null } }): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  return xf.split(",")[0].trim() || "inconnue";
}
