import { NextResponse } from "next/server";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Renvoie l organisme de la session. Les pages ne doivent JAMAIS porter un
// identifiant de tenant ecrit en dur : un client verrait les donnees d un autre.
export async function GET() {
  const session = sessionCourante();

  if (!session || !session.tenantId) {
    return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    tenant_id: session.tenantId,
    email: session.email,
    role: session.role || null,
  });
}
