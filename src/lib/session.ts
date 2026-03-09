import "server-only";

import { cookies } from "next/headers";

import { getUserFromSessionTokenHash } from "@/lib/db";
import { hashToken, SESSION_COOKIE } from "@/lib/auth";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return getUserFromSessionTokenHash(hashToken(token));
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
