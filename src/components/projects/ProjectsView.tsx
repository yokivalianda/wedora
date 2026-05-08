"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { WeddingProject } from "@/types";
import { projectService, activityService } from "@/lib/services";
import {
  formatCurrency,
  formatDate,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  calculateProgress
} from "@/lib/utils";
import { Calendar, Users, Plus, ChevronRight, MapPin, Search, X, Sparkles, DollarSign, ListTodo, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ProjectsView() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<WeddingProject[]>([]);
  const [activeTab, setActiveTab] = useState<"semua" | "inquiry" | "planning" | "dp_paid" | "in_progress" | "completed">("semua");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    projectService.getAll().then((data) => setProjects(data));
  }, []);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form State
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [budgetTotal, setBudgetTotal] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const filteredProjects = projects.filter((p) => {
    const matchesTab = activeTab === "semua" || p.status === activeTab;
    const matchesSearch =
      p.bride_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.groom_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.venue && p.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brideName || !groomName || !weddingDate || !venue) return;

    setIsSubmitting(true);
    setSubmitError("");

    const newProject: WeddingProject = {
      id: `proj-gen-${Date.now()}`,
      org_id: null,
      client_id: `client-gen-${Date.now()}`,
      bride_name: brideName,
      groom_name: groomName,
      wedding_date: weddingDate,
      venue: venue,
      guest_count: Number(guestCount) || 300,
      budget_total: Number(budgetTotal) || 150000000,
      budget_used: 0,
      status: "planning",
      notes: notes || "Tema modern elegant, nuansa premium.",
      assigned_staff: ["user-002", "user-003"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const saved = await projectService.create(newProject);
      setProjects((prev) => [saved, ...prev]);

      // Log activity
      activityService.create({
        id: `act-${Date.now()}`,
        org_id: null,
        user_id: null,
        user_name: user?.name || "Pengguna",
        action: "menambahkan proyek baru",
        entity_type: "project",
        entity_name: `${saved.bride_name} & ${saved.groom_name}`,
        created_at: new Date().toISOString()
      }).catch(console.warn);

      // Reset Form & close modal only on success
      setBrideName("");
      setGroomName("");
      setWeddingDate("");
      setVenue("");
      setGuestCount("");
      setBudgetTotal("");
      setNotes("");
      setIsAddModalOpen(false);
    } catch (err: any) {
      setSubmitError(err?.message || "Gagal menyimpan proyek. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus proyek ini?")) return;
    projectService.delete(id).then(() => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    });
  };

  const tabs = [
    { key: "semua", label: "Semua" },
    { key: "inquiry", label: "Inquiry" },
    { key: "planning", label: "Perencanaan" },
    { key: "dp_paid", label: "DP Paid" },
    { key: "in_progress", label: "Berlangsung" },
    { key: "completed", label: "Selesai" },
  ] as const;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">Proyek Pernikahan</h1>
            <p className="mt-1 text-sm text-[#666666]">Kelola semua persiapan pernikahan klien Anda di satu tempat.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Proyek Baru</span>
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#ECE7E1] pb-4">
          {/* Scrollable Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === tab.key
                    ? "bg-[#1E1E1E] text-white shadow-sm"
                    : "text-[#666666] hover:bg-white hover:text-[#1E1E1E]"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="search"
              placeholder="Cari nama atau venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-full border border-[#ECE7E1] bg-white py-2 pl-10 pr-4 text-xs text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-12 text-center">
            <p className="text-sm font-medium text-[#666666]">Tidak ada proyek pernikahan yang sesuai filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const progress = calculateProgress(project.budget_used, project.budget_total);
              return (
                <div
                  key={project.id}
                  className="flex flex-col rounded-2xl border border-[#ECE7E1] bg-white overflow-hidden shadow-soft hover:shadow-card transition-all"
                >
                  {/* Top Header Card */}
                  <div className="p-6 text-left flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PROJECT_STATUS_COLORS[project.status]}`}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                      <span className="text-[10px] text-[#666666] font-medium uppercase">
                        {project.guest_count ? `${project.guest_count} Tamu` : ""}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-heading text-xl font-bold text-[#1E1E1E] tracking-tight">
                        {project.bride_name} & {project.groom_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]" />
                        <span>{formatDate(project.wedding_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#666666] truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]" />
                        <span>{project.venue}</span>
                      </div>
                    </div>

                    {/* Progress Bar for Budget (Visual Cue) */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[11px] font-medium text-[#666666]">
                        <span>Anggaran Terpakai</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#FAF7F2] border border-[#ECE7E1] overflow-hidden">
                        <div
                          style={{ width: `${progress}%` }}
                          className="h-full bg-[#D4AF37] rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-[#1E1E1E] pt-0.5">
                        <span>{formatCurrency(project.budget_used)}</span>
                        <span>{formatCurrency(project.budget_total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="border-t border-[#ECE7E1] bg-[#FAF7F2]/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                      <Users className="h-4 w-4 text-[#666666]" />
                      <span>{project.assigned_staff.length} Kordinator</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-[#666666] hover:text-rose-500 transition-colors"
                        title="Hapus Proyek"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline">
                        <span>Detail Proyek</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Premium Tambah Proyek Modal */}
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
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Mulai Proyek Pernikahan</h3>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nama Pengantin Wanita</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Anisa Putri"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nama Pengantin Pria</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Reza"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Tanggal Hari-H</label>
                    <input
                      type="date"
                      required
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Jumlah Undangan (Tamu)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 300"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Lokasi / Venue Pernikahan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hotel Ritz-Carlton Jakarta"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nilai Kontrak Anggaran (IDR)</label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-[#666666] font-bold">
                      Rp
                    </div>
                    <input
                      type="number"
                      placeholder="Contoh: 150000000"
                      value={budgetTotal}
                      onChange={(e) => setBudgetTotal(e.target.value)}
                      className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 py-2 pl-9 pr-4 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Catatan / Konsep Acara</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Konsep garden party, dekorasi sage green..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1.5 block w-full rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2.5 text-xs focus:border-[#D4AF37] focus:outline-none resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="space-y-3 border-t border-[#ECE7E1] pt-4 mt-6">
                  {submitError && (
                    <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                      ⚠️ {submitError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsAddModalOpen(false); setSubmitError(""); }}
                      className="rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs font-semibold text-[#666666] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-full bg-[#1E1E1E] px-5 py-2 text-xs font-semibold text-white hover:scale-[1.01] transition-transform flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Mulai Proyek'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
