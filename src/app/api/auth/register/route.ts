import { NextResponse } from "next/server";

import {
  createSession,
  hashPassword,
  serializeSessionCookie,
} from "@/lib/auth";
import { createUser } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      email?: string;
      phone?: string;
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
      username: body.username?.trim() ?? "",
      email: body.email,
      phone: body.phone,
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
      error instanceof Error &&
      /unique|constraint/i.test(error.message)
        ? "That email, phone number, or username is already in use."
        : error instanceof Error
          ? error.message
          : "Unable to create your account right now.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
