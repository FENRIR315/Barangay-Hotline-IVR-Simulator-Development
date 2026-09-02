import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeCall } from "@/lib/telephony";

/**
 * POST /api/telephony/dial-status
 * Twilio's <Dial action> hits this when the dialed leg ends.
 * Fields: DialCallStatus (completed | no-answer | busy | failed), CallDuration,
 * CallSid.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const callSid = String(form.get("CallSid") ?? "");
  const status = String(form.get("DialCallStatus") ?? "completed");
  const durationSec = Number(form.get("CallDuration") ?? 0) || null;

  if (!callSid) return new NextResponse(null, { status: 400 });

  const call = await prisma.call.findFirst({
    where: { providerCallId: callSid },
    select: { id: true },
  });
  if (!call) return new NextResponse(null, { status: 404 });

  // Map Twilio DialCallStatus to our CallStatus enum.
  const finalStatus: "CONNECTED" | "COMPLETED" | "MISSED" | "CANCELLED" =
    status === "completed" ? "COMPLETED" :
    status === "no-answer" ? "MISSED" :
    "CANCELLED";

  await finalizeCall(call.id, finalStatus, durationSec);

  return new NextResponse(null, { status: 200 });
}