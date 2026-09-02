import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CallStatus, CallType, Priority } from "@prisma/client";

/**
 * PATCH /api/calls/[id] — update a call: status, duration, category, type,
 * priority, assigned official, ends the call when COMPLETED/MISSED/CANCELLED.
 */

const statusValues = Object.values(CallStatus) as [string, ...string[]];
const typeValues = Object.values(CallType) as [string, ...string[]];
const priorityValues = Object.values(Priority) as [string, ...string[]];

const updateSchema = z.object({
  status: z.enum(statusValues).optional(),
  callType: z.enum(typeValues).optional(),
  category: z.string().optional(),
  priority: z.enum(priorityValues).optional(),
  assignedOfficialId: z.string().optional(),
  durationSec: z.number().int().nonnegative().optional(),
  callerName: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.call.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  const isTerminal =
    parsed.data.status === "COMPLETED" ||
    parsed.data.status === "MISSED" ||
    parsed.data.status === "CANCELLED";
  const isAnswered = parsed.data.status === "CONNECTED" || parsed.data.status === "COMPLETED";

  const call = await prisma.call.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status as CallStatus } : {}),
      ...(parsed.data.callType ? { callType: parsed.data.callType as CallType } : {}),
      ...(parsed.data.priority ? { priority: parsed.data.priority as Priority } : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
      ...(parsed.data.assignedOfficialId !== undefined
        ? { assignedOfficialId: parsed.data.assignedOfficialId }
        : {}),
      ...(parsed.data.durationSec !== undefined ? { durationSec: parsed.data.durationSec } : {}),
      ...(parsed.data.callerName !== undefined ? { callerName: parsed.data.callerName } : {}),
      ...(isTerminal ? { endedAt: new Date() } : {}),
      ...(isAnswered ? { answeredAt: existing.answeredAt ?? new Date() } : {}),
    },
  });

  return NextResponse.json({ call });
}