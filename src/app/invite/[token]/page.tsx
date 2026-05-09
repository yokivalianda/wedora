"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Users, ArrowRight, AlertCircle } from "lucide-react";

interface InvitePayload {
  ownerEmail: string;
  orgName: string;
  inviteeEmail: string;
  role: "admin" | "staff";
  exp: number; // unix timestamp ms
}

function decodeToken(token: string): InvitePayload | null {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff / Koordinator",
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [payload, setPayload] = useState<InvitePayload | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    if (!token) { setIsInvalid(true); return; }
    const decoded = decodeToken(token);
    if (!decoded) { setIsInvalid(true); return; }
    if (Date.now() > decoded.exp) { setIsExpired(true); setPayload(decoded); return; }
    setPayload(decoded);
  }, [token]);

  const registerUrl = payload
    ? `/register?email=${encodeURIComponent(payload.inviteeEmail)}&org=${encodeURIComponent(payload.orgName)}&role=${payload.role}&token=${token}`
    : "/register";

  if (isInvalid) {
    return (
      <div className="flex min-h-screen bg-[#FAF7F2] items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-[#1E1E1E]">Link Tidak Valid</h2>
          <p className="text-sm text-[#666666]">Link undangan ini tidak dapat dikenali atau telah rusak. Minta owner untuk mengirim ulang undangan.</p>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-[#1E1E1E] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  if (isExpired && payload) {
    return (
      <div className="flex min-h-screen bg-[#FAF7F2] items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-[#1E1E1E]">Link Kedaluwarsa</h2>
          <p className="text-sm text-[#666666]">
            Undangan ke <span className="font-semibold">{payload.orgName}</span> sudah tidak berlaku (kedaluwarsa 7 hari). Minta owner untuk mengirim ulang undangan.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-[#1E1E1E] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  if (!payload) return null;

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#ECE7E1] bg-white p-8 shadow-card space-y-6 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F2] text-[#D4AF37]">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="text-xs font-semibold text-[#666666] tracking-widest uppercase">Wedora</p>
        </div>

        {/* Pesan undangan */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F2] border border-[#ECE7E1] px-3 py-1">
            <Users className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-xs font-semibold text-[#666666]">Undangan Tim</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-[#1E1E1E] leading-snug">
            Anda diundang bergabung ke
          </h1>
          <p className="text-xl font-bold text-[#D4AF37]">{payload.orgName}</p>
          <p className="text-sm text-[#666666]">
            sebagai <span className="font-semibold text-[#1E1E1E]">{ROLE_LABELS[payload.role]}</span>
          </p>
        </div>

        {/* Info email */}
        <div className="rounded-xl border border-[#ECE7E1] bg-[#FAF7F2]/60 px-4 py-3 text-left space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Undangan untuk</p>
          <p className="text-sm font-semibold text-[#1E1E1E]">{payload.inviteeEmail}</p>
          <p className="text-[11px] text-[#666666]">
            Gunakan email ini saat mendaftar agar otomatis bergabung ke workspace.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href={registerUrl}
            className="flex items-center justify-center gap-2 w-full rounded-full bg-[#1E1E1E] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Daftar & Bergabung Sekarang <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/login?email=${encodeURIComponent(payload.inviteeEmail)}`}
            className="flex items-center justify-center gap-2 w-full rounded-full border border-[#ECE7E1] bg-white px-6 py-3 text-sm font-semibold text-[#666666] hover:bg-[#FAF7F2] transition-colors"
          >
            Sudah punya akun? Masuk
          </Link>
        </div>

        <p className="text-[10px] text-[#999]">
          Link undangan berlaku 7 hari sejak dikirim.
        </p>
      </div>
    </div>
  );
}
