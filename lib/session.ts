import crypto from "crypto";
import { cookies } from "next/headers";

export const NOM_COOKIE_SESSION = "session_academia";
const DUREE_JOURS = 30;
export const DUREE_COOKIE_SECONDES = DUREE_JOURS * 24 * 60 * 60;

function secret(): string {
  return process.env.SESSION_SECRET || "";
}

function signer(corps: string): string {
  return crypto.createHmac("sha256", secret()).update(corps).digest("base64url");
}

export function fabriquerJetonSession(email: string): string {
  const charge = JSON.stringify({
    email: String(email || "").toLowerCase().trim(),
    exp: Date.now() + DUREE_JOURS * 24 * 60 * 60 * 1000,
  });
  const corps = Buffer.from(charge, "utf8").toString("base64url");
  return corps + "." + signer(corps);
}

export function lireJetonSession(jeton: string | undefined | null): string | null {
  if (!jeton) return null;
  if (!secret()) return null;
  const morceaux = String(jeton).split(".");
  if (morceaux.length !== 2) return null;
  const corps = morceaux[0];
  const signature = morceaux[1];
  const attendue = signer(corps);
  const a = Buffer.from(signature);
  const b = Buffer.from(attendue);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  try {
    const charge = JSON.parse(Buffer.from(corps, "base64url").toString("utf8"));
    if (!charge || !charge.email) return null;
    if (typeof charge.exp !== "number") return null;
    if (Date.now() > charge.exp) return null;
    return String(charge.email).toLowerCase().trim();
  } catch (e) {
    return null;
  }
}

export function emailDeSession(): string | null {
  try {
    const jeton = cookies().get(NOM_COOKIE_SESSION)?.value;
    return lireJetonSession(jeton);
  } catch (e) {
    return null;
  }
}
