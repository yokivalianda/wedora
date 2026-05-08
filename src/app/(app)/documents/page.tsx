"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Document, DocumentType, WeddingProject } from "@/types";
import { documentService, projectService } from "@/lib/services";
import { formatDateShort } from "@/lib/utils";
import {
  Plus,
  Search,
  FileText,
  Image as ImageIcon,
  X,
  Sparkles,
  Trash2,
  FolderOpen,
  ArrowUpRight,
  Download,
} from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "Kontrak" | "Moodboard & Foto" | "Invoice">("all");

  useEffect(() => {
    documentService.getAll().then((data) => setDocuments(data));
  }, []);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [projects, setProjects] = useState<WeddingProject[]>([]);

  useEffect(() => {
    projectService.getAll().then(setProjects);
  }, []);

  const [name, setName] = useState("");
  const [docType, setDocType] = useState<DocumentType>("dokumen");
  const [category, setCategory] = useState("Kontrak");
  const [url, setUrl] = useState("");
  const [size, setSize] = useState("");
  const [projectId, setProjectId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newDoc: Document = {
      id: `doc-gen-${Date.now()}`,
      org_id: "org-001",
      project_id: projectId || undefined,
      name,
      type: docType,
      category,
      url: url || "#",
      size: size || undefined,
      created_at: new Date().toISOString(),
    };

    documentService.create(newDoc).then((saved) => {
      setDocuments((prev) => [saved, ...prev]);

      // Reset Form
      setName("");
      setDocType("dokumen");
      setCategory("Kontrak");
      setUrl("");
      setSize("");
      setProjectId("");
      setIsAddModalOpen(false);
    }).catch((err) => {
      alert("Gagal menyimpan data. Silakan coba lagi.");
      console.error(err);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    documentService.delete(id).then(() => {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    });
  };

  const filteredDocs = documents
    .filter((doc) => activeFilter === "all" || doc.category === activeFilter)
    .filter((doc) => doc.name.toLowerCase().includes(search.toLowerCase()));

  const filters = [
    { label: "Semua Berkas", value: "all" as const },
    { label: "Kontrak", value: "Kontrak" as const },
    { label: "Moodboard & Foto", value: "Moodboard & Foto" as const },
    { label: "Invoice", value: "Invoice" as const },
  ];

  const getDocIcon = (type: DocumentType) => {
    if (type === "foto" || type === "moodboard") {
      return <ImageIcon className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">Dokumen & Moodboard</h1>
            <p className="mt-1 text-sm text-[#666666]">Simpan dan bagikan kontrak, invoice, moodboard referensi pengantin.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Unggah Berkas</span>
          </button>
        </div>

        {/* Filter Navigation & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#ECE7E1] pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeFilter === filter.value
                    ? "bg-[#1E1E1E] text-white shadow-sm"
                    : "text-[#666666] hover:bg-white hover:text-[#1E1E1E]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="search"
              placeholder="Cari nama berkas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-full border border-[#ECE7E1] bg-white py-2 pl-10 pr-4 text-xs text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl bg-[#FAF7F2] p-4 border border-[#ECE7E1] text-[#D4AF37]">
                <FolderOpen className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-[#666666]">Belum ada dokumen yang tersimpan.</p>
              <p className="text-xs text-[#666666]/70">Mulai unggah kontrak, moodboard, atau invoice pertama Anda.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Unggah Berkas Pertama</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-5 rounded-2xl border border-[#ECE7E1] bg-white shadow-soft hover:shadow-card transition-all text-left"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="rounded-xl bg-[#FAF7F2] p-3 border border-[#ECE7E1] text-[#D4AF37] shrink-0">
                    {getDocIcon(doc.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1E1E1E] truncate max-w-[200px] sm:max-w-xs">{doc.name}</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">
                      {doc.category || doc.type}
                      {doc.size ? ` \u2022 ${doc.size}` : ""}
                      {` \u2022 ${formatDateShort(doc.created_at)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-[#666666] hover:text-rose-500 transition-colors"
                    title="Hapus Dokumen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#ECE7E1] text-[#666666] hover:text-[#1E1E1E] hover:border-[#1E1E1E] transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unggah Berkas Modal */}
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
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Unggah Berkas Baru</h3>
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nama Berkas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kontrak Venue Ayana Midplaza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Tipe</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as DocumentType)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="kontrak">Kontrak</option>
                      <option value="invoice">Invoice</option>
                      <option value="moodboard">Moodboard</option>
                      <option value="foto">Foto</option>
                      <option value="dokumen">Dokumen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="Kontrak">Kontrak</option>
                      <option value="Moodboard & Foto">Moodboard & Foto</option>
                      <option value="Invoice">Invoice</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">URL Berkas</label>
                  <input
                    type="text"
                    placeholder="Contoh: https://drive.google.com/file/d/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Ukuran File (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 2.4 MB"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Hubungkan ke Proyek</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="">-- Tanpa Proyek --</option>
                      {projects.map((p) => (
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
                    <span>Simpan Berkas</span>
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
