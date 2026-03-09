import { NextResponse } from "next/server";

import {
  createSession,
  serializeSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { findUserForLogin } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    identifier?: string;
    password?: string;
  };

  const user = findUserForLogin(body.identifier ?? "");

  if (!user || !verifyPassword(body.password ?? "", user.passwordHash)) {
    return NextResponse.json(
      { error: "We couldn't match those login details." },
      { status: 401 },
    );
  }

  const session = createSession(user.id);
  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": serializeSessionCookie(session.token, session.expiresAt),
      },
    },
  );
}
