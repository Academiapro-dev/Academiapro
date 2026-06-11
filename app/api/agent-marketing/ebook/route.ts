import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, api: "ebook" });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true, api: "ebook" });
}
