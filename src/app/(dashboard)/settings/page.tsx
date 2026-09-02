import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ComingSoon
      title="System Settings"
      description="Hotline configuration, escalation rules, and security."
      items={[
        "Hotline number and barangay name",
        "Escalation timeouts (20s / 30s / 60s)",
        "Queue wait limits",
        "Recording notice and consent settings",
      ]}
    />
  );
}