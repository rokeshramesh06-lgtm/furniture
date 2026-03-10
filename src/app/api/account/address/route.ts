import { NextResponse } from "next/server";

import { saveAddress } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import type { Address } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as Address;
    const address = saveAddress(user.id, body);

    return NextResponse.json({ ok: true, address });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save the delivery address.",
      },
      { status: 400 },
    );
  }
}
