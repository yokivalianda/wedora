"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Vendor, VendorCategory } from "@/types";
import { vendorService } from "@/lib/services";
import { VENDOR_CATEGORY_LABELS } from "@/lib/utils";
import { 
  Sparkles, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Star, 
  Tag, 
  X, 
  MessageSquare, 
  MapPin, 
  Info,
  DollarSign
} from "lucide-react";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    vendorService.getAll().then((data) => setVendors(data));
  }, []);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("foto_video");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [rating, setRating] = useState("5");
  const [priceRange, setPriceRange] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactName || !contactPhone) return;

    const newVendor: Vendor = {
      id: `vendor-gen-${Date.now()}`,
      org_id: "org-001",
      name,
      category,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail || undefined,
      rating: Number(rating),
      price_range: priceRange || "Hubungi Vendor",
      notes: notes || "Rekomendasi vendor premium untuk pernikahan elegan.",
      created_at: new Date().toISOString()
    };

    vendorService.create(newVendor).then((saved) => {
      setVendors((prev) => [saved, ...prev]);
    });

    // Reset Form
    setName("");
    setCategory("foto_video");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setRating("5");
    setPriceRange("");
    setNotes("");
    setIsAddModalOpen(false);
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesCategory = activeCategory === "semua" || vendor.category === activeCategory;
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.contact_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      VENDOR_CATEGORY_LABELS[vendor.category].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { key: "semua", label: "Semua Kategori" },
    ...Object.entries(VENDOR_CATEGORY_LABELS).map(([key, label]) => ({ key, label }))
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">Rekanan Vendor</h1>
            <p className="mt-1 text-sm text-[#666666]">Kelola jaringan katering, dekorasi, dokumentasi, MC, dan rias pengantin terbaik.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Vendor Baru</span>
          </button>
        </div>

        {/* Filter Scrollbar & Search Box */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#ECE7E1] pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none max-w-full">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.key
                    ? "bg-[#1E1E1E] text-white shadow-sm"
                    : "text-[#666666] hover:bg-white hover:text-[#1E1E1E]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-xs shrink-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="search"
              placeholder="Cari nama vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-full border border-[#ECE7E1] bg-white py-2 pl-10 pr-4 text-xs text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ECE7E1] bg-white p-12 text-center">
            <p className="text-sm font-medium text-[#666666]">Tidak ada rekanan vendor yang sesuai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div 
                key={vendor.id}
                className="flex flex-col justify-between rounded-2xl border border-[#ECE7E1] bg-white p-6 text-left shadow-soft hover:shadow-card transition-all space-y-5"
              >
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] border border-[#ECE7E1] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      <Tag className="h-3 w-3" />
                      <span>{VENDOR_CATEGORY_LABELS[vendor.category]}</span>
                    </span>

                    {/* Rating stars */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < (vendor.rating || 5) ? "fill-amber-500 text-amber-500" : "text-slate-200"}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-heading text-lg font-bold text-[#1E1E1E] tracking-tight">{vendor.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#666666] font-medium">
                      <DollarSign className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span>Estimasi: <strong>{vendor.price_range || "Hubungi Vendor"}</strong></span>
                    </div>
                  </div>

                  <p className="text-xs text-[#666666] leading-relaxed line-clamp-2">{vendor.notes}</p>
                </div>

                {/* Contact Area */}
                <div className="border-t border-[#ECE7E1] pt-4 space-y-3.5">
                  <div className="space-y-1.5 text-xs text-[#666666]">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#666666]" />
                      <span>PIC: <strong className="text-[#1E1E1E]">{vendor.contact_name || "-"}</strong> ({vendor.contact_phone || "-"})</span>
                    </div>
                    {vendor.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-[#666666]" />
                        <span>{vendor.contact_email}</span>
                      </div>
                    )}
                  </div>

                  <a
                    href={`https://api.whatsapp.com/send?phone=${(vendor.contact_phone || "").replace(/[^0-9]/g, "")}&text=${encodeURIComponent(
                      `Halo Kak ${vendor.contact_name || "PIC"} dari ${vendor.name}, saya tim dari Amara Wedding Organizer ingin berkoordinasi dan menanyakan ketersediaan tanggal pernikahan klien kami. Terima kasih!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#FAF7F2] border border-[#ECE7E1] py-2.5 text-xs font-bold text-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-white hover:border-[#1E1E1E] transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span>WhatsApp Vendor</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Premium Tambah Vendor Modal */}
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
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Tambah Rekanan Vendor</h3>
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nama Bisnis Vendor</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Amarta Florist"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Kategori Layanan</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      {Object.entries(VENDOR_CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nama Narahubung (PIC)</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kak Shinta"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">No. HP / WhatsApp PIC</label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 62812345678"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Email Vendor (Opsional)</label>
                    <input
                      type="email"
                      placeholder="Contoh: info@amarta.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Rentang Estimasi Harga</label>
                    <input
                      type="text"
                      placeholder="Contoh: Rp 20jt - Rp 45jt"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Rating Vendor</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Bintang)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Bintang)</option>
                      <option value="3">⭐⭐⭐ (3 Bintang)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Catatan / Keunggulan Vendor</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Sangat detail dalam penataan dekorasi pelaminan rustic..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1.5 block w-full rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2.5 text-xs focus:border-[#D4AF37] focus:outline-none resize-none"
                  />
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
                    <span>Simpan Vendor 🌟</span>
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
