import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeCall } from "@/lib/telephony";
import { MENU } from "@/lib/ivr/menu";

/**
 * POST /api/telephony/recording
 * Twilio's <Record action> hits this when the caller finishes recording.
 * Fields: RecordingUrl, RecordingSid, RecordingDuration, CallSid, etc.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const callSid = String(form.get("CallSid") ?? "");
  const recordingUrl = String(form.get("RecordingUrl") ?? "");
  const recordingDuration = Number(form.get("RecordingDuration") ?? 0) || null;

  if (!callSid) return emptyResponse(400);

  const call = await prisma.call.findFirst({
    where: { providerCallId: callSid },
    select: { id: true },
  });
  if (!call) return emptyResponse(404);

  // Persist the voice recording metadata.
  if (recordingUrl) {
    try {
      await prisma.voiceRecording.create({
        data: {
          callId: call.id,
          filePath: recordingUrl,
          durationSec: recordingDuration,
          category: "VOICEMAIL",
        },
      });
    } catch (e) {
      console.error("Recording save failed:", e);
    }
  }

  await finalizeCall(call.id, "COMPLETED", recordingDuration);

  // Respond with goodbye + hangup so the caller hears a polite termination.
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Maja" language="fil-PH">${escapeXml(MENU.MESSAGE_RECORDED)}</Say><Hangup/></Response>`;
  return new NextResponse(xml, { status: 200, headers: { "Content-Type": "text/xml" } });
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function emptyResponse(status: number) {
  return new NextResponse(null, { status });
}