import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CallType, CallStatus } from "@prisma/client";

// POST /api/calls — start a new (simulated) call
const startSchema = z.object({
  callerPhone: z.string().optional(),
  source: z.enum(["SIMULATOR", "TELEPHONY"]).default("SIMULATOR"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const call = await prisma.call.create({
    data: {
      callerPhone: parsed.data.callerPhone,
      source: parsed.data.source,
      callType: CallType.INFORMATION,
      status: CallStatus.IN_IVR,
      priority: "NORMAL",
    },
  });

  return NextResponse.json({ call }, { status: 201 });
}