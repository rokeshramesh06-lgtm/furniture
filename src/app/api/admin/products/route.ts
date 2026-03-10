import { NextResponse } from "next/server";

import { createProduct, updateProduct } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import type { ProductInput } from "@/lib/types";

export const runtime = "nodejs";

async function requireAdmin() {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    throw new Error("Admin access is required.");
  }

  return user;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as ProductInput;
    const product = createProduct(body);

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save the product.",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as ProductInput & { id?: number };

    if (!body.id) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const product = updateProduct(body.id, body);

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update the product.",
      },
      { status: 400 },
    );
  }
}
