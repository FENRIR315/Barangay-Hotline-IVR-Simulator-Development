import { PhoneCall, AlertTriangle, PhoneMissed, Timer, Users } from "lucide-react";
import { format } from "date-fns";
import {
  getDashboardStats,
  getRecentCalls,
  getLiveCalls,
  maskPhone,
} from "@/services/stats";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CALL_STATUS_LABELS, PRIORITY_LABELS } from "@/types";

export const dynamic = "force-dynamic";

function statusVariant(status: string): "success" | "warning" | "danger" | "info" | "secondary" {
  switch (status) {
    case "CONNECTED":
      return "success";
    case "QUEUED":
    case "RINGING":
      return "warning";
    case "MISSED":
      return "danger";
    case "ESCALATED":
      return "danger";
    default:
      return "secondary";
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recent = await getRecentCalls(8);
  const live = await getLiveCalls();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of the barangay hotline system."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Calls Today"
          value={stats.callsToday}
          icon={<PhoneCall className="h-5 w-5" />}
        />
        <StatsCard
          label="Emergency Calls"
          value={stats.emergencyCallsToday}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="danger"
        />
        <StatsCard
          label="Missed Calls"
          value={stats.missedCallsToday}
          icon={<PhoneMissed className="h-5 w-5" />}
          accent="warning"
        />
        <StatsCard
          label="Active Calls"
          value={stats.activeCalls}
          icon={<Timer className="h-5 w-5" />}
          accent="info"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Waiting Callers" value={stats.waitingCallers} accent="warning" />
        <StatsCard
          label="Officials Available"
          value={stats.availableOfficials}
          icon={<Users className="h-5 w-5" />}
          accent="success"
        />
        <StatsCard label="Officials Busy" value={stats.busyOfficials} accent="info" />
        <StatsCard label="Active Announcements" value={stats.activeAnnouncements} accent="info" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Live calls */}
        <Card>
          <CardHeader>
            <CardTitle>Live Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {live.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No live calls at the moment.
              </p>
            ) : (
              <div className="space-y-3">
                {live.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {call.callerPhone}
                      </p>
                      <p className="text-xs text-gray-500">
                        {call.category ?? "General inquiry"}
                      </p>
                    </div>
                    <Badge variant={statusVariant(call.status)}>
                      {CALL_STATUS_LABELS[call.status as keyof typeof CALL_STATUS_LABELS] ?? call.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent calls */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500">
                  <th className="pb-2 pr-3 font-medium">Time</th>
                  <th className="pb-2 pr-3 font-medium">Caller</th>
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 pr-3 font-medium">Priority</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((call) => (
                  <tr key={call.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2.5 pr-3 text-gray-600">
                      {format(call.startedAt, "MM/dd HH:mm")}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-gray-700">
                      {maskPhone(call.callerPhone ?? "Unknown")}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-700">
                      {call.reportNumber ?? call.callType}
                    </td>
                    <td className={`py-2.5 pr-3 text-xs font-medium ${call.priority === "CRITICAL" ? "text-red-600" : "text-gray-700"}`}>
                      {PRIORITY_LABELS[call.priority as keyof typeof PRIORITY_LABELS] ?? call.priority}
                    </td>
                    <td className="py-2.5">
                      <Badge variant={statusVariant(call.status)}>
                        {CALL_STATUS_LABELS[call.status as keyof typeof CALL_STATUS_LABELS] ?? call.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}