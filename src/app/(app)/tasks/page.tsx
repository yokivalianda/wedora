"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Task, WeddingProject, User as UserType } from "@/types";
import { taskService, projectService, activityService, userService } from "@/lib/services";
import { 
  TASK_PRIORITY_LABELS, 
  TASK_PRIORITY_COLORS, 
  TASK_STATUS_LABELS,
  formatDateShort
} from "@/lib/utils";
import { CheckSquare, Square, Plus, Calendar, User, Search, X, Sparkles, Trash2 } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"semua" | "todo" | "in_progress" | "done">("semua");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    taskService.getAll().then((data) => setTasks(data));
  }, []);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [projects, setProjects] = useState<WeddingProject[]>([]);
  const [orgUsers, setOrgUsers] = useState<UserType[]>([]);

  useEffect(() => {
    projectService.getAll().then(setProjects);
    userService.getAll().then(setOrgUsers);
  }, []);

  const [title, setTitle] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [projectId, setProjectId] = useState("");

  const handleToggleTask = (id: string) => {
    taskService.toggle(id).then((updatedTask) => {
      if (updatedTask) {
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? updatedTask : task))
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;
    taskService.delete(id).then(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });
  };

  const handleCyclePriority = (task: Task) => {
    const cycle: Record<string, "low" | "medium" | "high"> = {
      low: "medium",
      medium: "high",
      high: "low"
    };
    const newPriority = cycle[task.priority] || "medium";
    taskService.update(task.id, { priority: newPriority }).then((updated) => {
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newTask: Task = {
      id: `task-gen-${Date.now()}`,
      org_id: null,
      project_id: projectId || undefined,
      title: title,
      assignee_name: assigneeName || undefined,
      due_date: dueDate || undefined,
      status: "todo",
      priority: priority,
      created_at: new Date().toISOString()
    };

    taskService.create(newTask).then((saved) => {
      setTasks((prev) => [saved, ...prev]);

      // Log activity
      activityService.create({
        id: `act-${Date.now()}`,
        org_id: null,
        user_id: null,
        user_name: "Pengguna",
        action: "menambahkan tugas baru",
        entity_type: "task",
        entity_name: saved.title,
        created_at: new Date().toISOString()
      }).catch(console.warn);
    }).catch((err) => {
      console.error("Gagal menambahkan tugas:", err);
      setTasks((prev) => [newTask, ...prev]);
    });

    // Reset Form
    setTitle("");
    setAssigneeName("");
    setDueDate("");
    setPriority("medium");
    setProjectId("");
    setIsAddModalOpen(false);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === "semua" || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (task.assignee_name && task.assignee_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">Daftar Tugas</h1>
            <p className="mt-1 text-sm text-[#666666]">Lacak kesiapan seluruh hal operasional pernikahan klien.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tugas Baru</span>
          </button>
        </div>

        {/* Filter Navigation & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#ECE7E1] pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {(["semua", "todo", "in_progress", "done"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  filter === status
                    ? "bg-[#1E1E1E] text-white shadow-sm"
                    : "text-[#666666] hover:bg-white hover:text-[#1E1E1E]"
                }`}
              >
                {status === "semua" ? "Semua Tugas" : TASK_STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="search"
              placeholder="Cari tugas atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-full border border-[#ECE7E1] bg-white py-2 pl-10 pr-4 text-xs text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* Task List Grid */}
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-12 text-center">
            <p className="text-sm font-medium text-[#666666]">Tidak ada tugas operasional yang sesuai kriteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === "done";
              const linkedProject = projects.find(p => p.id === task.project_id);
              return (
                <div 
                  key={task.id}
                  className={`flex items-start justify-between gap-4 rounded-2xl border border-[#ECE7E1] p-5 shadow-soft hover:shadow-card transition-all text-left ${
                    isCompleted ? "bg-white/60 border-dashed" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Toggle Completion Box */}
                    <button 
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-[#666666] hover:text-[#D4AF37] transition-colors shrink-0 focus:outline-none cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckSquare className="h-5 w-5 text-[#D4AF37]" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <p className={`font-semibold text-sm leading-6 ${
                        isCompleted ? "line-through text-[#666666]/60 font-normal" : "text-[#1E1E1E]"
                      }`}>
                        {task.title}
                      </p>

                      {/* Meta labels */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-[10px] text-[#666666] font-medium">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" />
                            <span>Batas: {formatDateShort(task.due_date)}</span>
                          </span>
                        )}
                        {task.assignee_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-[#D4AF37]" />
                            <span>PIC: {task.assignee_name}</span>
                          </span>
                        )}
                        {linkedProject && (
                          <span className="flex items-center gap-1 rounded bg-[#FAF7F2] border border-[#ECE7E1] px-1.5 py-0.5 text-[9px] font-bold text-[#D4AF37]">
                            <Sparkles className="h-3 w-3" />
                            <span>Pernikahan {linkedProject.bride_name} & {linkedProject.groom_name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-[#666666] hover:text-rose-500 transition-colors"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCyclePriority(task)}
                      className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${TASK_PRIORITY_COLORS[task.priority]}`}
                      title="Klik untuk ubah prioritas"
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tambah Tugas Modal */}
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
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Tambah Tugas Operasional</h3>
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Judul Tugas / Pekerjaan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Konfirmasi katering & fitting baju keluarga"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Penanggung Jawab (PIC)</label>
                    <select
                      value={assigneeName}
                      onChange={(e) => setAssigneeName(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="">— Pilih PIC —</option>
                      {orgUsers.map(u => (
                        <option key={u.id} value={u.full_name}>{u.full_name} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Tingkat Prioritas</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="low">Rendah</option>
                      <option value="medium">Sedang</option>
                      <option value="high">Tinggi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Batas Waktu (Due Date)</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Hubungkan ke Proyek</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="">-- Tugas Umum (Tanpa Proyek) --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>Pernikahan {p.bride_name} & {p.groom_name}</option>
                      ))}
                    </select>
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
                    Tambah Tugas
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
