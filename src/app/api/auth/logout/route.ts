import { NextResponse } from "next/server";

import {
  destroySession,
  serializeExpiredSessionCookie,
  SESSION_COOKIE,
  shouldUseSecureCookie,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  destroySession(token ? decodeURIComponent(token) : undefined);

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": serializeExpiredSessionCookie(shouldUseSecureCookie(request)),
      },
    },
  );
}
