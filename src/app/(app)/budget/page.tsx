"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Payment, WeddingProject } from "@/types";
import { paymentService, projectService, activityService } from "@/lib/services";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Clock, CheckCircle, AlertCircle, Plus, Receipt, X, Sparkles, Trash2 } from "lucide-react";

export default function BudgetPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<WeddingProject[]>([]);

  useEffect(() => {
    paymentService.getAll().then((data) => setPayments(data));
    projectService.getAll().then((data) => {
      setProjects(data);
      if (data.length > 0) setProjectId(data[0].id);
    });
  }, []);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState<"dp" | "pelunasan" | "vendor" | "pengeluaran">("dp");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"dibayar" | "menunggu" | "terlambat">("dibayar");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleDelete = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    paymentService.delete(id).then(() => {
      setPayments((prev) => prev.filter((p) => p.id !== id));
    });
  };

  const handleMarkAsPaid = (id: string) => {
    paymentService.update(id, { status: "dibayar", payment_date: new Date().toISOString().split("T")[0] }).then((updated) => {
      if (updated) {
        setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));

        const linkedProject = projects.find(pro => pro.id === updated.project_id);
        activityService.create({
          id: `act-${Date.now()}`,
          org_id: null,
          user_id: null,
          user_name: "Pengguna",
          action: "menandai pembayaran lunas",
          entity_type: "payment",
          entity_name: updated.notes || (linkedProject ? `Pembayaran ${linkedProject.bride_name} & ${linkedProject.groom_name}` : "Pembayaran"),
          created_at: new Date().toISOString()
        }).catch(console.warn);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const newPayment: Payment = {
      id: `pay-gen-${Date.now()}`,
      org_id: null,
      project_id: projectId,
      type: type,
      amount: Number(amount),
      status: status,
      payment_date: status === "dibayar" ? (paymentDate || new Date().toISOString().split("T")[0]) : undefined,
      due_date: status !== "dibayar" ? (paymentDate || new Date().toISOString().split("T")[0]) : undefined,
      notes: notes || `${type.toUpperCase()} Pernikahan`,
      created_at: new Date().toISOString()
    };

    paymentService.create(newPayment).then((saved) => {
      setPayments((prev) => [saved, ...prev]);

      // Log activity
      activityService.create({
        id: `act-${Date.now()}`,
        org_id: null,
        user_id: null,
        user_name: "Pengguna",
        action: "mencatat transaksi baru",
        entity_type: "payment",
        entity_name: saved.notes || "Transaksi",
        created_at: new Date().toISOString()
      }).catch(console.warn);
    }).catch((err) => {
      console.error("Gagal mencatat transaksi:", err);
      // Still add to local state so user sees it
      setPayments((prev) => [newPayment, ...prev]);
    });

    // Reset Form
    setAmount("");
    setNotes("");
    setPaymentDate("");
    setIsAddModalOpen(false);
  };

  // Financial sums recalculated dynamically based on state
  const totalPaid = payments
    .filter((p) => p.status === "dibayar")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "menunggu" || p.status === "terlambat")
    .reduce((sum, p) => sum + p.amount, 0);

  const grandTotal = totalPaid + totalPending;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">Kas & Anggaran</h1>
            <p className="mt-1 text-sm text-[#666666]">Pantau dana masuk, DP paid, rincian pengeluaran, dan penagihan klien.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Transaksi Baru</span>
          </button>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="rounded-2xl border border-[#ECE7E1] bg-white p-6 text-left shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Total Nilai Kontrak</span>
              <div className="rounded-full bg-[#FAF7F2] p-2 text-[#D4AF37] border border-[#ECE7E1]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold text-[#1E1E1E]">{formatCurrency(grandTotal)}</p>
            <span className="mt-1.5 inline-flex items-center text-[10px] text-[#666666]">Akumulasi seluruh paket aktif</span>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-[#ECE7E1] bg-white p-6 text-left shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Dana Masuk (DP Paid)</span>
              <div className="rounded-full bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold text-[#1E1E1E]">{formatCurrency(totalPaid)}</p>
            <span className="mt-1.5 inline-flex items-center text-[10px] text-emerald-600 font-medium">Pembayaran tervalidasi</span>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-[#ECE7E1] bg-white p-6 text-left shadow-soft relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Piutang Menunggu</span>
              <div className="rounded-full bg-amber-50 p-2 text-amber-600 border border-amber-100">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold text-[#1E1E1E]">{formatCurrency(totalPending)}</p>
            <span className="mt-1.5 inline-flex items-center text-[10px] text-amber-600 font-medium">Belum jatuh tempo</span>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold text-[#1E1E1E] text-left">Riwayat Transaksi</h2>
          <div className="overflow-hidden rounded-2xl border border-[#ECE7E1] bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#ECE7E1]">
                <thead className="bg-[#FAF7F2]/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#1E1E1E]">Jenis</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#1E1E1E]">Keterangan</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#1E1E1E]">Tanggal</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#1E1E1E]">Nominal</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#1E1E1E]">Status</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#1E1E1E]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE7E1] bg-white">
                  {payments.map((p) => {
                    const isPaid = p.status === "dibayar";
                    const linkedProject = projects.find(pro => pro.id === p.project_id);
                    return (
                      <tr key={p.id} className="hover:bg-[#FAF7F2]/20 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-left text-sm">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${p.type === "dp" ? "bg-blue-50 text-blue-600" : "bg-[#EFD6D2] text-[#1E1E1E]"
                            }`}>
                            <Receipt className="h-3 w-3 shrink-0" />
                            {p.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left text-sm text-[#1E1E1E] font-medium">
                          <div className="space-y-0.5">
                            <p>{p.notes || `Pembayaran Tagihan #${p.id.split("-")[1]}`}</p>
                            {linkedProject && (
                              <p className="text-[10px] text-[#666666] font-normal italic">Klien: {linkedProject.bride_name} & {linkedProject.groom_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-left text-sm text-[#666666]">
                          {p.payment_date ? formatDate(p.payment_date) : p.due_date ? `Jatuh Tempo: ${formatDate(p.due_date)}` : "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-left text-sm font-semibold text-[#1E1E1E]">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-left text-sm">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700"
                              : p.status === "terlambat"
                                ? "bg-rose-50 text-rose-600"
                                : "bg-amber-50 text-amber-600"
                            }`}>
                            {isPaid ? "Dibayar" : p.status === "terlambat" ? "Terlambat" : "Menunggu"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-left text-sm">
                          <div className="flex items-center gap-2">
                            {!isPaid && (
                              <button
                                onClick={() => handleMarkAsPaid(p.id)}
                                className="text-[#666666] hover:text-emerald-600 transition-colors"
                                title="Tandai Lunas"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-[#666666] hover:text-rose-500 transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Catat Transaksi Modal */}
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
                  <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Catat Transaksi Kas Baru</h3>
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Hubungkan ke Proyek Klien</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>Pernikahan {p.bride_name} & {p.groom_name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Jenis Transaksi</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="dp">DP (Down Payment)</option>
                      <option value="pelunasan">Pelunasan Kontrak</option>
                      <option value="vendor">Pembayaran Vendor</option>
                      <option value="pengeluaran">Pengeluaran Operasional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Status Transaksi</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    >
                      <option value="dibayar">Lunas / Dibayar</option>
                      <option value="menunggu">Menunggu Pelunasan</option>
                      <option value="terlambat">Terlambat</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nominal Transaksi (IDR)</label>
                    <div className="relative mt-1.5">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs text-[#666666] font-bold">
                        Rp
                      </div>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 15000000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 py-2 pl-9 pr-4 text-xs focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Tanggal / Jatuh Tempo</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none text-[#1E1E1E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">Keterangan Transaksi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Down Payment 30% dari Klien"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/40 px-4 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
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
                    <span>Catat Transaksi 🌟</span>
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
