import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

export const SESSION_COOKIE = "brgy_session";
export const SESSION_MAX_AGE_SEC = 8 * 60 * 60; // 8 hours
const SKEW_SEC = 30;

// Dev fallback so `npm run dev` works out of the box. Always set AUTH_SECRET
// in real deployments. Only the server sees this constant.
const getSecret = (): string =>
  process.env.AUTH_SECRET ?? "barangayconnect-dev-secret-change-me";

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export interface SessionPayload {
  userId: string;
  expiresAt: number;
}

export function createToken(userId: string): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SEC * 1000;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, givenSignature] = parts;
  const payload = `${userId}.${expiresAtRaw}`;
  const expectedSignature = sign(payload);

  const a = Buffer.from(givenSignature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() - SKEW_SEC) return null;

  return { userId, expiresAt };
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Reads the session cookie and returns the authenticated user, or null.
 * Intended for server components / route handlers.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  if (!user || !user.active) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };
}

export function isAuthenticatedToken(token: string | undefined): boolean {
  if (!token) return false;
  return verifyToken(token) !== null;
}