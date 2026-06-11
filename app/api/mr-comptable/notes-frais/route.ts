import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, api: "notes-frais" });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true, api: "notes-frais" });
}
