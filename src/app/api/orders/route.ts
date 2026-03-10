import { NextResponse } from "next/server";

import { createOrder } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import type { Address, OrderLineInput, PaymentMethod } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as {
      paymentMethod?: PaymentMethod;
      address?: Address;
      lines?: OrderLineInput[];
    };

    const order = createOrder({
      userId: user.id,
      paymentMethod: body.paymentMethod ?? "UPI",
      address: body.address ?? {
        fullName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      },
      lines: body.lines ?? [],
    });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "We couldn't place the order.",
      },
      { status: 400 },
    );
  }
}
