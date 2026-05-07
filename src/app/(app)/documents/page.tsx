"use client";

import AppLayout from "@/components/layout/AppLayout";
import { FolderOpen, FileText, Image as ImageIcon, Plus, ArrowUpRight, Search } from "lucide-react";
import { useState } from "react";

const mockDocuments = [
  { id: "doc-1", name: "Kontrak Vendor Dekorasi - La Maison.pdf", type: "pdf", size: "2.4 MB", date: "Mei 2, 2026", category: "Kontrak" },
  { id: "doc-2", name: "Inspirasi Moodboard Rustic Sage.png", type: "image", size: "5.8 MB", date: "Mei 4, 2026", category: "Moodboard" },
  { id: "doc-3", name: "Rincian Katering Sriwijaya.xlsx", type: "excel", size: "1.1 MB", date: "Mei 5, 2026", category: "Invoice" },
  { id: "doc-4", name: "Surat Izin Penggunaan Gedung.pdf", type: "pdf", size: "850 KB", date: "Mei 6, 2026", category: "Dokumen" },
];

export default function DocumentsPage() {
  const [search, setSearch] = useState("");

  const filteredDocs = mockDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">Dokumen & Moodboard</h1>
            <p className="mt-1 text-sm text-[#666666]">Simpan dan bagikan kontrak, invoice, moodboard referensi pengantin.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform">
            <Plus className="h-4 w-4" />
            <span>Unggah Berkas</span>
          </button>
        </div>

        {/* Filter Navigation & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#ECE7E1] pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button className="rounded-full bg-[#1E1E1E] text-white px-4 py-2 text-xs font-semibold shadow-sm whitespace-nowrap">
              Semua Berkas
            </button>
            <button className="rounded-full text-[#666666] hover:bg-white hover:text-[#1E1E1E] px-4 py-2 text-xs font-semibold whitespace-nowrap">
              Kontrak
            </button>
            <button className="rounded-full text-[#666666] hover:bg-white hover:text-[#1E1E1E] px-4 py-2 text-xs font-semibold whitespace-nowrap">
              Moodboard & Foto
            </button>
            <button className="rounded-full text-[#666666] hover:bg-white hover:text-[#1E1E1E] px-4 py-2 text-xs font-semibold whitespace-nowrap">
              Invoice
            </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id}
              className="flex items-center justify-between p-5 rounded-2xl border border-[#ECE7E1] bg-white shadow-soft hover:shadow-card transition-all text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="rounded-xl bg-[#FAF7F2] p-3 border border-[#ECE7E1] text-[#D4AF37] shrink-0">
                  {doc.type === "image" ? (
                    <ImageIcon className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1E1E1E] truncate max-w-[200px] sm:max-w-xs">{doc.name}</p>
                  <p className="text-[11px] text-[#666666] mt-0.5">{doc.category} • {doc.size} • {doc.date}</p>
                </div>
              </div>

              <button className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#ECE7E1] text-[#666666] hover:text-[#1E1E1E] hover:border-[#1E1E1E] transition-colors shrink-0">
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
