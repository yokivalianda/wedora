"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

    const res = await login(email, password);
    setIsLoading(false);
    if (!res.success) {
      setError(res.error || "Gagal masuk.");
    }
    // Redirect is handled by the useEffect above based on isAuthenticated & onboarding state
  };

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#ECE7E1] bg-white p-8 shadow-card">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF7F2] text-[#D4AF37]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-[#1E1E1E]">
            Selamat Datang Kembali
          </h2>
          <p className="mt-2 text-sm text-[#666666]">
            Masuk ke workspace Wedora Anda
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 text-left animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

          <div className="space-y-4 rounded-md">
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-10 pr-4 text-sm text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  placeholder="nama@email.com"
                />
              </div>
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-10 pr-4 text-sm text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-[#ECE7E1] text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-[#666666]">
                Ingat perangkat ini
              </label>
            </div>

            <div className="text-xs">
              <a href="#" className="font-medium text-[#D4AF37] hover:underline">
                Lupa kata sandi?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-full bg-[#1E1E1E] px-4 py-3 text-sm font-semibold text-white shadow-md transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  Memverifikasi...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Masuk ke Ruang Kerja <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-[#666666]">Belum memiliki akun?</span>{" "}
          <Link href="/register" className="font-semibold text-[#D4AF37] hover:underline">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
