import { NextRequest, NextResponse } from "next/server";
import { readUsage } from "@/lib/usage-store";

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");
  if (!cid) {
    return NextResponse.json({ error: "cid is required" }, { status: 400 });
  }
  const { usesLeft, isSubscriber } = await readUsage(cid);
  return NextResponse.json({
    isSubscriber,
    usesLeft,
    canUse: isSubscriber || usesLeft > 0,
  });
}
