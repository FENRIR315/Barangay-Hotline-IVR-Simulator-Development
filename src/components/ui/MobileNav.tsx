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

const MOBILE_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Simulator", href: "/simulator", icon: Phone },
  { label: "Calls", href: "/calls", icon: PhoneCall },
  { label: "Officials", href: "/officials", icon: Users },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Reports", href: "/reports", icon: ClipboardList },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 z-10 border-b border-gray-200 bg-white md:hidden">
      <nav className="flex gap-1 overflow-x-auto px-3 py-2">
        {MOBILE_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-900"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}