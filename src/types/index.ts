// ============================================================
// WEDORA — Core TypeScript Types
// ============================================================

export type UserRole = "owner" | "admin" | "staff" | "client";

export type ProjectStatus =
  | "inquiry"
  | "planning"
  | "dp_paid"
  | "in_progress"
  | "completed";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type PaymentType = "dp" | "pelunasan" | "vendor" | "pengeluaran";
export type PaymentStatus = "menunggu" | "dibayar" | "terlambat";

export type VendorCategory =
  | "foto_video"
  | "dekorasi"
  | "katering"
  | "hiburan"
  | "gaun"
  | "mc"
  | "makeup"
  | "venue"
  | "lainnya";

export type DocumentType =
  | "kontrak"
  | "invoice"
  | "moodboard"
  | "foto"
  | "dokumen";

// ============================================================
// USER & ORGANIZATION
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  plan: "starter" | "professional" | "agency";
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

// ============================================================
// WEDDING PROJECT
// ============================================================

export interface WeddingProject {
  id: string;
  org_id: string;
  client_id: string;

  // Pasangan
  bride_name: string;
  groom_name: string;

  // Detail
  wedding_date: string;
  venue: string;
  venue_address?: string;
  guest_count?: number;
  budget_total: number;
  budget_used: number;

  // Meta
  status: ProjectStatus;
  notes?: string;
  cover_image?: string;
  assigned_staff: string[];
  tags?: string[];

  created_at: string;
  updated_at: string;
}

// ============================================================
// TASK
// ============================================================

export interface Task {
  id: string;
  org_id: string;
  project_id?: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assignee_name?: string;
  due_date?: string;
  status: TaskStatus;
  priority: TaskPriority;
  completed_at?: string;
  created_at: string;
}

// ============================================================
// PAYMENT
// ============================================================

export interface Payment {
  id: string;
  org_id: string;
  project_id: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  payment_date?: string;
  due_date?: string;
  notes?: string;
  created_at: string;
}

// ============================================================
// VENDOR
// ============================================================

export interface Vendor {
  id: string;
  org_id: string;
  name: string;
  category: VendorCategory;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  rating?: number;
  price_range?: string;
  notes?: string;
  created_at: string;
}

// ============================================================
// DOCUMENT
// ============================================================

export interface Document {
  id: string;
  org_id: string;
  project_id?: string;
  name: string;
  type: DocumentType;
  url: string;
  size?: number;
  uploaded_by: string;
  created_at: string;
}

// ============================================================
// NOTIFICATION & ACTIVITY
// ============================================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  type: "project" | "task" | "payment" | "system";
  reference_id?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  org_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  created_at: string;
}

// ============================================================
// TIMELINE EVENT
// ============================================================

export interface TimelineEvent {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  time: string;
  location?: string;
  pic?: string; // person in charge
  category: "ceremony" | "reception" | "preparation" | "vendor" | "lainnya";
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  upcoming_weddings: number;
  total_revenue: number;
  pending_payments: number;
  total_clients: number;
  tasks_due_today: number;
}
