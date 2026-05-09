"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Document, DocumentType, WeddingProject } from "@/types";
import { documentService, projectService } from "@/lib/services";
import {
  uploadFileToStorage,
  isSupabaseConfigured,
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
} from "@/lib/supabase";
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
  UploadCloud,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────

type UploadMode = "file" | "url";

const ACCEPTED_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.svg";

function getDocIcon(type: DocumentType) {
  if (type === "foto" || type === "moodboard") {
    return <ImageIcon className="h-5 w-5" />;
  }
  return <FileText className="h-5 w-5" />;
}

function inferDocType(file: File): DocumentType {
  const mime = file.type;
  if (mime.startsWith("image/")) return "foto";
  if (mime === "application/pdf") return "kontrak";
  return "dokumen";
}

// ─── Component ──────────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "Kontrak" | "Moodboard & Foto" | "Invoice"
  >("all");

  useEffect(() => {
    documentService.getAll().then((data) => setDocuments(data));
  }, []);

  // ── Projects for linking ──
  const [projects, setProjects] = useState<WeddingProject[]>([]);
  useEffect(() => {
    projectService.getAll().then(setProjects);
  }, []);

  // ── Modal ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ── Upload mode toggle ──
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");

  // ── Shared form state ──
  const [name, setName] = useState("");
  const [docType, setDocType] = useState<DocumentType>("dokumen");
  const [category, setCategory] = useState("Kontrak");
  const [projectId, setProjectId] = useState("");

  // ── File-upload specific state ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSizeError, setFileSizeError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── URL-mode specific state ──
  const [url, setUrl] = useState("");
  const [size, setSize] = useState("");


  // ── Handlers ──

  function resetForm() {
    setName("");
    setDocType("dokumen");
    setCategory("Kontrak");
    setProjectId("");
    setSelectedFile(null);
    setFileSizeError("");
    setUploadProgress("idle");
    setUploadError("");
    setUrl("");
    setSize("");
    setUploadMode("file");
  }

  function handleFileSelect(file: File) {
    setFileSizeError("");
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileSizeError(
        `File terlalu besar (${formatFileSize(file.size)}). Maksimal 10 MB.`
      );
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    // Auto-fill name & type from file
    if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
    setDocType(inferDocType(file));
    if (file.type.startsWith("image/")) setCategory("Moodboard & Foto");
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    let finalUrl = "#";
    let finalSize: string | undefined;

    // ── FILE UPLOAD PATH ──
    if (uploadMode === "file") {
      if (!selectedFile) {
        setUploadError("Pilih file terlebih dahulu.");
        return;
      }
      if (!isSupabaseConfigured()) {
        setUploadError(
          "Supabase belum dikonfigurasi. Gunakan mode URL manual atau hubungkan Supabase terlebih dahulu."
        );
        return;
      }

      setUploadProgress("uploading");
      setUploadError("");
      try {
        const result = await uploadFileToStorage(selectedFile, "documents");
        finalUrl = result.url;
        finalSize = result.size;
        setUploadProgress("success");
      } catch (err: any) {
        setUploadProgress("error");
        setUploadError(err?.message ?? "Upload gagal. Coba lagi.");
        return;
      }
    } else {
      // ── URL PATH ──
      finalUrl = url || "#";
      finalSize = size || undefined;
    }

    const newDoc: Document = {
      id: crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}`,
      org_id: "org-001",
      project_id: projectId || undefined,
      name,
      type: docType,
      category,
      url: finalUrl,
      size: finalSize,
      created_at: new Date().toISOString(),
    };

    try {
      const saved = await documentService.create(newDoc);
      setDocuments((prev) => [saved, ...prev]);
      resetForm();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setUploadProgress("error");
      setUploadError(err?.message ?? "Gagal menyimpan data.");
    }
  }

  function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    documentService.delete(id).then(() => {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    });
  }

  // ── Filtered list ──
  const filteredDocs = documents
    .filter((doc) => activeFilter === "all" || doc.category === activeFilter)
    .filter((doc) =>
      doc.name.toLowerCase().includes(search.toLowerCase())
    );

  const filters = [
    { label: "Semua Berkas", value: "all" as const },
    { label: "Kontrak", value: "Kontrak" as const },
    { label: "Moodboard & Foto", value: "Moodboard & Foto" as const },
    { label: "Invoice", value: "Invoice" as const },
  ];


  // ── Render ──

  return (
    <AppLayout>
      <div className="space-y-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">
              Dokumen & Moodboard
            </h1>
            <p className="mt-1 text-sm text-[#666666]">
              Simpan dan bagikan kontrak, invoice, moodboard referensi pengantin.
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Unggah Berkas</span>
          </button>
        </div>

        {/* Filter & Search */}
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

        {/* Documents List */}
        {filteredDocs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl bg-[#FAF7F2] p-4 border border-[#ECE7E1] text-[#D4AF37]">
                <FolderOpen className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-[#666666]">
                Belum ada dokumen yang tersimpan.
              </p>
              <p className="text-xs text-[#666666]/70">
                Mulai unggah kontrak, moodboard, atau invoice pertama Anda.
              </p>
              <button
                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
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
                    <p className="text-sm font-semibold text-[#1E1E1E] truncate max-w-[200px] sm:max-w-xs">
                      {doc.name}
                    </p>
                    <p className="text-[11px] text-[#666666] mt-0.5">
                      {doc.category || doc.type}
                      {doc.size ? ` • ${doc.size}` : ""}
                      {` • ${formatDateShort(doc.created_at)}`}
                    </p>
                    {doc.uploaded_by && (
                      <p className="text-[10px] text-[#999] mt-0.5">
                        Diunggah oleh: <span className="font-medium text-[#666666]">{doc.uploaded_by}</span>
                      </p>
                    )}
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
                    title="Buka Berkas"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* ── Modal Unggah Berkas ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { resetForm(); setIsAddModalOpen(false); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg rounded-2xl border border-[#ECE7E1] bg-white shadow-elevated z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#ECE7E1] px-6 py-4 text-left sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">
                    Unggah Berkas Baru
                  </h3>
                </div>
                <button
                  onClick={() => { resetForm(); setIsAddModalOpen(false); }}
                  className="rounded-full p-1 text-[#666666] hover:bg-[#FAF7F2] hover:text-[#1E1E1E] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left">

                {/* Upload Mode Toggle */}
                <div className="flex rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/60 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all ${
                      uploadMode === "file"
                        ? "bg-[#1E1E1E] text-white shadow-sm"
                        : "text-[#666666] hover:text-[#1E1E1E]"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("url")}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all ${
                      uploadMode === "url"
                        ? "bg-[#1E1E1E] text-white shadow-sm"
                        : "text-[#666666] hover:text-[#1E1E1E]"
                    }`}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    URL Manual
                  </button>
                </div>

                {/* FILE UPLOAD ZONE */}
                {uploadMode === "file" && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                      Pilih File{" "}
                      <span className="normal-case font-normal text-[#999]">
                        (Maks. 5 MB — PDF, DOC, XLS, JPG, PNG, dll)
                      </span>
                    </label>

                    {/* Drop Zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 cursor-pointer transition-all ${
                        isDragging
                          ? "border-[#D4AF37] bg-[#FAF7F2]"
                          : fileSizeError
                          ? "border-rose-300 bg-rose-50"
                          : selectedFile
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-[#ECE7E1] bg-[#FAF7F2]/40 hover:border-[#D4AF37] hover:bg-[#FAF7F2]"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_TYPES}
                        className="hidden"
                        onChange={handleFileInputChange}
                      />

                      {selectedFile ? (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                          <p className="text-xs font-semibold text-emerald-700 text-center">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-emerald-600">
                            {formatFileSize(selectedFile.size)}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setFileSizeError("");
                              setUploadProgress("idle");
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="mt-1 text-[11px] text-rose-500 underline hover:no-underline"
                          >
                            Hapus pilihan
                          </button>
                        </>
                      ) : (
                        <>
                          <UploadCloud className={`h-8 w-8 ${fileSizeError ? "text-rose-400" : "text-[#D4AF37]"}`} />
                          <p className="text-xs font-semibold text-[#1E1E1E]">
                            Seret & lepas file di sini
                          </p>
                          <p className="text-[11px] text-[#666666]">
                            atau klik untuk memilih file
                          </p>
                        </>
                      )}
                    </div>

                    {/* File size error */}
                    {fileSizeError && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fileSizeError}
                      </div>
                    )}

                    {/* Supabase not configured warning */}
                    {!isSupabaseConfigured() && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>
                          Supabase belum dikonfigurasi. Upload file tidak tersedia.
                          Gunakan tab <strong>URL Manual</strong> untuk menyimpan link eksternal.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* URL MANUAL ZONE */}
                {uploadMode === "url" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                        URL Berkas
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: https://drive.google.com/file/d/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                        Ukuran File (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 2.4 MB"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Nama Berkas */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                    Nama Berkas
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kontrak Venue Ayana Midplaza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                {/* Tipe & Kategori */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                      Tipe
                    </label>
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                      Kategori
                    </label>
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

                {/* Proyek */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                    Hubungkan ke Proyek
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                  >
                    <option value="">-- Tanpa Proyek --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        Pernikahan {p.bride_name} & {p.groom_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload progress / error feedback */}
                {uploadProgress === "uploading" && (
                  <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Mengunggah file ke Supabase Storage…
                  </div>
                )}
                {uploadProgress === "success" && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    File berhasil diunggah!
                  </div>
                )}
                {uploadProgress === "error" && uploadError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {uploadError}
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end gap-2 border-t border-[#ECE7E1] pt-4">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setIsAddModalOpen(false); }}
                    className="rounded-full border border-[#ECE7E1] bg-white px-4 py-2 text-xs font-semibold text-[#666666] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={uploadProgress === "uploading" || !!fileSizeError}
                    className="rounded-full bg-[#1E1E1E] px-5 py-2 text-xs font-semibold text-white hover:scale-[1.01] transition-transform flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {uploadProgress === "uploading" ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Mengunggah…
                      </>
                    ) : (
                      <span>Simpan Berkas</span>
                    )}
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
