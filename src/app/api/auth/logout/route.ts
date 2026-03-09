import { NextResponse } from "next/server";

import {
  destroySession,
  serializeExpiredSessionCookie,
  SESSION_COOKIE,
} from "@/lib/auth";

export const runtime = "nodejs";

function readCookieFromHeader(headerValue: string | null, name: string) {
  if (!headerValue) {
    return undefined;
  }

  const prefix = `${name}=`;

  for (const chunk of headerValue.split(";")) {
    const value = chunk.trim();

    if (value.startsWith(prefix)) {
      return decodeURIComponent(value.slice(prefix.length));
    }
  }

  return undefined;
}

export async function POST(request: Request) {
  const token = readCookieFromHeader(request.headers.get("cookie"), SESSION_COOKIE);

  destroySession(token);

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": serializeExpiredSessionCookie(),
      },
    },
  );
}
