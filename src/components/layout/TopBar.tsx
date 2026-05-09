"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Search, Plus, X } from "lucide-react";
import { activityService } from "@/lib/services";
import { Activity } from "@/types";
import { formatDateRelative } from "@/lib/utils";

export default function TopBar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activityService.getAll().then((data) => {
      // Show only latest 6 activities as notifications
      setActivities(data.slice(0, 6));
    });
    // Load previously read IDs from localStorage
    try {
      const stored = localStorage.getItem("wedora_read_notifs");
      if (stored) setReadIds(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifications]);

  const unreadCount = activities.filter((a) => !readIds.has(a.id)).length;

  const handleMarkAllRead = () => {
    const allIds = new Set(activities.map((a) => a.id));
    setReadIds(allIds);
    try {
      localStorage.setItem("wedora_read_notifs", JSON.stringify([...allIds]));
    } catch { /* ignore */ }
  };

  const handleMarkOneRead = (id: string) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    try {
      localStorage.setItem("wedora_read_notifs", JSON.stringify([...updated]));
    } catch { /* ignore */ }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#ECE7E1] bg-[#FAF7F2]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Mobile Branding */}
      <div className="flex flex-1 items-center gap-2 lg:hidden">
        <span className="font-heading text-xl font-bold tracking-wide text-[#1E1E1E]">
          Wed<span className="text-[#D4AF37]">ora</span>
        </span>
      </div>

      {/* Search Input (Desktop) - Command Palette Trigger */}
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

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
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

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-[#ECE7E1] bg-white shadow-elevated z-50">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#ECE7E1] px-4 py-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">Aktivitas Terbaru</h4>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-[#666666] hover:text-[#D4AF37] font-semibold transition-colors"
                    >
                      Tandai semua
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#666666] hover:text-[#1E1E1E] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Activity List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-[#ECE7E1]/60">
                {activities.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-[#666666]">Belum ada aktivitas tercatat.</p>
                  </div>
                ) : (
                  activities.map((act) => {
                    const isUnread = !readIds.has(act.id);
                    return (
                      <div
                        key={act.id}
                        onClick={() => handleMarkOneRead(act.id)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#FAF7F2]/60 ${
                          isUnread ? "bg-[#FAF7F2]/40" : ""
                        }`}
                      >
                        {/* Dot indicator */}
                        <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${isUnread ? "bg-[#D4AF37]" : "bg-transparent"}`} />
                        <div className="text-left space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs text-[#1E1E1E] leading-snug">
                            <span className="font-bold">{act.user_name}</span>{" "}
                            {act.action}{" "}
                            {act.entity_name && (
                              <span className="italic text-[#666666]">"{act.entity_name}"</span>
                            )}
                          </p>
                          <span className="text-[9px] text-[#666666]/70">
                            {formatDateRelative(act.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#ECE7E1] px-4 py-2.5">
                <Link
                  href="/dashboard"
                  onClick={() => setShowNotifications(false)}
                  className="block text-center text-[10px] font-semibold text-[#D4AF37] hover:underline"
                >
                  Lihat semua aktivitas di Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
