"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, Lock, Mail, User, Eye, EyeOff, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface InvitePayload {
  ownerEmail: string;
  orgName: string;
  inviteeEmail: string;
  role: "admin" | "staff";
  exp: number;
}

function decodeInviteToken(token: string): InvitePayload | null {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteInfo, setInviteInfo] = useState<InvitePayload | null>(null);

  // Baca query param dari invite link
  useEffect(() => {
    const inviteToken = searchParams?.get("token");
    const emailParam = searchParams?.get("email");
    const orgParam = searchParams?.get("org");

    if (inviteToken) {
      const decoded = decodeInviteToken(inviteToken);
      if (decoded && Date.now() < decoded.exp) {
        setInviteInfo(decoded);
        setEmail(decoded.inviteeEmail);
      }
    } else if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.onboardingCompleted) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    }
  }, [isAuthenticated, user, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await register(name, email, password);
    setIsLoading(false);
    if (res.success) {
      router.push("/onboarding");
    } else {
      setError(res.error || "Gagal membuat akun.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#ECE7E1] bg-white p-8 shadow-card">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF7F2] text-[#D4AF37]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-[#1E1E1E]">
            {inviteInfo ? "Terima Undangan" : "Mulai Langkah Anggun Anda"}
          </h2>
          <p className="mt-2 text-sm text-[#666666]">
            {inviteInfo
              ? `Daftarkan akun untuk bergabung ke workspace ${inviteInfo.orgName}`
              : "Daftarkan akun Wedora baru untuk bisnis WO Anda"}
          </p>
          {/* Banner undangan */}
          {inviteInfo ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#FAF7F2] px-4 py-3 text-left">
              <Users className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#1E1E1E]">
                  Diundang ke {inviteInfo.orgName}
                </p>
                <p className="text-[11px] text-[#666666]">
                  sebagai{" "}
                  <span className="font-semibold">
                    {inviteInfo.role === "admin" ? "Admin" : "Staff / Koordinator"}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F2] border border-[#D4AF37]/40 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-xs font-semibold text-[#D4AF37]">
                Gratis 14 hari — tanpa kartu kredit
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 text-left animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#1E1E1E]">
                Nama Lengkap
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-10 pr-4 text-sm text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  placeholder="Sari Dewi"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1E1E1E]">
                Alamat Email
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => !inviteInfo && setEmail(e.target.value)}
                  readOnly={!!inviteInfo}
                  className={`block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-10 pr-4 text-sm text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] ${inviteInfo ? "cursor-not-allowed opacity-80" : ""}`}
                  placeholder="sari@bisniswo.com"
                />
              </div>
              {inviteInfo && (
                <p className="mt-1 text-[10px] text-[#666666]">Email dikunci sesuai undangan yang diterima.</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1E1E1E]">
                Kata Sandi
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-10 pr-10 text-sm text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#666666]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start text-sm">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-[#ECE7E1] text-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-xs leading-5 text-[#666666]">
              Saya menyetujui <a href="#" className="font-semibold text-[#D4AF37] hover:underline">Ketentuan Layanan</a> dan <a href="#" className="font-semibold text-[#D4AF37] hover:underline">Kebijakan Privasi</a> Wedora.
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-full bg-[#1E1E1E] px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  Membuat Akun...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {inviteInfo ? "Daftar & Bergabung ke Tim" : "Daftar & Buat Workspace"} <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-[#666666]">Sudah memiliki akun?</span>{" "}
          <Link href="/login" className="font-semibold text-[#D4AF37] hover:underline">
            Masuk Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
