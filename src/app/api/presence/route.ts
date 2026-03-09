import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/session";
import { touchPresence } from "@/lib/db";
import { emitRealtimeEvent } from "@/lib/realtime";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireSessionUser();
    touchPresence(user.id);
    emitRealtimeEvent({
      kind: "presence",
      broadcast: true,
      userId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
