import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionToTwiML } from "@/lib/ivr/bridge";
import { stepIvr } from "@/lib/ivr/engine";
import { findTargetOfficial } from "@/lib/telephony";
import type { DtmfDigit, IvrStateName } from "@/types/ivr";
import { logAudit } from "@/services/audit";

/**
 * POST /api/telephony/handle
 * Twilio's <Gather action> hits this endpoint whenever the caller presses a
 * DTMF key.  We decode the existing session from the Call row, step the
 * engine, persist the new state, and return TwiML for the next action.
 *
 * Form fields from Twilio: CallSid, Digits, digits (lowercase), To, From, etc.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const callSid = String(form.get("CallSid") ?? "");
  const digits = String(form.get("Digits") ?? "") as DtmfDigit | "";

  // Twilio can call this endpoint without digits (timeout / hangup).
  if (!digits || !callSid) {
    return emptyTwiml("No digits received");
  }

  // Load the persisted call.
  const call = await prisma.call.findFirst({
    where: { providerCallId: callSid },
    select: { id: true, ivrState: true, ivrContext: true },
  });
  if (!call) {
    return emptyTwiml("Call not found — possibly an invalid or expired session.");
  }

  const previousState = call.ivrState ?? "MAIN_MENU";
  const context = call.ivrContext ? JSON.parse(call.ivrContext) : {};

  // If the caller just asked to "speak to an official" (state OFFICIAL_MENU),
  // skip the hangup/announce that the simulator uses and dial an official now.
  // The next keystroke at the main menu put us in OFFICIAL_MENU; we render the
  // dial ourselves and persist OFFICIAL_MENU so the flow is unambiguous.
  if (previousState === "MAIN_MENU" && digits === "5") {
    const target = await findTargetOfficial({});
    if (target?.phoneE164) {
      await prisma.call.update({
        where: { id: call.id },
        data: {
          ivrState: "OFFICIAL_MENU",
          assignedOfficialId: target.official.id,
          status: "CONNECTED",
          answeredAt: new Date(),
        },
      });
      const twiml = sessionToTwiML(
        {
          ...stepIvr("MAIN_MENU", "5", context),
          action: { type: "ROUTE_TO_OFFICIAL", prompt: { text: "A barangay official is available. We are connecting your call now." }, context },
        },
        { targetPhone: target.phoneE164 }
      );
      return new NextResponse(twiml.xml, { headers: { "Content-Type": "text/xml" } });
    }
  }

  const nextState = stepIvr(previousState as IvrStateName, digits as DtmfDigit, context);

  // Route to an official when the engine signals an emergency transfer.
  let targetPhone: string | undefined;
  if (nextState.action?.type === "ROUTE_TO_OFFICIAL") {
    const target = await findTargetOfficial(nextState.context);
    if (target?.phoneE164) {
      targetPhone = target.phoneE164;
      await prisma.call.update({
        where: { id: call.id },
        data: { assignedOfficialId: target.official.id },
      });
    }
  }

  // Persist next IVR state.
  await prisma.call.update({
    where: { id: call.id },
    data: {
      ivrState: nextState.state,
      ivrContext: JSON.stringify(nextState.context ?? {}),
    },
  });

  // Log the event for the dashboard.
  await logAudit({
    action: `IVR:${nextState.state}`,
    entityType: "Call",
    entityId: call.id,
    detail: `Digit: ${digits}`,
  }).catch(() => {});

  const twiml = sessionToTwiML(nextState, { targetPhone });
  return new NextResponse(twiml.xml, {
    headers: { "Content-Type": "text/xml" },
  });
}

function emptyTwiml(reason: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Maja" language="fil-PH">${reason}</Say><Hangup/></Response>`;
  return new NextResponse(xml, { headers: { "Content-Type": "text/xml" } });
}