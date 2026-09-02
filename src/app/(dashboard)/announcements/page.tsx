import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "Announcements" };

export default function AnnouncementsPage() {
  return (
    <ComingSoon
      title="Announcement Management"
      description="Create and manage announcements read by the IVR."
      items={[
        "Create, edit, activate, and deactivate announcements",
        "Schedule announcements with start and end dates",
        "Priority marking (normal / urgent)",
        "Live preview of how the IVR will read each announcement",
      ]}
    />
  );
}