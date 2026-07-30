import { NextResponse } from "next/server";
import { sessionCourante } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = sessionCourante();
  return NextResponse.json({
    connecte: session !== null,
    email: session ? session.email : null,
    tenant_id: session ? session.tenantId : null,
    role: session ? session.role : null,
  });
}
