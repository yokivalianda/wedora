"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  LayoutDashboard, 
  FolderKanban, 
  ListTodo, 
  DollarSign, 
  Calendar, 
  FolderOpen, 
  Settings,
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proyek Pernikahan", href: "/projects", icon: FolderKanban },
  { name: "Daftar Tugas", href: "/tasks", icon: ListTodo },
  { name: "Kas & Anggaran", href: "/budget", icon: DollarSign },
  { name: "Kalender Acara", href: "/calendar", icon: Calendar },
  { name: "Daftar Vendor", href: "/vendors", icon: Sparkles },
  { name: "Dokumen & Moodboard", href: "/documents", icon: FolderOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SD";

  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-[#ECE7E1] lg:bg-white lg:px-6 lg:pb-6 lg:pt-8">
      {/* Brand logo */}
      <div className="flex items-center gap-2 px-2">
        <span className="font-heading text-2xl font-bold tracking-wide text-[#1E1E1E]">
          Wed<span className="text-[#D4AF37]">ora</span>
        </span>
        <span className="rounded-full bg-[#FAF7F2] border border-[#ECE7E1] px-2 py-0.5 text-[10px] font-semibold text-[#D4AF37] uppercase">
          WO
        </span>
      </div>

      {/* Navigation */}
      <nav className="mt-10 flex flex-1 flex-col justify-between">
        <ul role="list" className="space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-x-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#1E1E1E] text-white shadow-md scale-[1.01]"
                      : "text-[#666666] hover:bg-[#FAF7F2] hover:text-[#1E1E1E]"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#D4AF37]" : "text-[#666666] group-hover:text-[#1E1E1E]")} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer/User area */}
        <div className="space-y-4 border-t border-[#ECE7E1] pt-6">
          <Link
            href="/settings"
            className={cn(
              "group flex items-center gap-x-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200",
              pathname.startsWith("/settings")
                ? "bg-[#1E1E1E] text-white shadow-md"
                : "text-[#666666] hover:bg-[#FAF7F2] hover:text-[#1E1E1E]"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Pengaturan
          </Link>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#ECE7E1] text-[#1E1E1E] font-semibold text-xs">
                {initials}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[#1E1E1E] truncate max-w-[120px]">{user?.name || "Sari Dewi"}</p>
                <p className="text-[10px] text-[#666666] truncate max-w-[120px]">Owner</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="text-[#666666] hover:text-[#1E1E1E] transition-colors p-1.5 rounded-full hover:bg-[#FAF7F2]"
              title="Keluar"
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}

