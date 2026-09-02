import { prisma } from "@/lib/prisma";
import type { IvrContext } from "@/types/ivr";

/**
 * Convert a Philippine mobile/local number to E.164 for Twilio <Dial>.
 *   "0917-123-4567" -> "+639171234567"
 *   "+639171234567" -> unchanged
 * Returns null when the number can't be interpreted.
 */
export function toE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+63${digits.slice(1)}`;
  if (digits.startsWith("63") && digits.length >= 12) return `+${digits}`;
  return null;
}

/**
 * Pick the official to route an incoming call to.
 *  - Emergencies prefer the emergency officer (highest priority, available).
 *  - "Speak to an official" picks the highest-priority available official.
 * Returns the official plus a resolved E.164 phone for dialing.
 */
export async function findTargetOfficial(context: IvrContext) {
  const emergencyType = context.selectedEmergency as string | undefined;

  let official = null;
  if (emergencyType) {
    official = await prisma.official.findFirst({
      where: {
        active: true,
        status: "AVAILABLE",
        OR: [{ department: "Emergency" }, { position: "Emergency Officer" }],
      },
      orderBy: { priority: "desc" },
    });
  }

  if (!official) {
    official = await prisma.official.findFirst({
      where: { active: true, status: "AVAILABLE" },
      orderBy: { priority: "desc" },
    });
  }

  if (!official) return null;
  return { official, phoneE164: toE164(official.phone) };
}

/**
 * Finalize a call after the transfer/record leg ends.
 * `status` is the final call status; `durationSec` comes from Twilio.
 */
export async function finalizeCall(
  callId: string,
  status: "CONNECTED" | "COMPLETED" | "MISSED" | "CANCELLED",
  durationSec?: number | null
) {
  return prisma.call.update({
    where: { id: callId },
    data: {
      status,
      ...(durationSec != null ? { durationSec: Math.max(0, Math.round(durationSec)) } : {}),
      endedAt: new Date(),
      answeredAt: status === "CONNECTED" || status === "COMPLETED" ? new Date() : undefined,
    },
  });
}