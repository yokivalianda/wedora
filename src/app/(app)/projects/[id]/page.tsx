"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { mockTimeline, mockUsers } from "@/lib/mock-data";
import { projectService, taskService, paymentService } from "@/lib/services";
import { WeddingProject, Task, Payment } from "@/types";
import { 
  formatCurrency, 
  formatDate, 
  PROJECT_STATUS_LABELS, 
  PROJECT_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  calculateProgress
} from "@/lib/utils";
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Plus,
  ChevronRight,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  Receipt,
  UserCheck
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [project, setProject] = useState<WeddingProject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<"overview" | "rundown" | "keuangan" | "checklist">("overview");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      projectService.getById(id),
      taskService.getAll(),
      paymentService.getAll()
    ]).then(([projData, taskData, payData]) => {
      setProject(projData);
      setTasks(taskData.filter((t) => t.project_id === id));
      setPayments(payData.filter((p) => p.project_id === id));
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-[#ECE7E1]" />
            <div className="h-4 w-32 rounded bg-[#ECE7E1]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-12 text-center max-w-lg mx-auto mt-20 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
            <Info className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#1E1E1E]">Proyek Tidak Ditemukan</h2>
          <p className="text-sm text-[#666666]">Maaf, rincian proyek pernikahan yang Anda cari tidak ada atau telah dihapus.</p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full bg-[#1E1E1E] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Proyek
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Handle checking/unchecking tasks with persistence
  const handleToggleTask = (taskId: string) => {
    taskService.toggle(taskId).then((updatedTask) => {
      if (updatedTask) {
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updatedTask : task))
        );
      }
    });
  };

  // Scoped Payments (fallback to generated defaults if none exist)
  const finalPayments = payments.length > 0 ? payments : [
    { id: `pay-gen-1`, org_id: "org-001", project_id: id, type: "dp" as const, amount: project.budget_total * 0.3, status: "dibayar" as const, payment_date: "2026-02-15", notes: "Down payment 30% tervalidasi", created_at: new Date().toISOString() },
    { id: `pay-gen-2`, org_id: "org-001", project_id: id, type: "pelunasan" as const, amount: project.budget_total * 0.7, status: "menunggu" as const, due_date: project.wedding_date, notes: "Pelunasan sisa tagihan 70%", created_at: new Date().toISOString() }
  ];

  // Financial calculations
  const totalPaid = finalPayments
    .filter((p) => p.status === "dibayar")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = finalPayments
    .filter((p) => p.status === "menunggu" || p.status === "terlambat")
    .reduce((sum, p) => sum + p.amount, 0);

  // Scoped Timeline
  const projectTimeline = mockTimeline.filter((t) => t.project_id === id);
  const finalTimeline = projectTimeline.length > 0 ? projectTimeline : [
    { id: "gen-1", project_id: id, title: "Persiapan Pengantin Putri", description: `Sesi rias makeup, pemakaian gaun, dan persiapan awal untuk Kak ${project.bride_name}`, time: "06:00", location: "Suite Room Utama", pic: "Lina Permata", category: "preparation" },
    { id: "gen-2", project_id: id, title: `Pemberangkatan & Kehadiran Kak ${project.groom_name}`, description: `Penyambutan keluarga pengantin putra di area lobby utama venue`, time: "08:00", location: "Lobby Utama Hotel", pic: "Rizky Hidayat", category: "preparation" },
    { id: "gen-3", project_id: id, title: "Prosesi Akad Nikah / Sakral", description: `Prosesi sakral pernikahan disaksikan keluarga dan para saksi`, time: "09:00", location: "Grand Ballroom / Chapel", pic: "Sari Dewi Rahayu", category: "ceremony" },
    { id: "gen-4", project_id: id, title: "Sesi Foto Keluarga & Istirahat", description: `Sesi dokumentasi formal keluarga inti dan ganti pakaian resepsi`, time: "11:00", location: "Pelaminan Utama", pic: "Budi Santoso", category: "ceremony" },
    { id: "gen-5", project_id: id, title: "Resepsi Pernikahan", description: `Penyambutan tamu, hidangan katering bersama, live music, dan ucapan selamat`, time: "12:00", location: "Grand Ballroom", pic: "Sari Dewi Rahayu", category: "reception" },
    { id: "gen-6", project_id: id, title: "Penutupan & Foto Tim WO", description: `Penutupan resepsi, foto bersama seluruh panitia vendor, dan serah terima dokumen hantaran`, time: "15:00", location: "Grand Ballroom", pic: "Budi Santoso", category: "lainnya" },
  ];

  // Budget progress
  const progress = calculateProgress(project.budget_used, project.budget_total);

  // Assigned Staff Members Info
  const assignedStaffList = mockUsers.filter(u => project.assigned_staff.includes(u.id));

  return (
    <AppLayout>
      <div className="space-y-8 print:hidden">
        
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center gap-4 text-left">
          <Link 
            href="/projects" 
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#ECE7E1] text-[#666666] hover:text-[#1E1E1E] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Detail Proyek Pernikahan</span>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-xs text-[#666666]">Daftar Proyek</span>
              <ChevronRight className="h-3 w-3 text-[#ECE7E1]" />
              <span className="text-xs text-[#1E1E1E] font-semibold">{project.bride_name} & {project.groom_name}</span>
            </div>
          </div>
        </div>

        {/* Premium Profile Header Card */}
        <div className="rounded-2xl border border-[#ECE7E1] bg-white p-6 sm:p-8 text-left shadow-soft space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#ECE7E1] pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PROJECT_STATUS_COLORS[project.status]}`}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
                {project.tags?.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#FAF7F2] border border-[#ECE7E1] px-2.5 py-0.5 text-[10px] text-[#666666] font-medium uppercase tracking-wide">
                    #{tag}
                  </span>
                ))}
              </div>
              <h1 className="font-heading text-3xl font-bold text-[#1E1E1E] tracking-tight">
                Pernikahan {project.bride_name} & {project.groom_name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#666666] pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#D4AF37]" />
                  <span>{formatDate(project.wedding_date)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#D4AF37]" />
                  <span>{project.venue}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#D4AF37]" />
                  <span>{project.guest_count || 300} Tamu Undangan</span>
                </span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <a
                href={`https://api.whatsapp.com/send?phone=6281234567890&text=${encodeURIComponent(
                  `Halo Kak ${project.bride_name} & Kak ${project.groom_name}, ini asisten dari tim Amara WO. Persiapan pernikahan Kakak terus kami update di sistem, saat ini progres budget terpakai baru ${progress}%. Kakak bisa cek rundown dan kelengkapan tugas di link portal klien berikut ya. Terima kasih banyak!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <span>Hubungi Pengantin</span>
              </a>
            </div>
          </div>

          {/* Core Tab Switcher */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#ECE7E1]/50">
            {(["overview", "rundown", "keuangan", "checklist"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? "border-[#D4AF37] text-[#1E1E1E]" 
                    : "border-transparent text-[#666666] hover:text-[#1E1E1E]"
                }`}
              >
                {tab === "overview" && "Informasi Umum"}
                {tab === "rundown" && "Rundown Acara"}
                {tab === "keuangan" && "Keuangan & Kas"}
                {tab === "checklist" && `Checklist (${tasks.filter(t => t.status === "done").length}/${tasks.length})`}
              </button>
            ))}
          </div>

          {/* Sub-tab Content Area */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                    {/* Left Column (Main Specs) */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/30 p-5 space-y-4">
                        <div className="flex items-center gap-2 text-[#D4AF37]">
                          <Sparkles className="h-5 w-5" />
                          <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Tema & Rincian Konsep</h3>
                        </div>
                        <p className="font-serif italic text-[#1E1E1E] leading-relaxed text-base pl-1">
                          "{project.notes || "Tema modern elegant, nuansa premium & bersih."}"
                        </p>
                        <div className="border-t border-[#ECE7E1] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-xs text-[#666666] font-semibold uppercase">Alamat Lengkap Venue</span>
                            <p className="mt-1 text-[#1E1E1E] font-medium">{project.venue_address || "Gedung Utama, Jakarta"}</p>
                          </div>
                          <div>
                            <span className="text-xs text-[#666666] font-semibold uppercase">Batas Waktu Pelunasan WO</span>
                            <p className="mt-1 text-[#1E1E1E] font-medium">{formatDate(project.wedding_date)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Budget consumption stat */}
                      <div className="rounded-2xl border border-[#ECE7E1] p-5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-[#1E1E1E] uppercase tracking-wider">Pemakaian Anggaran Kontrak</span>
                          <span className="text-sm font-extrabold text-[#D4AF37]">{progress}% Terpakai</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-[#FAF7F2] border border-[#ECE7E1] overflow-hidden">
                          <div style={{ width: `${progress}%` }} className="h-full bg-[#D4AF37] rounded-full" />
                        </div>
                        <div className="flex justify-between text-xs text-[#666666] font-medium pt-0.5">
                          <span>Terpakai: <strong>{formatCurrency(project.budget_used)}</strong></span>
                          <span>Total Kontrak: <strong>{formatCurrency(project.budget_total)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (Team coordinators) */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">Koordinator Lapangan (WO)</h4>
                      <div className="space-y-3">
                        {assignedStaffList.length === 0 ? (
                          <div className="rounded-xl border border-[#ECE7E1] p-4 text-center">
                            <p className="text-xs text-[#666666]">Belum ada staf koordinator ditunjuk.</p>
                          </div>
                        ) : (
                          assignedStaffList.map((staff) => (
                            <div key={staff.id} className="flex items-center justify-between p-3.5 rounded-xl border border-[#ECE7E1] bg-white shadow-soft">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#FAF7F2] border border-[#ECE7E1] flex items-center justify-center text-[#D4AF37] font-bold text-xs">
                                  {staff.full_name[0]}
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-[#1E1E1E]">{staff.full_name}</p>
                                  <p className="text-[10px] text-[#666666] capitalize">{staff.role}</p>
                                </div>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                <UserCheck className="h-3 w-3" /> Online
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. RUNDOWN TAB */}
                {activeTab === "rundown" && (
                  <div className="space-y-6 pt-4 max-w-3xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Susunan Acara (Rundown) Pernikahan</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#ECE7E1] bg-white px-3.5 py-1.5 text-[10px] font-bold text-[#1E1E1E] uppercase hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                        >
                          <Receipt className="h-3.5 w-3.5 text-[#D4AF37]" /> Ekspor Rundown (PDF)
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-full bg-[#1E1E1E] px-3.5 py-1.5 text-[10px] font-bold text-white uppercase">
                          <Plus className="h-3.5 w-3.5" /> Tambah Jadwal
                        </button>
                      </div>
                    </div>

                    <div className="relative border-l-2 border-[#ECE7E1] ml-4 pl-6 space-y-8 py-2">
                      {finalTimeline.map((item) => (
                        <div key={item.id} className="relative">
                          {/* Circle stamp */}
                          <span className="absolute -left-10 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-[#D4AF37] text-[10px] font-bold text-[#1E1E1E] shadow-sm">
                            {item.time.split(":")[0]}
                          </span>

                          <div className="rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-soft hover:shadow-card transition-all space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#ECE7E1]/50 pb-2">
                              <h4 className="font-heading text-sm font-bold text-[#1E1E1E]">{item.title}</h4>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] border border-[#ECE7E1] px-2.5 py-0.5 text-[10px] font-semibold text-[#1E1E1E]">
                                <Clock className="h-3 w-3 text-[#D4AF37]" />
                                <span>{item.time} WIB</span>
                              </span>
                            </div>
                            <p className="text-xs text-[#666666] leading-relaxed">{item.description}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#666666] font-medium pt-1">
                              {item.location && <span>Lokasi: <strong>{item.location}</strong></span>}
                              {item.pic && <span>PIC: <strong>{item.pic}</strong></span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. KEUANGAN TAB */}
                {activeTab === "keuangan" && (
                  <div className="space-y-6 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Buku Kas & Riwayat Pembayaran</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#ECE7E1] bg-white px-3.5 py-1.5 text-[10px] font-bold text-[#1E1E1E] uppercase hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                        >
                          <Receipt className="h-3.5 w-3.5 text-[#D4AF37]" /> Cetak Invoice (PDF)
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-full bg-[#1E1E1E] px-3.5 py-1.5 text-[10px] font-bold text-white uppercase">
                          <Plus className="h-3.5 w-3.5" /> Catat Kas
                        </button>
                      </div>
                    </div>

                    {/* Stat indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-[#ECE7E1] bg-[#FAF7F2]/20 p-4">
                        <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Total Nilai Kontrak</span>
                        <p className="font-heading text-xl font-bold text-[#1E1E1E] mt-1">{formatCurrency(project.budget_total)}</p>
                      </div>
                      <div className="rounded-xl border border-[#ECE7E1] bg-emerald-50/20 p-4 border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Dana Masuk (DP)</span>
                        <p className="font-heading text-xl font-bold text-emerald-800 mt-1">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div className="rounded-xl border border-[#ECE7E1] bg-amber-50/20 p-4 border-amber-100">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Sisa Piutang Pending</span>
                        <p className="font-heading text-xl font-bold text-amber-800 mt-1">{formatCurrency(totalPending)}</p>
                      </div>
                    </div>

                    {/* Transactions table */}
                    <div className="overflow-hidden rounded-xl border border-[#ECE7E1] bg-white">
                      <table className="min-w-full divide-y divide-[#ECE7E1]">
                        <thead className="bg-[#FAF7F2]/50">
                          <tr>
                            <th scope="col" className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Jenis</th>
                            <th scope="col" className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Keterangan</th>
                            <th scope="col" className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Tanggal</th>
                            <th scope="col" className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Nominal</th>
                            <th scope="col" className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ECE7E1]">
                          {finalPayments.map((p) => {
                            const isPaid = p.status === "dibayar";
                            return (
                              <tr key={p.id} className="hover:bg-[#FAF7F2]/10 transition-colors">
                                <td className="whitespace-nowrap px-5 py-3.5 text-left text-xs">
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                    p.type === "dp" ? "bg-blue-50 text-blue-600" : "bg-[#EFD6D2] text-[#1E1E1E]"
                                  }`}>
                                    <Receipt className="h-3 w-3" /> {p.type}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-left text-xs font-semibold text-[#1E1E1E]">
                                  {p.notes || `Termin Pembayaran #${p.id.split("-")[1]}`}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-left text-xs text-[#666666]">
                                  {p.payment_date ? formatDate(p.payment_date) : p.due_date ? `Jatuh Tempo: ${formatDate(p.due_date)}` : "-"}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-bold text-[#1E1E1E]">
                                  {formatCurrency(p.amount)}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 text-left text-xs">
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                    isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {isPaid ? "Dibayar" : "Menunggu"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. CHECKLIST TAB */}
                {activeTab === "checklist" && (
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Tugas Persiapan Lapangan</h3>
                      <button className="inline-flex items-center gap-1 rounded-full bg-[#1E1E1E] px-3.5 py-1.5 text-[10px] font-bold text-white uppercase">
                        <Plus className="h-3.5 w-3.5" /> Tambah Tugas
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const isCompleted = task.status === "done";
                        return (
                          <div 
                            key={task.id} 
                            className={`flex items-start justify-between gap-4 rounded-xl border border-[#ECE7E1] p-4 text-left transition-all ${
                              isCompleted ? "bg-[#FAF7F2]/40 border-dashed" : "bg-white shadow-soft hover:shadow-card"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button 
                                onClick={() => handleToggleTask(task.id)}
                                className="mt-0.5 text-[#666666] hover:text-[#D4AF37] transition-colors shrink-0"
                              >
                                {isCompleted ? (
                                  <CheckSquare className="h-5 w-5 text-[#D4AF37]" />
                                ) : (
                                  <Square className="h-5 w-5" />
                                )}
                              </button>

                              <div className="space-y-0.5">
                                <p className={`text-xs font-bold ${isCompleted ? "line-through text-[#666666]/60 font-normal" : "text-[#1E1E1E]"}`}>
                                  {task.title}
                                </p>
                                <div className="flex flex-wrap gap-x-4 text-[9px] text-[#666666] font-medium pt-1">
                                  {task.due_date && <span>Batas: {task.due_date}</span>}
                                  {task.assignee_name && <span>PIC: {task.assignee_name}</span>}
                                </div>
                              </div>
                            </div>

                            <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold shrink-0 uppercase tracking-wider ${TASK_PRIORITY_COLORS[task.priority]}`}>
                              {TASK_PRIORITY_LABELS[task.priority]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* PREMIUM PRINTABLE A4 SHEETS (VISIBLE ONLY ON PRINT) */}
      {/* ============================================================ */}
      <div className="hidden print:block font-sans text-left text-black p-8 bg-white max-w-4xl mx-auto space-y-10">
        
        {/* A. PRINTABLE RUNDOWN SHEET */}
        {activeTab === "rundown" && (
          <div className="space-y-6">
            {/* Invoice-like Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight uppercase">Wedora Wedding Planner</h1>
                <p className="text-xs text-gray-500 mt-1">Layanan Perencana Pernikahan Premium & Terpercaya</p>
              </div>
              <div className="text-right">
                <span className="inline-block border border-black px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  Official Rundown Sheet
                </span>
                <p className="text-xs text-gray-500 mt-1">Dicetak pada {new Date().toLocaleDateString("id-ID")}</p>
              </div>
            </div>

            {/* Event Specs */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-200 pb-4">
              <div>
                <span className="text-gray-500 block uppercase font-bold text-[10px]">Nama Klien</span>
                <p className="text-sm font-bold text-black">Pernikahan {project.bride_name} & {project.groom_name}</p>
              </div>
              <div>
                <span className="text-gray-500 block uppercase font-bold text-[10px]">Tanggal Pernikahan</span>
                <p className="text-sm font-bold text-black">{formatDate(project.wedding_date)}</p>
              </div>
              <div>
                <span className="text-gray-500 block uppercase font-bold text-[10px]">Lokasi Acara</span>
                <p className="text-sm font-bold text-black">{project.venue}</p>
              </div>
              <div>
                <span className="text-gray-500 block uppercase font-bold text-[10px]">Tamu Undangan</span>
                <p className="text-sm font-bold text-black">{project.guest_count || 300} Tamu</p>
              </div>
            </div>

            {/* Rundown Table */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-1">Susunan Acara Detil</h3>
              <table className="min-w-full divide-y divide-black text-xs">
                <thead>
                  <tr className="border-b border-black font-bold text-left">
                    <th className="py-2 pr-4 w-20">Waktu</th>
                    <th className="py-2 px-4 w-48">Agenda/Acara</th>
                    <th className="py-2 px-4 w-32">Lokasi</th>
                    <th className="py-2 px-4 w-32">PIC Koordinator</th>
                    <th className="py-2 pl-4">Deskripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {finalTimeline.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-3 pr-4 font-bold">{item.time} WIB</td>
                      <td className="py-3 px-4 font-bold">{item.title}</td>
                      <td className="py-3 px-4">{item.location || "-"}</td>
                      <td className="py-3 px-4 font-medium">{item.pic || "-"}</td>
                      <td className="py-3 pl-4 text-gray-600 leading-relaxed">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-10 pt-20 text-xs text-center">
              <div>
                <p className="text-gray-500">Disiapkan oleh,</p>
                <div className="h-16"></div>
                <p className="font-bold border-t border-black pt-1 w-48 mx-auto">Sari Dewi Rahayu</p>
                <p className="text-gray-500">Wedding Planner Lead</p>
              </div>
              <div>
                <p className="text-gray-500">Pihak Pengantin,</p>
                <div className="h-16"></div>
                <p className="font-bold border-t border-black pt-1 w-48 mx-auto">Kak {project.bride_name} / Kak {project.groom_name}</p>
                <p className="text-gray-500">Mempelai Klien</p>
              </div>
            </div>
          </div>
        )}

        {/* B. PRINTABLE INVOICE SHEET */}
        {activeTab === "keuangan" && (
          <div className="space-y-6">
            {/* Invoice-like Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight uppercase">Wedora Wedding Planner</h1>
                <p className="text-xs text-gray-500 mt-1">Layanan Perencana Pernikahan Premium & Terpercaya</p>
              </div>
              <div className="text-right">
                <span className="inline-block border border-black px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  Official Wedding Invoice
                </span>
                <p className="text-xs text-gray-500 mt-1">No: INV/WD/{project.id.split("-")[1]?.toUpperCase() || "001"}</p>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-200 pb-4">
              <div>
                <span className="text-gray-500 block uppercase font-bold text-[10px]">Ditagihkan Kepada</span>
                <p className="text-sm font-bold text-black">Pernikahan {project.bride_name} & {project.groom_name}</p>
                <p className="text-gray-500 mt-1">Venue: {project.venue}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block uppercase font-bold text-[10px]">Rincian Penagihan</span>
                <p className="text-sm font-bold text-black">Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
                <p className="text-sm font-bold text-emerald-700 uppercase mt-1">
                  Status WO: {totalPending === 0 ? "Lunas" : "Sebagian Dibayar"}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-1">Rincian Layanan Kontrak</h3>
              <table className="min-w-full divide-y divide-black text-xs">
                <thead>
                  <tr className="border-b border-black font-bold text-left">
                    <th className="py-2 pr-4">Deskripsi Layanan</th>
                    <th className="py-2 px-4 text-right">Tanggal Transaksi</th>
                    <th className="py-2 px-4 text-center">Status</th>
                    <th className="py-2 pl-4 text-right w-40">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {finalPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-4 font-bold">
                        {p.notes || `${p.type.toUpperCase()} Paket Pernikahan`}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {p.payment_date ? formatDate(p.payment_date) : p.due_date ? `Jatuh Tempo: ${formatDate(p.due_date)}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase ${
                          p.status === "dibayar" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right font-bold text-black">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Calculation Grid */}
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2 text-xs border-t border-black pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Nilai Kontrak:</span>
                  <span className="font-bold text-black">{formatCurrency(project.budget_total)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Total Telah Dibayar (DP):</span>
                  <span className="font-bold">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-black">
                  <span>Sisa Pembayaran (Piutang):</span>
                  <span>{formatCurrency(totalPending)}</span>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 text-[10px] text-gray-600 leading-relaxed">
              <p className="font-bold text-black uppercase text-[11px] mb-1">Instruksi Pembayaran & Transfer:</p>
              <p>Seluruh pelunasan sisa penagihan wajib diserahkan paling lambat H-14 sebelum hari pernikahan klien melalui transfer rekening resmi agensi:</p>
              <p className="mt-1.5 font-bold text-black">Bank BCA - No. Rekening: 123-456-7890 (a.n. PT Wedora Kreatif Nusantara)</p>
              <p className="mt-1">Kirim bukti pembayaran sah via WhatsApp ke narahubung koordinator lapangan utama Anda.</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-10 pt-16 text-xs text-center">
              <div>
                <p className="text-gray-500">Hormat Kami (Planner Lead),</p>
                <div className="h-16"></div>
                <p className="font-bold border-t border-black pt-1 w-48 mx-auto">Sari Dewi Rahayu</p>
                <p className="text-gray-500">PT Wedora Kreatif Nusantara</p>
              </div>
              <div>
                <p className="text-gray-500">Disetujui oleh (Klien),</p>
                <div className="h-16"></div>
                <p className="font-bold border-t border-black pt-1 w-48 mx-auto">Kak {project.bride_name} & {project.groom_name}</p>
                <p className="text-gray-500">Mempelai Klien</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
