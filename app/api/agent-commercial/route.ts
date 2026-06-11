import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, api: "agent-commercial" });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true, api: "agent-commercial" });
}
