// ============================================================================
// PASSWORD HASHING (local demo auth)
// ============================================================================
// Demo accounts use SHA-256 with a timing-safe comparison. This is a
// prototype-only mechanism so the app runs with zero external services.
// In production, replace with Supabase Auth (which handles hashing and
// sessions server-side). Never store plain-text passwords anywhere.
// ============================================================================

import { createHash, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const a = Buffer.from(hashPassword(password), "hex");
  const b = Buffer.from(storedHash, "hex");
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}