import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@/types";
import { getCurrentUser } from "./session";

/**
 * Server-side guard for dashboard layouts/pages. Redirects to /login when no
 * valid session exists. Enforces that the current user's role is allowed.
 *
 * Usage (page or layout):
 *   const user = await requireUser();
 *   const user = await requireRole(["CAPTAIN", "SECRETARY"]);
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) redirect("/dashboard");
  return user;
}

/**
 * Returns the current user or null without redirecting — for layouts/pages
 * that render differently depending on auth state.
 */
export async function optionalUser() {
  return getCurrentUser();
}