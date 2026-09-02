import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { welcomeTwiML } from "@/lib/ivr/bridge";
import { MENU } from "@/lib/ivr/menu";

/**
 * POST /api/telephony/incoming
 * Twilio calls this when a call is answered.  We acknowledge immediately
 * with a 200 + TwiML so Twilio streams audio to the caller.
 *
 * Twilio sends form-encoded fields: CallSid, From, To, Direction, etc.
 * Our IVR is stateless per request — each step replays the menu.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const callSid = String(form.get("CallSid") ?? "unknown");
  const from = String(form.get("From") ?? "unknown");

  // Persist the call record (ignore duplicates on re-delivery).
  try {
    const existing = await prisma.call.findFirst({
      where: { providerCallId: callSid },
      select: { id: true },
    });
    if (!existing) {
      await prisma.call.create({
        data: {
          providerCallId: callSid,
          callerPhone: from,
          source: "TELEPHONY",
          callType: "INFORMATION",
          status: "IN_IVR",
          priority: "NORMAL",
          ivrState: "MAIN_MENU",
          ivrContext: JSON.stringify({}),
        },
      });
    }
  } catch (e) {
    console.error("Telephony incoming — DB error:", e);
  }

  // Welcome read + main menu gather.
  const twiml = welcomeTwiML(MENU.WELCOME, `${MENU.MAIN_MENU} ${MENU.MAIN_MENU_OPTIONS.text}`);
  return new NextResponse(twiml.xml, {
    headers: { "Content-Type": "text/xml" },
  });
}