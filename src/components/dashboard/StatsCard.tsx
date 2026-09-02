import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accent?: "default" | "danger" | "info" | "success" | "warning";
}

const ACCENT_CLASSES: Record<NonNullable<StatsCardProps["accent"]>, string> = {
  default: "bg-blue-100 text-blue-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
};

export function StatsCard({ label, value, icon, accent = "default" }: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-5">
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
              ACCENT_CLASSES[accent]
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}