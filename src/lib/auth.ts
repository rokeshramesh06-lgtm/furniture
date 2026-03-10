import "server-only";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { deleteSessionByTokenHash, insertSession } from "@/lib/db";

export const SESSION_COOKIE = "atelier_home_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

function normalizeHostName(value: string | null) {
  const host = value?.split(",")[0]?.trim() ?? "";
  const withoutPort = host.replace(/^\[|\]$/g, "").split(":")[0] ?? "";
  return withoutPort.toLowerCase();
}

function isLoopbackHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");

  if (!salt || !key) {
    return false;
  }

  const incoming = scryptSync(password, salt, 64);
  const saved = Buffer.from(key, "hex");

  return saved.length === incoming.length && timingSafeEqual(saved, incoming);
}

function formatCookieDate(value: Date) {
  return value.toUTCString();
}

export function shouldUseSecureCookie(request: Pick<Request, "url" | "headers">) {
  const origin = request.headers.get("origin");

  if (origin) {
    try {
      const originUrl = new URL(origin);

      if (isLoopbackHost(originUrl.hostname)) {
        return false;
      }

      return originUrl.protocol === "https:";
    } catch {
      // Fall through to host/proto checks.
    }
  }

  const forwardedHost = normalizeHostName(request.headers.get("x-forwarded-host"));
  const requestHost = normalizeHostName(request.headers.get("host"));
  const host = forwardedHost || requestHost;

  if (host && isLoopbackHost(host)) {
    return false;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function serializeSessionCookie(token: string, expiresAt: string, secure = false) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Expires=${formatCookieDate(new Date(expiresAt))}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function serializeExpiredSessionCookie(secure = false) {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  insertSession({ userId, tokenHash, expiresAt });

  return {
    token,
    expiresAt,
  };
}

export function destroySession(token?: string) {
  if (token) {
    deleteSessionByTokenHash(hashToken(token));
  }
}
