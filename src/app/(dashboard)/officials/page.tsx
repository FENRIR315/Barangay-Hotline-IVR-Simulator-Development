import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "Officials" };

export default function OfficialsPage() {
  return (
    <ComingSoon
      title="Official Management"
      description="Manage barangay officials, their phone extensions, and availability."
      items={[
        "Add, edit, and deactivate officials",
        "Set position, department, phone, and extension",
        "Availability status: Available, Busy, Offline",
        "Emergency routing priority and escalation chains",
      ]}
    />
  );
}