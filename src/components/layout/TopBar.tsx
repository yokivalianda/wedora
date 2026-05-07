"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Search, Plus, Calendar, Settings, LogOut, ArrowRight } from "lucide-react";
import { mockNotifications } from "@/lib/mock-data";
import { formatDateRelative } from "@/lib/utils";

export default function TopBar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#ECE7E1] bg-[#FAF7F2]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Mobile Branding */}
      <div className="flex flex-1 items-center gap-2 lg:hidden">
        <span className="font-heading text-xl font-bold tracking-wide text-[#1E1E1E]">
          Wed<span className="text-[#D4AF37]">ora</span>
        </span>
      </div>

      {/* Search Input (Desktop) - Acting as Command Palette Trigger */}
      <div 
        onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
        className="hidden lg:flex flex-1 max-w-md relative items-center cursor-pointer group"
      >
        <div className="absolute left-3.5 text-[#666666] group-hover:text-[#D4AF37] transition-colors">
          <Search className="h-4 w-4" />
        </div>
        <div className="block w-full rounded-full border border-[#ECE7E1] bg-white py-2 pl-10 pr-12 text-sm text-[#666666]/60 select-none text-left font-medium group-hover:border-[#D4AF37] transition-colors">
          Cari proyek, tugas, atau anggaran...
        </div>
        <div className="absolute right-3 flex items-center gap-0.5 rounded border border-[#ECE7E1] bg-[#FAF7F2] px-1.5 py-0.5 text-[9px] font-bold text-[#666666] tracking-wider select-none">
          <span>⌘</span>
          <span>K</span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-x-4 ml-auto">
        {/* Quick Add Button */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 rounded-full bg-[#1E1E1E] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.02] transition-transform"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Proyek Baru</span>
        </Link>

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full bg-white p-2 text-[#666666] border border-[#ECE7E1] hover:text-[#1E1E1E] transition-colors focus:outline-none"
          >
            <span className="sr-only">Notifikasi</span>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#D4AF37]" />
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-[#ECE7E1] bg-white p-4 shadow-elevated z-50">
              <div className="flex items-center justify-between border-b border-[#ECE7E1] pb-2 mb-2">
                <h4 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">Notifikasi</h4>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {mockNotifications.map((notif) => (
                  <div key={notif.id} className="text-left py-1">
                    <p className="text-xs font-semibold text-[#1E1E1E]">{notif.title}</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">{notif.body}</p>
                    <span className="text-[9px] text-[#666666]/70 mt-1 block">
                      {formatDateRelative(notif.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
