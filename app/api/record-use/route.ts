import { NextRequest, NextResponse } from "next/server";
import { decrementUsage } from "@/lib/usage-store";

export async function POST(req: NextRequest) {
  const { cid } = await req.json();
  if (!cid) {
    return NextResponse.json({ error: "cid is required" }, { status: 400 });
  }
  const { usesLeft } = await decrementUsage(cid);
  return NextResponse.json({ ok: true, usesLeft });
}
