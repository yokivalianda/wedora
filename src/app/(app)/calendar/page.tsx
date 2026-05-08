"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { mockTimeline } from "@/lib/mock-data";
import { projectService } from "@/lib/services";
import { WeddingProject } from "@/types";
import { Calendar, Clock, MapPin, User, Plus } from "lucide-react";
import { formatDate, daysUntil } from "@/lib/utils";

export default function CalendarPage() {
  const [projects, setProjects] = useState<WeddingProject[]>([]);

  useEffect(() => {
    projectService.getAll().then(setProjects);
  }, []);

  // Show the nearest upcoming/active project instead of hardcoding the first one
  const upcomingProjects = projects
    .filter((p) => daysUntil(p.wedding_date) >= -1)
    .sort((a, b) => new Date(a.wedding_date).getTime() - new Date(b.wedding_date).getTime());

  const weddingProject = upcomingProjects[0] || projects[0];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">Kalender & Timeline</h1>
            <p className="mt-1 text-sm text-[#666666]">Lacak susunan acara (Rundown) hari H pernikahan dan jadwal pertemuan.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform">
            <Plus className="h-4 w-4" />
            <span>Tambah Jadwal Baru</span>
          </button>
        </div>

        {/* Project Context Box */}
        {weddingProject ? (
          <div className="rounded-2xl border border-[#ECE7E1] bg-white p-6 text-left shadow-soft space-y-2">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Jadwal Rundown Aktif</span>
            <h2 className="font-heading text-2xl font-bold text-[#1E1E1E] tracking-tight">
              Pernikahan {weddingProject.bride_name} & {weddingProject.groom_name}
            </h2>
            <p className="text-xs text-[#666666]">
              Hari H Pernikahan: <strong>{formatDate(weddingProject.wedding_date)}</strong> • Lokasi: {weddingProject.venue}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-6 text-left shadow-soft space-y-2">
            <p className="text-sm text-[#666666]">Tidak ada proyek aktif untuk ditampilkan rundown-nya.</p>
          </div>
        )}

        {/* Timeline Event Tracks */}
        <div className="space-y-4">
          <h3 className="font-heading text-xl font-semibold text-[#1E1E1E] text-left">Susunan Acara (Rundown) Hari-H</h3>
          <div className="relative border-l border-[#ECE7E1] ml-4 pl-6 space-y-8 py-2 text-left">
            {([] as any[]).map((item) => (
              <div key={item.id} className="relative">
                {/* Visual Circle Indicator */}
                <span className="absolute -left-10 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-[#D4AF37] text-[11px] font-bold text-[#1E1E1E]">
                  {item.time.split(":")[0]}
                </span>

                {/* Info Card */}
                <div className="rounded-2xl border border-[#ECE7E1] bg-white p-5 shadow-soft hover:shadow-card transition-all max-w-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#ECE7E1]/50 pb-2.5">
                    <h4 className="font-heading text-base font-bold text-[#1E1E1E]">{item.title}</h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] border border-[#ECE7E1] px-2.5 py-0.5 text-xs font-semibold text-[#1E1E1E]">
                      <Clock className="h-3 w-3 text-[#D4AF37]" />
                      <span>{item.time} WIB</span>
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-[#666666] leading-relaxed">{item.description}</p>
                  )}

                  {/* Detail labels */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-[#666666] font-medium">
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>{item.location}</span>
                      </span>
                    )}
                    {item.pic && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Penanggung Jawab: {item.pic}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
