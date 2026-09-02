import { LogoutButton } from "@/components/ui/LogoutButton";
import { ROLE_LABELS } from "@/types";
import type { CurrentUser } from "@/lib/auth/session";

export function TopBar({ user }: { user: CurrentUser }) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-blue-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          BarangayConnect
        </span>
        <span className="hidden text-xs text-gray-500 sm:inline">Hotline System</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
            {initials}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-gray-900">{user.name}</p>
            <p className="text-[10px] text-gray-500">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <LogoutButton />
      </div>
    </header>
  );
}