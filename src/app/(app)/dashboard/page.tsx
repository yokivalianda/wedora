"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import {
  mockActivities
} from "@/lib/mock-data";
import {
  formatCurrency,
  formatDate,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  daysUntil
} from "@/lib/utils";
import {
  Calendar,
  DollarSign,
  FolderKanban,
  ListTodo,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { projectService, taskService, paymentService } from "@/lib/services";
import { WeddingProject, Task, Payment } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState<WeddingProject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectService.getAll(),
      taskService.getAll(),
      paymentService.getAll()
    ])
      .then(([projectsData, tasksData, paymentsData]) => {
        setProjects(projectsData || []);
        setTasks(tasksData || []);
        setPayments(paymentsData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard data:", err);
        setLoading(false);
      });
  }, []);

  const totalPaid = payments
    .filter((p) => p.status === "dibayar")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "menunggu" || p.status === "terlambat")
    .reduce((sum, p) => sum + p.amount, 0);

  const todayStr = new Date().toISOString().split("T")[0];
  const tasksDueTodayCount = tasks.filter(
    (t) => t.status !== "done" && t.due_date === todayStr
  ).length;

  const stats = {
    total_projects: projects.length,
    active_projects: projects.filter(
      (p) => p.status === "in_progress" || p.status === "dp_paid" || p.status === "planning"
    ).length,
    total_revenue: totalPaid,
    pending_payments: totalPending,
    tasks_due_today: tasksDueTodayCount > 0 ? tasksDueTodayCount : tasks.filter((t) => t.status !== "done").length
  };

  const activeProjects = projects
    .filter((p) => p.status === "in_progress" || p.status === "dp_paid" || p.status === "planning")
    .slice(0, 3);

  const pendingTasks = tasks
    .filter((t) => t.status !== "done")
    .slice(0, 4);

  const activities: any[] = [];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-[#ECE7E1] rounded-2xl p-6 shadow-soft">
          <div className="text-left">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Selamat Datang di Wedora
            </span>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-[#1E1E1E]">
              Halo, {user?.name || "Yoki Valianda"}
            </h1>
            <p className="mt-1 text-sm text-[#666666]">
              Berikut ringkasan workspace wedding organizer {user?.orgName || "Amara"} hari ini.
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform self-start md:self-center"
          >
            <span>Mulai Proyek Baru</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>


        {/* Cash Flow At Risk / Premium Alert Banner */}
        {stats.pending_payments > 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-soft flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3.5 text-left">
              <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-600 shrink-0">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E1E1E] tracking-tight">
                  Arus Kas Menunggu Pelunasan: <span className="text-[#D4AF37]">{formatCurrency(stats.pending_payments)}</span>
                </h4>
                <p className="text-xs text-[#666666] mt-0.5 leading-relaxed max-w-xl">
                  Terdapat pembayaran pelunasan terdekat untuk klien <strong className="text-[#1E1E1E]">Anisa & Reza</strong> sebesar Rp 175.000.000 yang mendekati jatuh tempo. Kirimkan pesan tagihan ramah melalui WhatsApp.
                </p>
              </div>
            </div>
            <a
              href={`https://api.whatsapp.com/send?phone=6281234567890&text=${encodeURIComponent(
                "Halo Kak Anisa Putri, ini tim asisten dari Amara WO. Kami ingin mengonfirmasi terkait jadwal pembayaran pelunasan berikutnya sebesar Rp 175.000.000 yang akan jatuh tempo pada 1 Juni 2026. Kakak bisa memeriksa rincian invoice dan status persiapan pernikahan di link portal klien Wedora berikut ya: klien.amarawo.com/anisa-reza. Terima kasih banyak, Kak!"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors shrink-0 self-start md:self-center"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.031 14.07 1.01 11.455 1.01 6.012 1.01 1.593 5.378 1.59 10.808c0 1.637.433 3.238 1.256 4.674l-.167.979-.933 3.411 3.5-.918z" />
              </svg>
              <span>Kirim Nudge WhatsApp</span>
            </a>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Stat 1 */}
          <div className="rounded-2xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Total Pendapatan</span>
              <div className="rounded-full bg-[#FAF7F2] p-2 text-[#D4AF37] border border-[#ECE7E1]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold text-[#1E1E1E]">
              {formatCurrency(stats.total_revenue)}
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
              <TrendingUp className="h-3 w-3" /> Kas Aman
            </span>
          </div>

          {/* Stat 2 */}
          <div className="rounded-2xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Proyek Aktif</span>
              <div className="rounded-full bg-[#FAF7F2] p-2 text-[#D4AF37] border border-[#ECE7E1]">
                <FolderKanban className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold text-[#1E1E1E]">
              {stats.active_projects} / {stats.total_projects}
            </p>
            <span className="mt-1.5 inline-flex items-center text-[10px] text-[#666666] font-medium">
              Dalam Perencanaan & DP Paid
            </span>
          </div>

          {/* Stat 3 */}
          <div className="rounded-2xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Pembayaran Pending</span>
              <div className="rounded-full bg-[#FAF7F2] p-2 text-[#D4AF37] border border-[#ECE7E1]">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold text-[#1E1E1E]">
              {formatCurrency(stats.pending_payments)}
            </p>
            <span className="mt-1.5 inline-flex items-center text-[10px] text-amber-600 font-medium">
              Menunggu Pelunasan Klien
            </span>
          </div>

          {/* Stat 4 */}
          <div className="rounded-2xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Tugas Hari Ini</span>
              <div className="rounded-full bg-[#FAF7F2] p-2 text-[#D4AF37] border border-[#ECE7E1]">
                <ListTodo className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold text-[#1E1E1E]">
              {stats.tasks_due_today} Tugas
            </p>
            <span className="mt-1.5 inline-flex items-center text-[10px] text-[#666666] font-medium">
              Harus diselesaikan tim hari ini
            </span>
          </div>
        </div>

        {/* Core Dashboard Content splits */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Upcoming Weddings List (Left 2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-semibold text-[#1E1E1E]">Proyek Pernikahan Terdekat</h3>
              <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline">
                <span>Lihat semua</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {activeProjects.length > 0 ? (
                activeProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft hover:shadow-card transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PROJECT_STATUS_COLORS[project.status]}`}>
                          {PROJECT_STATUS_LABELS[project.status]}
                        </span>
                        <span className="text-[11px] text-amber-600 font-semibold uppercase tracking-wide">
                          {daysUntil(project.wedding_date)} Hari Lagi
                        </span>
                      </div>
                      <p className="font-heading text-lg font-semibold text-[#1E1E1E]">
                        {project.bride_name} & {project.groom_name}
                      </p>
                      <p className="text-xs text-[#666666]">
                        {formatDate(project.wedding_date)} • {project.venue}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-[#ECE7E1] pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold">Total Anggaran</p>
                        <p className="text-sm font-semibold text-[#1E1E1E] mt-0.5">{formatCurrency(project.budget_total)}</p>
                      </div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#ECE7E1] text-[#666666] hover:text-[#1E1E1E] hover:border-[#1E1E1E] transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-8 text-center space-y-3 shadow-soft animate-fade-in">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF7F2] text-[#D4AF37] border border-[#ECE7E1]">
                    <FolderKanban className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#1E1E1E]">Belum Ada Proyek Pernikahan</h4>
                  <p className="text-xs text-[#666666] max-w-xs mx-auto">Mulai langkah anggun Anda dengan menambahkan klien pertama Anda untuk mengelola jadwal, tugas, dan anggaran mereka.</p>
                  <Link href="/projects" className="inline-flex items-center gap-1.5 rounded-full bg-[#1E1E1E] text-white px-5 py-2.5 text-xs font-semibold hover:scale-[1.01] transition-transform shadow-sm">
                    <span>Buat Proyek Baru</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Tasks & Activity Feed (Right 1/3) */}
          <div className="space-y-6">
            {/* Urgent Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl font-semibold text-[#1E1E1E]">Tugas Mendatang</h3>
                <Link href="/tasks" className="text-xs font-semibold text-[#D4AF37] hover:underline">Kelola</Link>
              </div>

              <div className="rounded-2xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft space-y-4">
                {pendingTasks.length > 0 ? (
                  pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-start justify-between gap-3 border-b border-[#ECE7E1]/50 pb-3 last:border-b-0 last:pb-0">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-[#1E1E1E] line-clamp-1">{task.title}</p>
                        <p className="text-[10px] text-[#666666]">PIC: {task.assignee_name || "Belum Ditunjuk"}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold shrink-0 ${TASK_PRIORITY_COLORS[task.priority]}`}>
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 space-y-2 animate-fade-in">
                    <p className="text-xs font-semibold text-[#1E1E1E]">Semua Tugas Selesai ✨</p>
                    <p className="text-[10px] text-[#666666]">Tidak ada tugas tertunda yang menanti Anda hari ini.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="space-y-4">
              <h3 className="font-heading text-xl font-semibold text-[#1E1E1E]">Aktivitas Tim</h3>
              <div className="rounded-2xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft space-y-4">
                {activities.length > 0 ? (
                  activities.slice(0, 3).map((act) => (
                    <div key={act.id} className="text-left space-y-1">
                      <p className="text-xs font-medium text-[#1E1E1E]">
                        <span className="font-bold">{act.user_name}</span> {act.action}{" "}
                        <span className="italic">"{act.entity_name}"</span>
                      </p>
                      <span className="text-[9px] text-[#666666]/70">{act.created_at ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(act.created_at)) : 'Baru saja'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 space-y-2 animate-fade-in">
                    <p className="text-xs font-semibold text-[#1E1E1E]">Belum Ada Aktivitas</p>
                    <p className="text-[10px] text-[#666666]">Aktivitas tim Wedding Organizer Anda akan terekam di sini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

