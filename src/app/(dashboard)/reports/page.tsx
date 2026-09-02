import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports & Statistics"
      description="Emergency reports, community complaints, and call analytics."
      items={[
        "Emergency incidents with priority and status",
        "Community problem reports with report numbers",
        "Call statistics: per day, week, month",
        "Response time and waiting time analytics",
      ]}
    />
  );
}