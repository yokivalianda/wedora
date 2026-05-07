import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProjectStatus, TaskPriority, TaskStatus, VendorCategory } from "@/types";

// ============================================================
// CLASS UTILITY
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// CURRENCY
// ============================================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(0)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${amount}`;
}

// ============================================================
// DATE
// ============================================================
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  if (diffDays === -1) return "Kemarin";
  if (diffDays > 0 && diffDays <= 7) return `${diffDays} hari lagi`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} hari lalu`;
  return formatDateShort(dateStr);
}

export function daysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// ============================================================
// PROJECT STATUS
// ============================================================
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  inquiry: "Inquiry",
  planning: "Perencanaan",
  dp_paid: "DP Dibayar",
  in_progress: "Berlangsung",
  completed: "Selesai",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  inquiry: "bg-slate-100 text-slate-600",
  planning: "bg-blue-50 text-blue-600",
  dp_paid: "bg-amber-50 text-amber-600",
  in_progress: "bg-rose-50 text-rose-600",
  completed: "bg-emerald-50 text-emerald-700",
};

// ============================================================
// TASK
// ============================================================
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Belum Dimulai",
  in_progress: "Sedang Dikerjakan",
  done: "Selesai",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-500",
  medium: "bg-amber-50 text-amber-600",
  high: "bg-rose-50 text-rose-600",
};

// ============================================================
// VENDOR CATEGORY
// ============================================================
export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  foto_video: "Foto & Video",
  dekorasi: "Dekorasi",
  katering: "Katering",
  hiburan: "Hiburan",
  gaun: "Gaun Pengantin",
  mc: "MC",
  makeup: "Makeup & Rias",
  venue: "Venue",
  lainnya: "Lainnya",
};

// ============================================================
// MISC
// ============================================================
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

export function calculateProgress(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((used / total) * 100), 100);
}
