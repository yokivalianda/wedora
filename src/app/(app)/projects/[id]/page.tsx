"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { projectService, taskService, paymentService, timelineService, documentService, userService } from "@/lib/services";
import { WeddingProject, Task, Payment, TimelineEvent, Document, User } from "@/types";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  calculateProgress
} from "@/lib/utils";
import {
  ArrowLeft, Calendar, MapPin, Users, Clock, Plus, ChevronRight,
  CheckSquare, Square, Sparkles, Info, Receipt, UserCheck, Trash2, Pencil,
  X, FileText, Image as ImageIcon, ArrowUpRight, FolderOpen,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [project, setProject] = useState<WeddingProject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"overview" | "rundown" | "keuangan" | "checklist" | "dokumen">("overview");

  // ── EDIT PROJECT MODAL ──────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBrideName, setEditBrideName] = useState("");
  const [editGroomName, setEditGroomName] = useState("");
  const [editWeddingDate, setEditWeddingDate] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editGuestCount, setEditGuestCount] = useState("");
  const [editBudgetTotal, setEditBudgetTotal] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<string>("planning");
  const [editAssignedStaff, setEditAssignedStaff] = useState<string[]>([]);

  // ── TAMBAH JADWAL (RUNDOWN) MODAL ───────────────────────────────
  const [isRundownModalOpen, setIsRundownModalOpen] = useState(false);
  const [rundownTitle, setRundownTitle] = useState("");
  const [rundownTime, setRundownTime] = useState("");
  const [rundownLocation, setRundownLocation] = useState("");
  const [rundownPic, setRundownPic] = useState("");
  const [rundownDesc, setRundownDesc] = useState("");
  const [rundownCategory, setRundownCategory] = useState<"ceremony" | "reception" | "preparation" | "vendor" | "lainnya">("lainnya");
  const [isRundownSubmitting, setIsRundownSubmitting] = useState(false);

  // ── TAMBAH TUGAS (CHECKLIST) MODAL ──────────────────────────────
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDesc, setTaskDesc] = useState("");
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  // ── CATAT KAS (KEUANGAN) MODAL ──────────────────────────────────
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"dp" | "pelunasan" | "vendor" | "pengeluaran">("dp");
  const [paymentStatus, setPaymentStatus] = useState<"menunggu" | "dibayar">("menunggu");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      projectService.getById(id),
      taskService.getAll(),
      paymentService.getAll(),
      timelineService.getAll(id),
      documentService.getAll(),
      userService.getAll(),
    ]).then(([projData, taskData, payData, timelineData, docData, userData]) => {
      setProject(projData);
      setTasks(taskData.filter((t) => t.project_id === id));
      setPayments(payData.filter((p) => p.project_id === id));
      setTimelineEvents(timelineData);
      setDocuments(docData.filter((d) => d.project_id === id));
      setOrgUsers(userData);
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

  // ── TOGGLE TASK ─────────────────────────────────────────────────
  const handleToggleTask = (taskId: string) => {
    taskService.toggle(taskId).then((updatedTask) => {
      if (updatedTask) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      }
    });
  };

  // ── DELETE TASK ─────────────────────────────────────────────────
  const handleDeleteTask = (taskId: string) => {
    if (!confirm("Hapus tugas ini?")) return;
    taskService.delete(taskId).then(() => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    });
  };

  // ── DELETE TIMELINE ─────────────────────────────────────────────
  const handleDeleteTimeline = (eventId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return;
    timelineService.delete(eventId).then(() => {
      setTimelineEvents((prev) => prev.filter((e) => e.id !== eventId));
    });
  };

  // ── DELETE PAYMENT ──────────────────────────────────────────────
  const handleDeletePayment = (payId: string) => {
    if (!confirm("Hapus catatan kas ini?")) return;
    paymentService.delete(payId).then(() => {
      setPayments((prev) => prev.filter((p) => p.id !== payId));
    });
  };

  // ── OPEN EDIT MODAL ─────────────────────────────────────────────
  const handleOpenEditModal = () => {
    if (!project) return;
    setEditBrideName(project.bride_name);
    setEditGroomName(project.groom_name);
    setEditWeddingDate(project.wedding_date);
    setEditVenue(project.venue);
    setEditGuestCount(String(project.guest_count || ""));
    setEditBudgetTotal(String(project.budget_total));
    setEditNotes(project.notes || "");
    setEditStatus(project.status);
    setEditAssignedStaff(project.assigned_staff || []);
    setIsEditModalOpen(true);
  };

  const handleToggleEditStaff = (userId: string) => {
    setEditAssignedStaff((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // ── SUBMIT EDIT ─────────────────────────────────────────────────
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    projectService.update(project.id, {
      bride_name: editBrideName,
      groom_name: editGroomName,
      wedding_date: editWeddingDate,
      venue: editVenue,
      guest_count: editGuestCount ? Number(editGuestCount) : undefined,
      budget_total: Number(editBudgetTotal),
      notes: editNotes,
      status: editStatus as any,
      assigned_staff: editAssignedStaff,
    }).then((updated) => {
      if (updated) setProject(updated);
      setIsEditModalOpen(false);
    });
  };

  // ── SUBMIT RUNDOWN ──────────────────────────────────────────────
  const handleRundownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rundownTitle || !rundownTime) return;
    setIsRundownSubmitting(true);
    try {
      const newEvent: TimelineEvent = {
        id: `tl-gen-${Date.now()}`,
        project_id: id,
        title: rundownTitle,
        description: rundownDesc || undefined,
        time: rundownTime,
        location: rundownLocation || undefined,
        pic: rundownPic || undefined,
        category: rundownCategory,
        created_at: new Date().toISOString(),
      };
      const saved = await timelineService.create(newEvent);
      setTimelineEvents((prev) => [...prev, saved].sort((a, b) => a.time.localeCompare(b.time)));
      setRundownTitle(""); setRundownTime(""); setRundownLocation("");
      setRundownPic(""); setRundownDesc(""); setRundownCategory("lainnya");
      setIsRundownModalOpen(false);
    } finally {
      setIsRundownSubmitting(false);
    }
  };

  // ── SUBMIT TASK ─────────────────────────────────────────────────
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    setIsTaskSubmitting(true);
    try {
      const newTask: Task = {
        id: `task-gen-${Date.now()}`,
        org_id: null,
        project_id: id,
        title: taskTitle,
        description: taskDesc || undefined,
        assignee_name: taskAssignee || undefined,
        due_date: taskDueDate || undefined,
        status: "todo",
        priority: taskPriority,
        created_at: new Date().toISOString(),
      };
      const saved = await taskService.create(newTask);
      setTasks((prev) => [saved, ...prev]);
      setTaskTitle(""); setTaskAssignee(""); setTaskDueDate("");
      setTaskPriority("medium"); setTaskDesc("");
      setIsTaskModalOpen(false);
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  // ── SUBMIT PAYMENT ──────────────────────────────────────────────
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount) return;
    setIsPaymentSubmitting(true);
    try {
      const newPayment: Payment = {
        id: `pay-gen-${Date.now()}`,
        org_id: null,
        project_id: id,
        type: paymentType,
        amount: Number(paymentAmount),
        status: paymentStatus,
        payment_date: paymentDate || undefined,
        due_date: paymentDueDate || undefined,
        notes: paymentNotes || undefined,
        created_at: new Date().toISOString(),
      };
      const saved = await paymentService.create(newPayment);
      setPayments((prev) => [saved, ...prev]);
      setPaymentNotes(""); setPaymentAmount(""); setPaymentType("dp");
      setPaymentStatus("menunggu"); setPaymentDate(""); setPaymentDueDate("");
      setIsPaymentModalOpen(false);
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  // ── COMPUTED ────────────────────────────────────────────────────
  const assignedStaffList = orgUsers.filter((u) => project.assigned_staff.includes(u.id));
  const finalPayments = payments;
  const totalPaid = finalPayments.filter((p) => p.status === "dibayar").reduce((s, p) => s + p.amount, 0);
  const totalPending = finalPayments.filter((p) => p.status === "menunggu" || p.status === "terlambat").reduce((s, p) => s + p.amount, 0);
  const finalTimeline = [...timelineEvents].sort((a, b) => a.time.localeCompare(b.time));
  const progress = calculateProgress(project.budget_used, project.budget_total);

  // WhatsApp: ambil nomor dari koordinator pertama jika ada, fallback ke default
  const firstCoordinatorPhone = assignedStaffList.find((u) => (u as any).phone)
    ? (assignedStaffList.find((u) => (u as any).phone) as any).phone?.replace(/\D/g, "").replace(/^0/, "62")
    : null;
  const waPhone = firstCoordinatorPhone || "6281234567890";
  const waMessage = encodeURIComponent(
    `Halo Kak ${project.bride_name} & Kak ${project.groom_name}, ini asisten dari tim Amara WO. Persiapan pernikahan Kakak terus kami update di sistem, saat ini progres budget terpakai baru ${progress}%. Terima kasih banyak!`
  );


  return (
    <AppLayout>
      <div className="space-y-8 print:hidden">

        {/* Breadcrumb */}
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

        {/* Header Card */}
        <div className="rounded-2xl border border-[#ECE7E1] bg-white p-6 sm:p-8 text-left shadow-soft space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#ECE7E1] pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
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
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-[#D4AF37]" />{formatDate(project.wedding_date)}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#D4AF37]" />{project.venue}</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-[#D4AF37]" />{project.guest_count || 300} Tamu Undangan</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleOpenEditModal}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs font-semibold text-[#1E1E1E] hover:bg-[#FAF7F2] transition-colors"
              >
                <Pencil className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Edit</span>
              </button>
              <a
                href={`https://api.whatsapp.com/send?phone=${waPhone}&text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <span>Hubungi Pengantin</span>
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#ECE7E1]/50">
            {(["overview", "rundown", "keuangan", "checklist", "dokumen"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab ? "border-[#D4AF37] text-[#1E1E1E]" : "border-transparent text-[#666666] hover:text-[#1E1E1E]"
                }`}
              >
                {tab === "overview" && "Informasi Umum"}
                {tab === "rundown" && "Rundown Acara"}
                {tab === "keuangan" && "Keuangan & Kas"}
                {tab === "checklist" && `Checklist (${tasks.filter(t => t.status === "done").length}/${tasks.length})`}
                {tab === "dokumen" && `Dokumen (${documents.length})`}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >


                {/* ── OVERVIEW TAB ── */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
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
                            <p className="mt-1 text-[#1E1E1E] font-medium">{project.venue_address || "—"}</p>
                          </div>
                          <div>
                            <span className="text-xs text-[#666666] font-semibold uppercase">Tanggal Pernikahan</span>
                            <p className="mt-1 text-[#1E1E1E] font-medium">{formatDate(project.wedding_date)}</p>
                          </div>
                        </div>
                      </div>

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
                          <span>Total: <strong>{formatCurrency(project.budget_total)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Koordinator Lapangan — DINAMIS */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">Koordinator Lapangan (WO)</h4>
                      <div className="space-y-3">
                        {assignedStaffList.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-[#ECE7E1] p-5 text-center space-y-2">
                            <p className="text-xs text-[#666666]">Belum ada koordinator ditunjuk.</p>
                            <button
                              onClick={handleOpenEditModal}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] hover:underline"
                            >
                              <Plus className="h-3 w-3" /> Tambah koordinator
                            </button>
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
                                  {(staff as any).phone && (
                                    <p className="text-[10px] text-[#999]">{(staff as any).phone}</p>
                                  )}
                                </div>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                <UserCheck className="h-3 w-3" /> Aktif
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      {assignedStaffList.length > 0 && (
                        <button
                          onClick={handleOpenEditModal}
                          className="w-full rounded-xl border border-dashed border-[#ECE7E1] py-2 text-[10px] font-bold text-[#666666] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-1"
                        >
                          <Pencil className="h-3 w-3" /> Ubah Koordinator
                        </button>
                      )}
                    </div>
                  </div>
                )}


                {/* ── RUNDOWN TAB ── */}
                {activeTab === "rundown" && (
                  <div className="space-y-6 pt-4 max-w-3xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Susunan Acara (Rundown) Pernikahan</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#ECE7E1] bg-white px-3.5 py-1.5 text-[10px] font-bold text-[#1E1E1E] uppercase hover:bg-[#FAF7F2] transition-colors"
                        >
                          <Receipt className="h-3.5 w-3.5 text-[#D4AF37]" /> Ekspor PDF
                        </button>
                        <button
                          onClick={() => setIsRundownModalOpen(true)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#1E1E1E] px-3.5 py-1.5 text-[10px] font-bold text-white uppercase"
                        >
                          <Plus className="h-3.5 w-3.5" /> Tambah Jadwal
                        </button>
                      </div>
                    </div>

                    {finalTimeline.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#ECE7E1] p-10 text-center space-y-3">
                        <Clock className="h-8 w-8 text-[#ECE7E1] mx-auto" />
                        <p className="text-sm text-[#666666]">Belum ada jadwal rundown.</p>
                        <button
                          onClick={() => setIsRundownModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2 text-xs font-semibold text-white"
                        >
                          <Plus className="h-3.5 w-3.5" /> Tambah Jadwal Pertama
                        </button>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-[#ECE7E1] ml-4 pl-6 space-y-8 py-2">
                        {finalTimeline.map((item) => (
                          <div key={item.id} className="relative">
                            <span className="absolute -left-10 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-[#D4AF37] text-[10px] font-bold text-[#1E1E1E] shadow-sm">
                              {item.time.split(":")[0]}
                            </span>
                            <div className="rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-soft hover:shadow-card transition-all space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#ECE7E1]/50 pb-2">
                                <h4 className="font-heading text-sm font-bold text-[#1E1E1E]">{item.title}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] border border-[#ECE7E1] px-2.5 py-0.5 text-[10px] font-semibold text-[#1E1E1E]">
                                    <Clock className="h-3 w-3 text-[#D4AF37]" />{item.time} WIB
                                  </span>
                                  <button onClick={() => handleDeleteTimeline(item.id)} className="text-[#666666] hover:text-rose-500 transition-colors" title="Hapus">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              {item.description && <p className="text-xs text-[#666666] leading-relaxed">{item.description}</p>}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#666666] font-medium pt-1">
                                {item.location && <span>Lokasi: <strong>{item.location}</strong></span>}
                                {item.pic && <span>PIC: <strong>{item.pic}</strong></span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}


                {/* ── KEUANGAN TAB ── */}
                {activeTab === "keuangan" && (
                  <div className="space-y-6 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Buku Kas & Riwayat Pembayaran</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#ECE7E1] bg-white px-3.5 py-1.5 text-[10px] font-bold text-[#1E1E1E] uppercase hover:bg-[#FAF7F2] transition-colors"
                        >
                          <Receipt className="h-3.5 w-3.5 text-[#D4AF37]" /> Cetak Invoice (PDF)
                        </button>
                        <button
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#1E1E1E] px-3.5 py-1.5 text-[10px] font-bold text-white uppercase"
                        >
                          <Plus className="h-3.5 w-3.5" /> Catat Kas
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-[#ECE7E1] bg-[#FAF7F2]/20 p-4">
                        <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Total Nilai Kontrak</span>
                        <p className="font-heading text-xl font-bold text-[#1E1E1E] mt-1">{formatCurrency(project.budget_total)}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Dana Masuk (DP)</span>
                        <p className="font-heading text-xl font-bold text-emerald-800 mt-1">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-4">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Sisa Piutang Pending</span>
                        <p className="font-heading text-xl font-bold text-amber-800 mt-1">{formatCurrency(totalPending)}</p>
                      </div>
                    </div>

                    {finalPayments.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#ECE7E1] p-10 text-center space-y-3">
                        <Receipt className="h-8 w-8 text-[#ECE7E1] mx-auto" />
                        <p className="text-sm text-[#666666]">Belum ada catatan kas untuk proyek ini.</p>
                        <button
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2 text-xs font-semibold text-white"
                        >
                          <Plus className="h-3.5 w-3.5" /> Catat Transaksi Pertama
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-[#ECE7E1] bg-white">
                        <table className="min-w-full divide-y divide-[#ECE7E1]">
                          <thead className="bg-[#FAF7F2]/50">
                            <tr>
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Jenis</th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Keterangan</th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Tanggal</th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Nominal</th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]">Status</th>
                              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ECE7E1]">
                            {finalPayments.map((p) => {
                              const isPaid = p.status === "dibayar";
                              return (
                                <tr key={p.id} className="hover:bg-[#FAF7F2]/10 transition-colors">
                                  <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                      p.type === "dp" ? "bg-blue-50 text-blue-600" : p.type === "pengeluaran" ? "bg-rose-50 text-rose-600" : "bg-[#EFD6D2] text-[#1E1E1E]"
                                    }`}>
                                      <Receipt className="h-3 w-3" /> {p.type}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-xs font-semibold text-[#1E1E1E]">
                                    {p.notes || `Termin Pembayaran`}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#666666]">
                                    {p.payment_date ? formatDate(p.payment_date) : p.due_date ? `Jatuh Tempo: ${formatDate(p.due_date)}` : "—"}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-3.5 text-xs font-bold text-[#1E1E1E]">
                                    {formatCurrency(p.amount)}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                      isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                    }`}>
                                      {isPaid ? "Dibayar" : "Menunggu"}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-xs">
                                    <button onClick={() => handleDeletePayment(p.id)} className="text-[#666666] hover:text-rose-500 transition-colors">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}


                {/* ── CHECKLIST TAB ── */}
                {activeTab === "checklist" && (
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Tugas Persiapan Lapangan</h3>
                      <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#1E1E1E] px-3.5 py-1.5 text-[10px] font-bold text-white uppercase"
                      >
                        <Plus className="h-3.5 w-3.5" /> Tambah Tugas
                      </button>
                    </div>

                    {tasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#ECE7E1] p-10 text-center space-y-3">
                        <CheckSquare className="h-8 w-8 text-[#ECE7E1] mx-auto" />
                        <p className="text-sm text-[#666666]">Belum ada tugas untuk proyek ini.</p>
                        <button
                          onClick={() => setIsTaskModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2 text-xs font-semibold text-white"
                        >
                          <Plus className="h-3.5 w-3.5" /> Tambah Tugas Pertama
                        </button>
                      </div>
                    ) : (
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
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <button
                                  onClick={() => handleToggleTask(task.id)}
                                  className="mt-0.5 text-[#666666] hover:text-[#D4AF37] transition-colors shrink-0"
                                >
                                  {isCompleted ? <CheckSquare className="h-5 w-5 text-[#D4AF37]" /> : <Square className="h-5 w-5" />}
                                </button>
                                <div className="space-y-0.5 min-w-0">
                                  <p className={`text-xs font-bold truncate ${isCompleted ? "line-through text-[#666666]/60 font-normal" : "text-[#1E1E1E]"}`}>
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-[10px] text-[#666666] leading-snug">{task.description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-x-4 text-[9px] text-[#666666] font-medium pt-1">
                                    {task.due_date && <span>Batas: {task.due_date}</span>}
                                    {task.assignee_name && <span>PIC: {task.assignee_name}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${TASK_PRIORITY_COLORS[task.priority]}`}>
                                  {TASK_PRIORITY_LABELS[task.priority]}
                                </span>
                                <button onClick={() => handleDeleteTask(task.id)} className="text-[#666666] hover:text-rose-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}


                {/* ── DOKUMEN TAB ── */}
                {activeTab === "dokumen" && (
                  <div className="space-y-5 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Berkas & Dokumen Proyek</h3>
                      <Link
                        href="/documents"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs font-semibold text-[#1E1E1E] hover:bg-[#FAF7F2] transition-colors"
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-[#D4AF37]" />
                        Kelola Semua Dokumen
                      </Link>
                    </div>

                    {documents.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-10 text-center space-y-3">
                        <div className="flex justify-center">
                          <div className="rounded-xl bg-[#FAF7F2] p-4 border border-[#ECE7E1] text-[#D4AF37]">
                            <FolderOpen className="h-7 w-7" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-[#666666]">Belum ada dokumen untuk proyek ini.</p>
                        <p className="text-xs text-[#666666]/70">Unggah kontrak, moodboard, atau invoice dari halaman Dokumen.</p>
                        <Link
                          href="/documents"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2 text-xs font-semibold text-white hover:scale-[1.01] transition-transform"
                        >
                          <Plus className="h-3.5 w-3.5" /> Unggah Dokumen
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => {
                          const isImage = doc.type === "foto" || doc.type === "moodboard";
                          return (
                            <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-[#ECE7E1] bg-white shadow-soft hover:shadow-card transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="rounded-lg bg-[#FAF7F2] p-2.5 border border-[#ECE7E1] text-[#D4AF37] shrink-0">
                                  {isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-[#1E1E1E] truncate max-w-[180px] sm:max-w-xs">{doc.name}</p>
                                  <p className="text-[10px] text-[#666666] mt-0.5">
                                    {doc.category || doc.type}{doc.size ? ` • ${doc.size}` : ""} • {formatDateShort(doc.created_at)}
                                  </p>
                                  {doc.uploaded_by && (
                                    <p className="text-[10px] text-[#999] mt-0.5">Oleh: <span className="font-medium text-[#666666]">{doc.uploaded_by}</span></p>
                                  )}
                                </div>
                              </div>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#ECE7E1] text-[#666666] hover:text-[#1E1E1E] hover:border-[#1E1E1E] transition-colors"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: EDIT PROYEK                                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-2xl border border-[#ECE7E1] bg-white shadow-elevated z-10"
            >
              <div className="flex items-center justify-between border-b border-[#ECE7E1] px-6 py-4 sticky top-0 bg-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Edit Proyek Pernikahan</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="rounded-full p-1 text-[#666666] hover:bg-[#FAF7F2]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nama Mempelai Wanita</label>
                    <input type="text" required value={editBrideName} onChange={(e) => setEditBrideName(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nama Mempelai Pria</label>
                    <input type="text" required value={editGroomName} onChange={(e) => setEditGroomName(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Tanggal Pernikahan</label>
                    <input type="date" required value={editWeddingDate} onChange={(e) => setEditWeddingDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Jumlah Tamu</label>
                    <input type="number" value={editGuestCount} onChange={(e) => setEditGuestCount(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Venue</label>
                  <input type="text" required value={editVenue} onChange={(e) => setEditVenue(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Total Anggaran (IDR)</label>
                    <input type="number" required value={editBudgetTotal} onChange={(e) => setEditBudgetTotal(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Status Proyek</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]">
                      <option value="inquiry">Inquiry</option>
                      <option value="planning">Perencanaan</option>
                      <option value="dp_paid">DP Paid</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Selesai</option>
                    </select>
                  </div>
                </div>

                {/* Koordinator Lapangan — DINAMIS */}
                {orgUsers.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                      Koordinator Lapangan (Tim WO)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {orgUsers.map((u) => {
                        const isSelected = editAssignedStaff.includes(u.id);
                        return (
                          <button key={u.id} type="button" onClick={() => handleToggleEditStaff(u.id)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                              isSelected ? "border-[#D4AF37] bg-[#FAF7F2] text-[#1E1E1E]" : "border-[#ECE7E1] bg-white text-[#666666] hover:border-[#D4AF37]/50"
                            }`}
                          >
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected ? "bg-[#D4AF37] text-white" : "bg-[#FAF7F2] text-[#D4AF37] border border-[#ECE7E1]"
                            }`}>
                              {u.full_name[0]}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold leading-tight">{u.full_name}</p>
                              <p className="text-[9px] capitalize text-[#999]">{u.role}</p>
                            </div>
                            {isSelected && <UserCheck className="h-3.5 w-3.5 text-[#D4AF37] ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Catatan / Tema</label>
                  <textarea rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                    className="mt-1.5 block w-full rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2.5 text-xs focus:border-[#D4AF37] focus:outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-2 border-t border-[#ECE7E1] pt-4 mt-2">
                  <button type="button" onClick={() => setIsEditModalOpen(false)}
                    className="rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs font-semibold text-[#666666] hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                    Batal
                  </button>
                  <button type="submit"
                    className="rounded-full bg-[#1E1E1E] px-5 py-2 text-xs font-semibold text-white hover:scale-[1.01] transition-transform flex items-center gap-1.5 cursor-pointer">
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: TAMBAH JADWAL RUNDOWN                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isRundownModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsRundownModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-y-auto max-h-[90vh] rounded-2xl border border-[#ECE7E1] bg-white shadow-elevated z-10"
            >
              <div className="flex items-center justify-between border-b border-[#ECE7E1] px-6 py-4 sticky top-0 bg-white">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Tambah Jadwal Rundown</h3>
                </div>
                <button onClick={() => setIsRundownModalOpen(false)} className="rounded-full p-1 text-[#666666] hover:bg-[#FAF7F2]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleRundownSubmit} className="p-6 space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nama Acara / Agenda <span className="text-rose-500">*</span></label>
                  <input type="text" required placeholder="Contoh: Akad Nikah" value={rundownTitle} onChange={(e) => setRundownTitle(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Waktu (WIB) <span className="text-rose-500">*</span></label>
                    <input type="time" required value={rundownTime} onChange={(e) => setRundownTime(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Kategori</label>
                    <select value={rundownCategory} onChange={(e) => setRundownCategory(e.target.value as any)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]">
                      <option value="preparation">Persiapan</option>
                      <option value="ceremony">Prosesi</option>
                      <option value="reception">Resepsi</option>
                      <option value="vendor">Vendor</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Lokasi</label>
                  <input type="text" placeholder="Contoh: Ballroom A, Lantai 2" value={rundownLocation} onChange={(e) => setRundownLocation(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">PIC / Koordinator</label>
                  <select value={rundownPic} onChange={(e) => setRundownPic(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]">
                    <option value="">— Pilih koordinator —</option>
                    {orgUsers.map((u) => (
                      <option key={u.id} value={u.full_name}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Deskripsi / Keterangan</label>
                  <textarea rows={2} placeholder="Catatan tambahan untuk acara ini..." value={rundownDesc} onChange={(e) => setRundownDesc(e.target.value)}
                    className="mt-1.5 block w-full rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2.5 text-xs focus:border-[#D4AF37] focus:outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-2 border-t border-[#ECE7E1] pt-4">
                  <button type="button" onClick={() => setIsRundownModalOpen(false)}
                    className="rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs font-semibold text-[#666666] hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                    Batal
                  </button>
                  <button type="submit" disabled={isRundownSubmitting}
                    className="rounded-full bg-[#1E1E1E] px-5 py-2 text-xs font-semibold text-white hover:scale-[1.01] transition-transform disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                    {isRundownSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: TAMBAH TUGAS CHECKLIST                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-y-auto max-h-[90vh] rounded-2xl border border-[#ECE7E1] bg-white shadow-elevated z-10"
            >
              <div className="flex items-center justify-between border-b border-[#ECE7E1] px-6 py-4 sticky top-0 bg-white">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Tambah Tugas</h3>
                </div>
                <button onClick={() => setIsTaskModalOpen(false)} className="rounded-full p-1 text-[#666666] hover:bg-[#FAF7F2]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleTaskSubmit} className="p-6 space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nama Tugas <span className="text-rose-500">*</span></label>
                  <input type="text" required placeholder="Contoh: Konfirmasi menu katering" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Batas Tanggal</label>
                    <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Prioritas</label>
                    <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]">
                      <option value="low">Rendah</option>
                      <option value="medium">Sedang</option>
                      <option value="high">Tinggi</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">PIC / Penanggung Jawab</label>
                  <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]">
                    <option value="">— Pilih koordinator —</option>
                    {orgUsers.map((u) => (
                      <option key={u.id} value={u.full_name}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Deskripsi</label>
                  <textarea rows={2} placeholder="Catatan tambahan..." value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}
                    className="mt-1.5 block w-full rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2.5 text-xs focus:border-[#D4AF37] focus:outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-2 border-t border-[#ECE7E1] pt-4">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)}
                    className="rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs font-semibold text-[#666666] hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                    Batal
                  </button>
                  <button type="submit" disabled={isTaskSubmitting}
                    className="rounded-full bg-[#1E1E1E] px-5 py-2 text-xs font-semibold text-white hover:scale-[1.01] transition-transform disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                    {isTaskSubmitting ? "Menyimpan..." : "Simpan Tugas"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: CATAT KAS / PEMBAYARAN                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-y-auto max-h-[90vh] rounded-2xl border border-[#ECE7E1] bg-white shadow-elevated z-10"
            >
              <div className="flex items-center justify-between border-b border-[#ECE7E1] px-6 py-4 sticky top-0 bg-white">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Catat Kas / Transaksi</h3>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="rounded-full p-1 text-[#666666] hover:bg-[#FAF7F2]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nominal (IDR) <span className="text-rose-500">*</span></label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-[#666666] font-bold">Rp</span>
                    <input type="number" required placeholder="Contoh: 75000000" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                      className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 py-2 pl-9 pr-4 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Jenis Transaksi</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]">
                      <option value="dp">DP (Down Payment)</option>
                      <option value="pelunasan">Pelunasan</option>
                      <option value="vendor">Pembayaran Vendor</option>
                      <option value="pengeluaran">Pengeluaran</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Status</label>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]">
                      <option value="menunggu">Menunggu</option>
                      <option value="dibayar">Sudah Dibayar</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Tanggal Bayar</label>
                    <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Jatuh Tempo</label>
                    <input type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Keterangan / Catatan</label>
                  <textarea rows={2} placeholder="Contoh: DP 30% paket premium" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)}
                    className="mt-1.5 block w-full rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2.5 text-xs focus:border-[#D4AF37] focus:outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-2 border-t border-[#ECE7E1] pt-4">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)}
                    className="rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs font-semibold text-[#666666] hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                    Batal
                  </button>
                  <button type="submit" disabled={isPaymentSubmitting}
                    className="rounded-full bg-[#1E1E1E] px-5 py-2 text-xs font-semibold text-white hover:scale-[1.01] transition-transform disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                    {isPaymentSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
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
