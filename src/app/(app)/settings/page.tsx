"use client";

import AppLayout from "@/components/layout/AppLayout";
import { User, Building, Shield, Bell, Plus, Users, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { isDemoAccount } from "@/lib/demo";

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<"profil" | "organisasi" | "tim">("profil");
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setOrgName(user.orgName || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name, email, orgName });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1E1E1E]">Pengaturan</h1>
            <p className="mt-1 text-sm text-[#666666]">Kelola akun, informasi Wedding Organizer, dan akses anggota tim Anda.</p>
          </div>
          {isSaved && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 animate-fade-in self-start sm:self-center">
              <Check className="h-3.5 w-3.5" />
              <span>Perubahan Berhasil Disimpan!</span>
            </div>
          )}
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#ECE7E1] pb-4">
          <button 
            onClick={() => setActiveSubTab("profil")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              activeSubTab === "profil" ? "bg-[#1E1E1E] text-white" : "text-[#666666] hover:bg-white"
            }`}
          >
            Profil Pengguna
          </button>
          <button 
            onClick={() => setActiveSubTab("organisasi")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              activeSubTab === "organisasi" ? "bg-[#1E1E1E] text-white" : "text-[#666666] hover:bg-white"
            }`}
          >
            Informasi WO
          </button>
          <button 
            onClick={() => setActiveSubTab("tim")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              activeSubTab === "tim" ? "bg-[#1E1E1E] text-white" : "text-[#666666] hover:bg-white"
            }`}
          >
            Anggota Tim
          </button>
        </div>

        {/* Dynamic Settings Content */}
        <div className="rounded-2xl border border-[#ECE7E1] bg-white p-6 max-w-2xl text-left shadow-soft">
          {activeSubTab === "profil" && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-[#ECE7E1] pb-4">
                <User className="h-5 w-5 text-[#D4AF37]" />
                <h2 className="font-heading text-xl font-bold text-[#1E1E1E]">Profil Pengguna</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666]">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 px-4 py-2.5 text-sm focus:border-[#D4AF37] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666]">Alamat Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    disabled
                    title="Email tidak dapat diubah dari sini. Hubungi admin untuk perubahan email."
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/20 px-4 py-2.5 text-sm text-[#666666] cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#666666] mt-1">Email tidak dapat diubah langsung untuk keamanan akun.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666]">Jabatan / Role</label>
                  <input 
                    type="text" 
                    disabled 
                    defaultValue="Owner (Pemilik Workspace)" 
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/20 px-4 py-2.5 text-sm text-[#666666]"
                  />
                </div>
              </div>
              
              <button type="submit" className="rounded-full bg-[#1E1E1E] text-white px-6 py-2.5 text-xs font-semibold hover:scale-[1.01] transition-transform">
                Simpan Perubahan
              </button>
            </form>
          )}

          {activeSubTab === "organisasi" && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-[#ECE7E1] pb-4">
                <Building className="h-5 w-5 text-[#D4AF37]" />
                <h2 className="font-heading text-xl font-bold text-[#1E1E1E]">Informasi Wedding Organizer</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666]">Nama Agensi / WO</label>
                  <input 
                    type="text" 
                    value={orgName} 
                    onChange={(e) => setOrgName(e.target.value)}
                    className="mt-1.5 block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 px-4 py-2.5 text-sm focus:border-[#D4AF37] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666]">Rencana Langganan (Plan)</label>
                  <div className="mt-1.5 flex items-center justify-between rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1E1E1E]">Plan Professional</p>
                      <p className="text-[11px] text-[#666666] mt-0.5">Rp 299.000/bulan • Diperbarui otomatis Juni 1, 2026</p>
                    </div>
                    <span className="rounded-full bg-[#EFD6D2] px-3 py-1 text-[10px] font-semibold text-[#1E1E1E] uppercase">Aktif</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="rounded-full bg-[#1E1E1E] text-white px-6 py-2.5 text-xs font-semibold hover:scale-[1.01] transition-transform">
                Simpan Perubahan
              </button>
            </form>
          )}

          {activeSubTab === "tim" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#ECE7E1] pb-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#D4AF37]" />
                  <h2 className="font-heading text-xl font-bold text-[#1E1E1E]">Akses Anggota Tim</h2>
                </div>
                <button 
                  onClick={() => alert("Fitur undang tim akan hadir di update berikutnya.")}
                  className="inline-flex items-center gap-1 rounded-full bg-[#1E1E1E] px-3 py-1.5 text-[11px] font-semibold text-white cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Undang Tim
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#ECE7E1]/50 pb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1E1E1E]">{user?.name || "Pengguna"}</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">{user?.email || "user@wedora.id"} • Owner</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">Aktif</span>
                </div>
                {isDemoAccount() && (
                  <>
                    <div className="flex items-center justify-between border-b border-[#ECE7E1]/50 pb-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1E1E1E]">Budi Santoso</p>
                        <p className="text-[11px] text-[#666666] mt-0.5">budi@amara-wo.com • Admin</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">Aktif</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1E1E1E]">Lina Permata</p>
                        <p className="text-[11px] text-[#666666] mt-0.5">lina@amara-wo.com • Staff / Kordinator</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">Aktif</span>
                    </div>
                  </>
                )}
                {!isDemoAccount() && (
                  <div className="rounded-xl border border-dashed border-[#ECE7E1] bg-[#FAF7F2]/30 p-6 text-center space-y-2">
                    <Users className="h-8 w-8 text-[#D4AF37] mx-auto" />
                    <p className="text-xs text-[#666666]">Undang anggota tim untuk berkolaborasi</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

