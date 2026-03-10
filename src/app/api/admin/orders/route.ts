import { NextResponse } from "next/server";

import { updateOrderStatus } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import type { OrderStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const user = await requireSessionUser();

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
    }

    const body = (await request.json()) as {
      orderId?: number;
      status?: OrderStatus;
    };

    if (!body.orderId || !body.status) {
      return NextResponse.json(
        { error: "Order id and status are required." },
        { status: 400 },
      );
    }

    const order = updateOrderStatus(body.orderId, body.status);

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update the order.",
      },
      { status: 400 },
    );
  }
}
