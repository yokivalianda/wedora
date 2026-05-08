"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { timelineService, activityService, projectService } from "@/lib/services";
import { WeddingProject, TimelineEvent } from "@/types";
import { Calendar, Clock, MapPin, User, Plus, X, Sparkles, Trash2 } from "lucide-react";
import { formatDate, daysUntil } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function CalendarPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<WeddingProject[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [pic, setPic] = useState("");
  const [category, setCategory] = useState<"ceremony" | "reception" | "preparation" | "vendor" | "lainnya">("preparation");

  useEffect(() => {
    projectService.getAll().then((data) => {
      setProjects(data);
      if (data.length > 0) {
        // Default to the nearest upcoming project
        const upcoming = data
          .filter((p) => daysUntil(p.wedding_date) >= -1)
          .sort((a, b) => new Date(a.wedding_date).getTime() - new Date(b.wedding_date).getTime());
        const defaultProject = upcoming[0] || data[0];
        setSelectedProjectId(defaultProject.id);
      }
    });
    timelineService.getAll().then(setTimelineEvents);
  }, []);

  const weddingProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const filteredEvents = timelineEvents
    .filter((t) => t.project_id === weddingProject?.id)
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !time || !weddingProject) return;

    const newEvent: TimelineEvent = {
      id: `tl-gen-${Date.now()}`,
      project_id: weddingProject.id,
      title,
      description: description || undefined,
      time,
      location: location || undefined,
      pic: pic || undefined,
      category,
      created_at: new Date().toISOString()
    };

    timelineService.create(newEvent).then((saved) => {
      setTimelineEvents((prev) => [...prev, saved]);

      // Log activity
      activityService.create({
        id: `act-${Date.now()}`,
        org_id: "org-001",
        user_id: "user-001",
        user_name: user?.name || "Pengguna",
        action: "menambahkan jadwal baru",
        entity_type: "timeline",
        entity_name: saved.title,
        created_at: new Date().toISOString()
      }).catch(console.warn);
    });

    // Reset form
    setTitle("");
    setDescription("");
    setTime("");
    setLocation("");
    setPic("");
    setCategory("preparation");
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return;
    const event = timelineEvents.find((e) => e.id === id);
    timelineService.delete(id).then(() => {
      setTimelineEvents((prev) => prev.filter((e) => e.id !== id));

      // Log activity
      activityService.create({
        id: `act-${Date.now()}`,
        org_id: "org-001",
        user_id: "user-001",
        user_name: user?.name || "Pengguna",
        action: "menghapus jadwal",
        entity_type: "timeline",
        entity_name: event?.title || "Jadwal",
        created_at: new Date().toISOString()
      }).catch(console.warn);
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">Kalender & Timeline</h1>
            <p className="mt-1 text-sm text-[#666666]">Lacak susunan acara (Rundown) hari H pernikahan dan jadwal pertemuan.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Jadwal Baru</span>
          </button>
        </div>

        {/* Project Selector */}
        {projects.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">Pilih Proyek:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Pernikahan {p.bride_name} & {p.groom_name}
                </option>
              ))}
            </select>
          </div>
        )}

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
            {filteredEvents.length > 0 ? (
              filteredEvents.map((item) => (
                <div key={item.id} className="relative">
                  {/* Visual Circle Indicator */}
                  <span className="absolute -left-10 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-[#D4AF37] text-[11px] font-bold text-[#1E1E1E]">
                    {item.time.split(":")[0]}
                  </span>

                  {/* Info Card */}
                  <div className="rounded-2xl border border-[#ECE7E1] bg-white p-5 shadow-soft hover:shadow-card transition-all max-w-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#ECE7E1]/50 pb-2.5">
                      <h4 className="font-heading text-base font-bold text-[#1E1E1E]">{item.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] border border-[#ECE7E1] px-2.5 py-0.5 text-xs font-semibold text-[#1E1E1E]">
                          <Clock className="h-3 w-3 text-[#D4AF37]" />
                          <span>{item.time} WIB</span>
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-[#666666] hover:text-rose-500 transition-colors"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF7F2] text-[#D4AF37] border border-[#ECE7E1]">
                  <Calendar className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-[#1E1E1E]">Belum Ada Jadwal</h4>
                <p className="text-xs text-[#666666] max-w-xs mx-auto">Tambahkan susunan acara rundown hari H untuk proyek ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tambah Jadwal Baru Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#ECE7E1] bg-white shadow-elevated z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#ECE7E1] px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Tambah Jadwal Baru</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-full p-1 text-[#666666] hover:bg-[#FAF7F2] hover:text-[#1E1E1E] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Judul Acara</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Akad Nikah"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Deskripsi (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Prosesi akad nikah di aula utama..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 block w-full rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2.5 text-xs focus:border-[#D4AF37] focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Waktu</label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="ceremony">Ceremony</option>
                      <option value="reception">Reception</option>
                      <option value="preparation">Preparation</option>
                      <option value="vendor">Vendor</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Lokasi (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Aula Utama"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Penanggung Jawab / PIC (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Sari Dewi"
                      value={pic}
                      onChange={(e) => setPic(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-2 border-t border-[#ECE7E1] pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs font-semibold text-[#666666] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#1E1E1E] px-5 py-2 text-xs font-semibold text-white hover:scale-[1.01] transition-transform flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Tambah Jadwal</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
