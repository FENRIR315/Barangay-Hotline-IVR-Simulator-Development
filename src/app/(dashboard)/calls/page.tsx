import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "Calls" };

export default function CallsPage() {
  return (
    <ComingSoon
      title="Call Records"
      description="Search and review all incoming calls to the hotline."
      items={[
        "Live call monitoring with masked phone numbers",
        "Call history with filters: date, category, status, priority",
        "Call details: timeline, events, assigned official",
        "Voice message playback for recordings",
      ]}
    />
  );
}