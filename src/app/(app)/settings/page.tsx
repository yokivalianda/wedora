"use client";

import AppLayout from "@/components/layout/AppLayout";
import { User, Building, Plus, Users, Check, Clock, AlertTriangle, Crown, X, Mail, ChevronDown, Trash2, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { isDemoAccount } from "@/lib/demo";

// ── Tipe data anggota tim ──────────────────────────────────────
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "staff";
  status: "aktif" | "menunggu";
  joinedAt?: string;
  invitedAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff / Koordinator",
};

const STORAGE_KEY = "wedora_team_members";

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<"profil" | "organisasi" | "tim">("profil");
  const { user, updateProfile, trialDaysLeft, isTrialExpired } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // ── State tim ─────────────────────────────────────────────────
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setOrgName(user.orgName || "");

      // Load anggota tim dari localStorage
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved: TeamMember[] = raw ? JSON.parse(raw) : [];

      // Pastikan owner selalu ada di daftar
      const ownerExists = saved.some((m) => m.email.toLowerCase() === user.email.toLowerCase());
      if (!ownerExists) {
        const ownerEntry: TeamMember = {
          id: "owner-" + user.email,
          name: user.name,
          email: user.email,
          role: "owner",
          status: "aktif",
          joinedAt: new Date().toISOString(),
        };
        const withOwner = [ownerEntry, ...saved];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(withOwner));
        setMembers(withOwner);
      } else {
        // Demo: inject contoh anggota jika akun demo dan belum ada tambahan
        if (isDemoAccount() && saved.length <= 1) {
          const demoExtras: TeamMember[] = [
            { id: "demo-2", name: "Budi Santoso", email: "budi@amara-wo.com", role: "admin", status: "aktif", joinedAt: new Date().toISOString() },
            { id: "demo-3", name: "Lina Permata", email: "lina@amara-wo.com", role: "staff", status: "aktif", joinedAt: new Date().toISOString() },
          ];
          const withDemo = [...saved, ...demoExtras];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(withDemo));
          setMembers(withDemo);
        } else {
          setMembers(saved);
        }
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name, email, orgName });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // ── Undang anggota baru ───────────────────────────────────────
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");

    if (!inviteEmail.trim()) { setInviteError("Email wajib diisi."); return; }
    const alreadyExists = members.some((m) => m.email.toLowerCase() === inviteEmail.toLowerCase());
    if (alreadyExists) { setInviteError("Email ini sudah ada di daftar tim."); return; }

    const newMember: TeamMember = {
      id: "inv-" + Date.now(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      status: "menunggu",
      invitedAt: new Date().toISOString(),
    };

    const updated = [...members, newMember];
    setMembers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("staff");
    }, 2000);
  };

  // ── Hapus anggota ─────────────────────────────────────────────
  const handleRemoveMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // ── Format tanggal trial ──────────────────────────────────────
  const trialEndDate = user?.trialEndsAt
    ? new Date(user.trialEndsAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : null;

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
                  <div className="mt-1.5 rounded-2xl border border-[#ECE7E1] bg-[#FAF7F2]/30 p-4 space-y-3">
                    {/* Badge plan */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-[#D4AF37]" />
                        <span className="text-sm font-semibold text-[#1E1E1E]">
                          {user?.plan === "trial" ? "Trial Gratis" :
                           user?.plan === "starter" ? "Starter" :
                           user?.plan === "professional" ? "Professional" :
                           user?.plan === "agency" ? "Agency" : "Trial Gratis"}
                        </span>
                      </div>
                      {isTrialExpired ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-semibold text-red-700 uppercase">Kedaluwarsa</span>
                      ) : user?.plan === "trial" ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold text-amber-700 uppercase">Trial</span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold text-emerald-700 uppercase">Aktif</span>
                      )}
                    </div>

                    {/* Info trial */}
                    {user?.plan === "trial" && (
                      <div className={`rounded-xl p-3 flex items-start gap-3 ${isTrialExpired ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
                        {isTrialExpired ? (
                          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          {isTrialExpired ? (
                            <>
                              <p className="text-xs font-semibold text-red-700">Masa trial telah berakhir</p>
                              <p className="text-[11px] text-red-600 mt-0.5">Silakan upgrade ke paket berbayar untuk melanjutkan akses penuh.</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-semibold text-amber-700">
                                {trialDaysLeft !== null ? `${trialDaysLeft} hari tersisa` : "Trial aktif"}
                              </p>
                              {trialEndDate && (
                                <p className="text-[11px] text-amber-600 mt-0.5">Trial berakhir pada {trialEndDate}</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tombol upgrade */}
                    {(user?.plan === "trial" || !user?.plan) && (
                      <a
                        href="/#harga"
                        className="flex items-center justify-center gap-2 w-full rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B8960C] transition-colors"
                      >
                        <Crown className="h-3.5 w-3.5" />
                        Upgrade Paket Sekarang
                      </a>
                    )}
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
                  onClick={() => { setShowInviteModal(true); setInviteError(""); setInviteSent(false); }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#1E1E1E] px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" /> Undang Tim
                </button>
              </div>

              {/* Daftar anggota */}
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-xl border border-[#ECE7E1] bg-[#FAF7F2]/30 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold text-xs">
                        {member.name[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1E1E1E] truncate">{member.name}</p>
                        <p className="text-[11px] text-[#666666] truncate">{member.email} · {ROLE_LABELS[member.role]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        member.status === "aktif"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {member.status === "aktif" ? "Aktif" : "Menunggu"}
                      </span>
                      {member.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-[#666666] hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                          title="Hapus anggota"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {members.length <= 1 && !isDemoAccount() && (
                  <div className="rounded-xl border border-dashed border-[#ECE7E1] bg-[#FAF7F2]/30 p-8 text-center space-y-2">
                    <Users className="h-8 w-8 text-[#D4AF37]/60 mx-auto" />
                    <p className="text-sm font-semibold text-[#1E1E1E]">Belum ada anggota tim</p>
                    <p className="text-xs text-[#666666]">Klik tombol "Undang Tim" untuk mengajak rekan kerja bergabung ke workspace ini.</p>
                  </div>
                )}
              </div>

              {/* Keterangan cara kerja */}
              <div className="rounded-xl bg-[#FAF7F2] border border-[#ECE7E1] p-4 space-y-1.5">
                <p className="text-xs font-bold text-[#1E1E1E]">Cara kerja undangan tim:</p>
                <ul className="space-y-1 text-[11px] text-[#666666] list-none">
                  <li className="flex items-start gap-1.5"><span className="text-[#D4AF37] font-bold mt-0.5">1.</span> Masukkan email rekan &amp; pilih role (Admin atau Staff)</li>
                  <li className="flex items-start gap-1.5"><span className="text-[#D4AF37] font-bold mt-0.5">2.</span> Anggota muncul di daftar dengan status <span className="font-semibold text-amber-600">Menunggu</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-[#D4AF37] font-bold mt-0.5">3.</span> Bagikan link atau email undangan ke rekan Anda</li>
                  <li className="flex items-start gap-1.5"><span className="text-[#D4AF37] font-bold mt-0.5">4.</span> Setelah mereka daftar &amp; login, status berubah menjadi <span className="font-semibold text-emerald-600">Aktif</span></li>
                </ul>
                <p className="text-[10px] text-[#999] mt-2">* Fitur email otomatis tersedia pada paket Professional ke atas.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Undang Tim ─────────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#ECE7E1] bg-white p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="font-heading text-lg font-bold text-[#1E1E1E]">Undang Anggota Tim</h3>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-[#666666] hover:text-[#1E1E1E] p-1 rounded-full hover:bg-[#FAF7F2]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteSent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-semibold text-[#1E1E1E]">Undangan berhasil dikirim!</p>
                <p className="text-xs text-[#666666]">{inviteEmail} telah ditambahkan ke daftar tim dengan status Menunggu.</p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">Email Anggota</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666] pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="rekan@bisniswo.com"
                      className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-10 pr-4 text-sm focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">Role / Jabatan</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666] pointer-events-none" />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "admin" | "staff")}
                      className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-4 pr-10 text-sm focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] appearance-none"
                    >
                      <option value="admin">Admin — kelola proyek &amp; keuangan</option>
                      <option value="staff">Staff / Koordinator — lihat &amp; update proyek</option>
                    </select>
                  </div>
                </div>

                {inviteError && (
                  <p className="text-xs text-red-600 font-medium">⚠️ {inviteError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 rounded-full border border-[#ECE7E1] bg-white px-4 py-2.5 text-xs font-semibold text-[#666666] hover:bg-[#FAF7F2] transition-colors">
                    Batal
                  </button>
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#1E1E1E] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                    <Send className="h-3.5 w-3.5" />
                    Kirim Undangan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

