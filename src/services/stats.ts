import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";

export interface DashboardStats {
  callsToday: number;
  emergencyCallsToday: number;
  missedCallsToday: number;
  activeCalls: number;
  waitingCallers: number;
  availableOfficials: number;
  busyOfficials: number;
  offlineOfficials: number;
  activeAnnouncements: number;
  newComplaints: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayStart = startOfDay(new Date());

  const [
    callsToday,
    emergencyCallsToday,
    missedCallsToday,
    activeCalls,
    waitingCallers,
    availableOfficials,
    busyOfficials,
    offlineOfficials,
    activeAnnouncements,
    newComplaints,
  ] = await Promise.all([
    prisma.call.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.call.count({
      where: { createdAt: { gte: todayStart }, callType: "EMERGENCY" },
    }),
    prisma.call.count({
      where: { createdAt: { gte: todayStart }, status: "MISSED" },
    }),
    prisma.call.count({
      where: { status: { in: ["CONNECTED", "RINGING", "QUEUED"] } },
    }),
    prisma.callQueue.count({ where: { status: "WAITING" } }),
    prisma.official.count({ where: { status: "AVAILABLE", active: true } }),
    prisma.official.count({ where: { status: "BUSY", active: true } }),
    prisma.official.count({ where: { status: "OFFLINE", active: true } }),
    prisma.announcement.count({
      where: {
        active: true,
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } },
        ],
        AND: [
          { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        ],
      },
    }),
    prisma.communityReport.count({ where: { status: "NEW" } }),
  ]);

  return {
    callsToday,
    emergencyCallsToday,
    missedCallsToday,
    activeCalls,
    waitingCallers,
    availableOfficials,
    busyOfficials,
    offlineOfficials,
    activeAnnouncements,
    newComplaints,
  };
}

export interface RecentItem {
  id: string;
  callerPhone?: string | null;
  callType: string;
  category?: string | null;
  status: string;
  priority: string;
  startedAt: Date;
  reportNumber?: string | null;
}

export async function getRecentCalls(limit = 10): Promise<RecentItem[]> {
  const calls = await prisma.call.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    select: {
      id: true,
      callerPhone: true,
      callType: true,
      category: true,
      status: true,
      priority: true,
      startedAt: true,
      communityReport: { select: { reportNumber: true } },
      emergencyReport: { select: { id: true } },
    },
  });

  return calls.map((c) => ({
    ...c,
    reportNumber:
      c.communityReport?.reportNumber ?? (c.emergencyReport ? "EMERGENCY" : null),
  }));
}

export async function getLiveCalls(): Promise<
  { id: string; callerPhone: string; category: string; status: string }[]
> {
  const live = await prisma.call.findMany({
    where: { status: { in: ["CONNECTED", "RINGING", "QUEUED"] } },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: {
      id: true,
      callerPhone: true,
      category: true,
      status: true,
    },
  });

  return live.map((c) => ({
    id: c.id,
    callerPhone: c.callerPhone ?? "(unknown)",
    category: c.category ?? "General inquiry",
    status: c.status,
  }));
}

/** Mask a PH mobile number for display: 09XX-XXX-1234 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  // Keep first 2 + last 4 digits visible
  return `${digits.slice(0, 2)}XX-XXX-${digits.slice(-4)}`;
}

export async function callsPerDay(days = 7): Promise<{ date: Date; count: number }[]> {
  const since = subDays(new Date(), days - 1);
  const calls = await prisma.call.findMany({
    where: { createdAt: { gte: startOfDay(since) } },
    select: { createdAt: true },
  });

  const byDay = new Map<string, number>();
  for (const c of calls) {
    const key = c.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  const result: { date: Date; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: d, count: byDay.get(key) ?? 0 });
  }
  return result;
}