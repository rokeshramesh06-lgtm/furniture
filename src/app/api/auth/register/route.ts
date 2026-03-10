import { NextResponse } from "next/server";

import { createSession, hashPassword, serializeSessionCookie } from "@/lib/auth";
import { createUser } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const password = body.password?.trim() ?? "";

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Use at least 8 characters for your password." },
        { status: 400 },
      );
    }

    const user = createUser({
      name: body.name?.trim() ?? "",
      email: body.email?.trim() ?? "",
      passwordHash: hashPassword(password),
    });

    const session = createSession(user.id);

    return NextResponse.json(
      { ok: true, user },
      {
        headers: {
          "Set-Cookie": serializeSessionCookie(session.token, session.expiresAt),
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error && /unique|constraint/i.test(error.message)
        ? "That email address is already registered."
        : error instanceof Error
          ? error.message
          : "Unable to create your account right now.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
