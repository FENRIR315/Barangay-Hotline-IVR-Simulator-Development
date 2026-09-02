"use client";

import {
  LayoutDashboard,
  Phone,
  PhoneCall,
  Users,
  Megaphone,
  ClipboardList,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Phone Simulator", href: "/simulator", icon: <Phone className="h-4 w-4" /> },
  { label: "Calls", href: "/calls", icon: <PhoneCall className="h-4 w-4" /> },
  { label: "Officials", href: "/officials", icon: <Users className="h-4 w-4" /> },
  { label: "Announcements", href: "/announcements", icon: <Megaphone className="h-4 w-4" /> },
  { label: "Reports", href: "/reports", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-900 text-white">
          <Phone className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-gray-900">
            BarangayConnect
          </p>
          <p className="text-[11px] leading-tight text-gray-500">Hotline System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-900"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="rounded-md bg-red-50 px-3 py-2">
          <p className="text-[11px] font-semibold text-red-700">DEMO MODE</p>
          <p className="text-[10px] text-red-600/80">
            Simulator &amp; dashboard — no live calls
          </p>
        </div>
      </div>
    </aside>
  );
}