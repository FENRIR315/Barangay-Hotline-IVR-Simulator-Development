import { NextResponse } from "next/server";
import { SESSION_COOKIE, getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/services/audit";

export async function POST() {
  const user = await getCurrentUser();
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  await logAudit({
    userId: user?.id,
    action: "LOGOUT",
    detail: "User signed out",
  });
  return response;
}