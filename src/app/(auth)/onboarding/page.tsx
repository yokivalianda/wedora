"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Building, MapPin, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding, isAuthenticated, user } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [location, setLocation] = useState("");
  const [teamSize, setTeamSize] = useState("1-5");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.onboardingCompleted) {
      // If already completed, go to dashboard
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await completeOnboarding(orgName, location, teamSize);
    setIsLoading(false);
    router.push("/dashboard");
  };


  return (
    <div className="flex min-h-screen bg-[#FAF7F2] items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[#ECE7E1] bg-white p-8 shadow-card">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF7F2] text-[#D4AF37]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-[#1E1E1E]">
            Atur Workspace Anda
          </h2>
          <p className="mt-2 text-sm text-[#666666]">
            Sesuaikan Wedora dengan identitas bisnis Wedding Organizer Anda
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-[#1E1E1E]">
                Nama Wedding Organizer / Agensi
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  id="orgName"
                  name="orgName"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-10 pr-4 text-sm text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  placeholder="Contoh: Amara Wedding Organizer"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-[#1E1E1E]">
                Kota Domisili Bisnis
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-10 pr-4 text-sm text-[#1E1E1E] placeholder-[#666666]/50 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  placeholder="Contoh: Jakarta Selatan"
                />
              </div>
            </div>

            <div>
              <label htmlFor="teamSize" className="block text-sm font-medium text-[#1E1E1E]">
                Jumlah Anggota Tim (Kordinator / Admin)
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
                  <Users className="h-4 w-4" />
                </div>
                <select
                  id="teamSize"
                  name="teamSize"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="block w-full rounded-full border border-[#ECE7E1] bg-[#FAF7F2]/50 py-2.5 pl-10 pr-4 text-sm text-[#1E1E1E] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] appearance-none"
                >
                  <option value="1">Hanya Saya Sendiri (Solo Planner)</option>
                  <option value="1-5">2 - 5 Orang</option>
                  <option value="6-15">6 - 15 Orang</option>
                  <option value="16+">Lebih dari 15 Orang</option>
                </select>
              </div>
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
                  Menyiapkan Workspace...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Selesaikan Setup & Masuk <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
