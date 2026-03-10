import "server-only";

import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "atelier_home_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_VERSION = 1;

type SessionPayload = {
  v: number;
  exp: number;
  user: SessionUser;
};

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

function getSessionSecret() {
  return process.env.SESSION_SECRET?.trim() || "atelier-furniture-demo-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signSessionPayload(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
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

export function getSessionCookieOptions(request: Pick<Request, "url" | "headers">) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookie(request),
    path: "/",
  };
}

export function createSession(user: SessionUser) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
  const payload: SessionPayload = {
    v: SESSION_VERSION,
    exp: Date.parse(expiresAt),
    user: sessionUser,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signSessionPayload(encodedPayload);
  const token = `${encodedPayload}.${signature}`;

  return {
    token,
    expiresAt,
  };
}

export function readSession(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signSessionPayload(encodedPayload);

  if (expectedSignature.length !== signature.length) {
    return null;
  }

  const incoming = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (!timingSafeEqual(expected, incoming)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    if (payload.v !== SESSION_VERSION || payload.exp <= Date.now()) {
      return null;
    }

    const user = payload.user;

    if (
      !user
      || typeof user.id !== "number"
      || typeof user.name !== "string"
      || typeof user.email !== "string"
      || (user.role !== "admin" && user.role !== "customer")
      || typeof user.createdAt !== "string"
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function destroySession() {}
