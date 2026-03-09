import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { getBootstrapPayload } from "@/lib/server-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();
    return NextResponse.json(getBootstrapPayload(user.id), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
