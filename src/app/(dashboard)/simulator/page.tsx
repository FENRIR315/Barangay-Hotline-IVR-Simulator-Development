import { PhoneSimulator } from "@/components/phone/PhoneSimulator";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const IVR_OPTIONS = [
  { key: "1", label: "Emergency Assistance" },
  { key: "2", label: "Barangay Services" },
  { key: "3", label: "Report a Community Problem" },
  { key: "4", label: "Barangay Announcements" },
  { key: "5", label: "Speak with a Barangay Official" },
  { key: "0", label: "Repeat Menu" },
];

export const metadata = {
  title: "Phone Simulator",
};

export default function SimulatorPage() {
  const hotlineNumber = process.env.TWILIO_HOTLINE_NUMBER ?? "";
  const telephonyReady = process.env.TELEPHONY_PROVIDER === "twilio" && hotlineNumber.length > 0;

  return (
    <div>
      <PageHeader
        title="Phone Simulator"
        description="Dial the hotline and navigate the automated voice menu with the keypad. Each prompt is spoken aloud so the experience matches a real phone call."
      />

      <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
        <PhoneSimulator hotlineNumber={telephonyReady ? hotlineNumber : ""} />

        <div className="space-y-4">
          {telephonyReady && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-900">Dial the real hotline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 font-mono text-lg font-bold text-blue-900">{hotlineNumber}</p>
                <p className="text-xs text-blue-700">
                  Place a call from your phone to this number. A Filipino voice will read the IVR
                  menu — the same path as the simulator.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>IVR Main Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs leading-relaxed text-gray-500">
                &ldquo;Welcome to BarangayConnect Hotline. Please select an option:&rdquo;
              </p>
              <ul className="space-y-2">
                {IVR_OPTIONS.map((opt) => (
                  <li
                    key={opt.key}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-900 text-[10px] font-bold text-white">
                      {opt.key}
                    </span>
                    {opt.label}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What happens behind the scenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-gray-600">
              <p>
                The simulator sends each keypad press through the shared IVR state
                machine in <code className="rounded bg-gray-100 px-1">lib/ivr/engine.ts</code>.
              </p>
              <p>
                Calls started here are recorded in the database with status{" "}
                <code className="rounded bg-gray-100 px-1">IN_IVR</code>, then marked{" "}
                <code className="rounded bg-gray-100 px-1">COMPLETED</code> when you hang up —
                the same lifecycle a real telephone call will follow.
              </p>
              <p>
                When you are ready, pressing Call opens the main menu. Navigate to
                Emergency Assistance and select Fire or Flood to see the emergency flow.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}