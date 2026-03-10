import { NextResponse } from "next/server";

import {
  createSession,
  serializeSessionCookie,
  shouldUseSecureCookie,
  verifyPassword,
} from "@/lib/auth";
import { findUserForLogin } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const user = findUserForLogin(body.email ?? "");

    if (!user || !verifyPassword(body.password ?? "", user.passwordHash)) {
      return NextResponse.json({
        ok: false,
        error: "We couldn't match that email and password.",
      });
    }

    const session = createSession(user.id);

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": serializeSessionCookie(
            session.token,
            session.expiresAt,
            shouldUseSecureCookie(request),
          ),
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to sign you in right now.",
      },
      { status: 500 },
    );
  }
}
