"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { seedSupabase } from "@/lib/seed";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  FolderKanban,
  ListTodo,
  DollarSign,
  Store,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function SyncPage() {
  const [counts, setCounts] = useState({
    projects: 0,
    tasks: 0,
    payments: 0,
    vendors: 0,
  });
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    setIsSupabaseReady(isSupabaseConfigured());
    try {
      const projects = JSON.parse(localStorage.getItem("wedora_projects") || "[]");
      const tasks = JSON.parse(localStorage.getItem("wedora_tasks") || "[]");
      const payments = JSON.parse(localStorage.getItem("wedora_payments") || "[]");
      const vendors = JSON.parse(localStorage.getItem("wedora_vendors") || "[]");
      setCounts({
        projects: projects.length,
        tasks: tasks.length,
        payments: payments.length,
        vendors: vendors.length,
      });
    } catch {
      // ignore parse errors
    }
  }, []);

  const total = counts.projects + counts.tasks + counts.payments + counts.vendors;

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    const res = await seedSupabase();
    setSyncing(false);
    if (res.success) {
      setResult({
        success: true,
        message: "Data berhasil diimpor ke Supabase!",
        details: res.results,
      });
    } else {
      setResult({
        success: false,
        message: res.error || "Gagal mengimpor data.",
      });
    }
  };

  const statCards = [
    { label: "Proyek", count: counts.projects, icon: FolderKanban, color: "text-[#D4AF37]" },
    { label: "Tugas", count: counts.tasks, icon: ListTodo, color: "text-blue-500" },
    { label: "Pembayaran", count: counts.payments, icon: DollarSign, color: "text-emerald-500" },
    { label: "Vendor", count: counts.vendors, icon: Store, color: "text-rose-500" },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#1E1E1E] tracking-tight">
            Sinkronisasi Data
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            Pindahkan semua data yang tersimpan di browser ke database Supabase.
          </p>
        </div>

        {!isSupabaseReady && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 space-y-1">
              <p className="font-semibold">Supabase belum dikonfigurasi</p>
              <p>
                Tambahkan <code className="px-1 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
                <code className="px-1 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
                di file <code className="font-mono text-xs">.env.local</code>, lalu restart server dev.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[#ECE7E1] bg-white p-4 shadow-soft flex flex-col items-center text-center gap-2"
            >
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <div className="text-2xl font-bold text-[#1E1E1E]">{s.count}</div>
              <div className="text-xs text-[#666666] font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#ECE7E1] bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#1E1E1E]">
                Total Data: {total} item
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Data di atas akan diimpor ke tabel Supabase masing-masing.
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={!isSupabaseReady || syncing || total === 0}
              className="inline-flex items-center gap-2 rounded-full bg-[#1E1E1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#333333] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Import ke Supabase
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div
            className={`rounded-2xl border p-5 flex items-start gap-3 ${
              result.success
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm space-y-1 w-full">
              <p
                className={`font-semibold ${
                  result.success ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                {result.message}
              </p>
              {result.details && (
                <pre className="text-xs bg-white/60 rounded-lg p-3 overflow-auto max-h-48 border border-black/5">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2] p-5 space-y-2">
          <h3 className="font-heading text-sm font-bold text-[#1E1E1E]">Catatan</h3>
          <ul className="text-xs text-[#666666] list-disc list-inside space-y-1">
            <li>Pastikan tabel <strong>wedding_projects</strong>, <strong>tasks</strong>, <strong>payments</strong>, dan <strong>vendors</strong> sudah dibuat di Supabase.</li>
            <li>Data yang sudah ada di Supabase (berdasarkan ID) tidak akan ditimpa.</li>
            <li>Setelah impor selesai, refresh halaman agar data dibaca dari Supabase.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
