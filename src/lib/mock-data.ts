import {
  WeddingProject, Task, Payment, Vendor,
  Activity, Notification, DashboardStats, User, Organization, TimelineEvent,
} from "@/types";

export const mockOrganization: Organization = {
  id: "org-001", name: "Amara Wedding Organizer", slug: "amara-wo",
  plan: "professional", created_at: "2024-01-15T00:00:00Z",
};

export const mockUsers: User[] = [
  { id: "user-001", org_id: "org-001", email: "yoki@amara-wo.com", full_name: "Yoki Valianda", role: "owner", phone: "+62 812 3456 7890", created_at: "2024-01-15T00:00:00Z" },
  { id: "user-002", org_id: "org-001", email: "budi@amara-wo.com", full_name: "Budi Santoso", role: "admin", phone: "+62 813 1234 5678", created_at: "2024-02-01T00:00:00Z" },
  { id: "user-003", org_id: "org-001", email: "lina@amara-wo.com", full_name: "Lina Permata", role: "staff", phone: "+62 856 9876 5432", created_at: "2024-02-15T00:00:00Z" },
  { id: "user-004", org_id: "org-001", email: "rizky@amara-wo.com", full_name: "Rizky Hidayat", role: "staff", phone: "+62 878 1111 2222", created_at: "2024-03-01T00:00:00Z" },
];

export const currentUser = mockUsers[0];

export const mockProjects: WeddingProject[] = [
  {
    id: "proj-001", org_id: "org-001", client_id: "client-001",
    bride_name: "Anisa Putri", groom_name: "Reza Firmansyah",
    wedding_date: "2026-06-14", venue: "The Ritz-Carlton Jakarta",
    venue_address: "Jl. MH Thamrin No.9, Jakarta Pusat", guest_count: 500,
    budget_total: 250_000_000, budget_used: 180_000_000,
    status: "in_progress", notes: "Tema garden party, nuansa nude & dusty pink.",
    assigned_staff: ["user-002", "user-003"], tags: ["garden", "mewah"],
    created_at: "2025-12-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z",
  },
  {
    id: "proj-002", org_id: "org-001", client_id: "client-002",
    bride_name: "Maya Sari", groom_name: "Dian Pratama",
    wedding_date: "2026-07-20", venue: "Ayana Midplaza Jakarta",
    venue_address: "Jl. Jend. Sudirman Kav 10-11, Jakarta", guest_count: 300,
    budget_total: 180_000_000, budget_used: 60_000_000,
    status: "dp_paid", notes: "Sage green dan gold modern elegant.",
    assigned_staff: ["user-003", "user-004"], tags: ["modern", "green"],
    created_at: "2026-01-10T00:00:00Z", updated_at: "2026-04-15T00:00:00Z",
  },
  {
    id: "proj-003", org_id: "org-001", client_id: "client-003",
    bride_name: "Citra Lestari", groom_name: "Bagus Nugroho",
    wedding_date: "2026-08-30", venue: "Shangri-La Hotel Surabaya",
    venue_address: "Jl. Mayjend Sungkono No.120, Surabaya", guest_count: 400,
    budget_total: 200_000_000, budget_used: 0,
    status: "planning", notes: "Pernikahan tradisional Jawa sentuhan modern.",
    assigned_staff: ["user-002"], tags: ["tradisional", "jawa"],
    created_at: "2026-02-20T00:00:00Z", updated_at: "2026-05-05T00:00:00Z",
  },
  {
    id: "proj-004", org_id: "org-001", client_id: "client-004",
    bride_name: "Dewi Kartika", groom_name: "Andi Wijaya",
    wedding_date: "2025-11-10", venue: "Taman Sari Yogyakarta",
    guest_count: 250, budget_total: 150_000_000, budget_used: 150_000_000,
    status: "completed", notes: "Sukses! Rating 5/5 dari klien.",
    assigned_staff: ["user-002", "user-003"], tags: ["jogja"],
    created_at: "2025-06-01T00:00:00Z", updated_at: "2025-11-15T00:00:00Z",
  },
  {
    id: "proj-005", org_id: "org-001", client_id: "client-005",
    bride_name: "Rina Maharani", groom_name: "Fajar Setiawan",
    wedding_date: "2026-09-15", venue: "Four Seasons Bali at Jimbaran Bay",
    venue_address: "Jimbaran, Bali", guest_count: 150,
    budget_total: 320_000_000, budget_used: 0,
    status: "inquiry", notes: "Intimate destination wedding di Bali.",
    assigned_staff: [], tags: ["bali", "destination"],
    created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-05T00:00:00Z",
  },
];

export const mockTasks: Task[] = [
  { id: "task-001", org_id: "org-001", project_id: "proj-001", title: "Konfirmasi menu katering dengan vendor", assignee_id: "user-003", assignee_name: "Lina Permata", due_date: "2026-05-20", status: "in_progress", priority: "high", created_at: "2026-05-01T00:00:00Z" },
  { id: "task-002", org_id: "org-001", project_id: "proj-001", title: "Fitting gaun pengantin - sesi 2", assignee_id: "user-003", assignee_name: "Lina Permata", due_date: "2026-05-15", status: "todo", priority: "high", created_at: "2026-05-01T00:00:00Z" },
  { id: "task-003", org_id: "org-001", project_id: "proj-001", title: "Review desain dekorasi dari vendor", assignee_id: "user-002", assignee_name: "Budi Santoso", due_date: "2026-05-25", status: "todo", priority: "medium", created_at: "2026-05-02T00:00:00Z" },
  { id: "task-004", org_id: "org-001", project_id: "proj-001", title: "Kirim undangan digital batch pertama", assignee_id: "user-004", assignee_name: "Rizky Hidayat", due_date: "2026-05-30", status: "todo", priority: "medium", created_at: "2026-05-02T00:00:00Z" },
  { id: "task-005", org_id: "org-001", project_id: "proj-002", title: "Survey venue Ayana Midplaza", assignee_id: "user-002", assignee_name: "Budi Santoso", due_date: "2026-05-18", status: "done", priority: "high", completed_at: "2026-05-10T00:00:00Z", created_at: "2026-04-20T00:00:00Z" },
  { id: "task-006", org_id: "org-001", project_id: "proj-002", title: "Buat mood board dekorasi sage green", assignee_id: "user-003", assignee_name: "Lina Permata", due_date: "2026-05-22", status: "in_progress", priority: "medium", created_at: "2026-04-25T00:00:00Z" },
  { id: "task-007", org_id: "org-001", project_id: "proj-003", title: "Persiapkan proposal pernikahan adat Jawa", assignee_id: "user-002", assignee_name: "Budi Santoso", due_date: "2026-06-01", status: "todo", priority: "low", created_at: "2026-05-05T00:00:00Z" },
  { id: "task-008", org_id: "org-001", title: "Follow up semua klien aktif bulan Mei", assignee_id: "user-001", assignee_name: "Yoki Valianda", due_date: "2026-05-31", status: "todo", priority: "medium", created_at: "2026-05-06T00:00:00Z" },
];

export const mockPayments: Payment[] = [
  { id: "pay-001", org_id: "org-001", project_id: "proj-001", type: "dp", amount: 75_000_000, status: "dibayar", payment_date: "2025-12-15", notes: "Down payment 30%", created_at: "2025-12-15T00:00:00Z" },
  { id: "pay-002", org_id: "org-001", project_id: "proj-001", type: "pelunasan", amount: 175_000_000, status: "menunggu", due_date: "2026-06-01", notes: "Pelunasan 2 minggu sebelum hari H", created_at: "2026-01-01T00:00:00Z" },
  { id: "pay-003", org_id: "org-001", project_id: "proj-002", type: "dp", amount: 54_000_000, status: "dibayar", payment_date: "2026-02-01", notes: "DP 30%", created_at: "2026-02-01T00:00:00Z" },
  { id: "pay-004", org_id: "org-001", project_id: "proj-002", type: "pelunasan", amount: 126_000_000, status: "menunggu", due_date: "2026-07-01", created_at: "2026-02-01T00:00:00Z" },
  { id: "pay-005", org_id: "org-001", project_id: "proj-004", type: "dp", amount: 45_000_000, status: "dibayar", payment_date: "2025-06-15", created_at: "2025-06-15T00:00:00Z" },
  { id: "pay-006", org_id: "org-001", project_id: "proj-004", type: "pelunasan", amount: 105_000_000, status: "dibayar", payment_date: "2025-10-25", created_at: "2025-10-25T00:00:00Z" },
];

export const mockVendors: Vendor[] = [
  { id: "vend-001", org_id: "org-001", name: "Lumiere Photography", category: "foto_video", contact_name: "Aldo Christoper", contact_phone: "+62 812 9999 1111", rating: 5, price_range: "Rp 25jt - 80jt", notes: "Spesialis foto editorial & sinematik.", created_at: "2024-03-01T00:00:00Z" },
  { id: "vend-002", org_id: "org-001", name: "La Maison Florist & Decoration", category: "dekorasi", contact_name: "Vinny Setiawan", contact_phone: "+62 877 8888 2222", rating: 5, price_range: "Rp 30jt - 150jt", created_at: "2024-03-15T00:00:00Z" },
  { id: "vend-003", org_id: "org-001", name: "Sriwijaya Catering", category: "katering", contact_name: "Pak Hendra", contact_phone: "+62 811 7777 3333", rating: 4, price_range: "Rp 150rb - 400rb/pax", created_at: "2024-04-01T00:00:00Z" },
  { id: "vend-004", org_id: "org-001", name: "Riara Bridal House", category: "gaun", contact_name: "Riara", contact_phone: "+62 856 6666 4444", rating: 5, price_range: "Rp 15jt - 60jt", created_at: "2024-04-15T00:00:00Z" },
  { id: "vend-005", org_id: "org-001", name: "MC Raka & Team", category: "mc", contact_name: "Raka Aditya", contact_phone: "+62 822 5555 5555", rating: 4, price_range: "Rp 5jt - 15jt", created_at: "2024-05-01T00:00:00Z" },
];

export const mockActivities: Activity[] = [
  { id: "act-001", org_id: "org-001", user_id: "user-003", user_name: "Lina Permata", action: "menyelesaikan tugas", entity_type: "task", entity_name: "Survey venue Ayana Midplaza", created_at: "2026-05-10T09:30:00Z" },
  { id: "act-002", org_id: "org-001", user_id: "user-001", user_name: "Yoki Valianda", action: "menambahkan proyek baru", entity_type: "project", entity_name: "Rina & Fajar", created_at: "2026-05-09T14:00:00Z" },
  { id: "act-003", org_id: "org-001", user_id: "user-002", user_name: "Budi Santoso", action: "mengupdate status pembayaran", entity_type: "payment", entity_name: "DP Maya & Dian", created_at: "2026-05-08T11:15:00Z" },
  { id: "act-004", org_id: "org-001", user_id: "user-004", user_name: "Rizky Hidayat", action: "menambahkan vendor baru", entity_type: "vendor", entity_name: "MC Raka & Team", created_at: "2026-05-07T16:45:00Z" },
  { id: "act-005", org_id: "org-001", user_id: "user-001", user_name: "Yoki Valianda", action: "mengupdate detail proyek", entity_type: "project", entity_name: "Anisa & Reza", created_at: "2026-05-07T10:00:00Z" },
];

export const mockNotifications: Notification[] = [
  { id: "notif-001", user_id: "user-001", title: "Pembayaran jatuh tempo", body: "Pelunasan Anisa & Reza jatuh tempo 1 Juni 2026 (Rp 175 juta).", read: false, type: "payment", reference_id: "pay-002", created_at: "2026-05-07T08:00:00Z" },
  { id: "notif-002", user_id: "user-001", title: "Tugas mendekati deadline", body: '"Konfirmasi menu katering" untuk Anisa & Reza jatuh tempo 20 Mei.', read: false, type: "task", reference_id: "task-001", created_at: "2026-05-06T09:00:00Z" },
  { id: "notif-003", user_id: "user-001", title: "Proyek baru ditambahkan", body: "Inquiry dari Rina & Fajar untuk pernikahan di Bali telah diterima.", read: true, type: "project", reference_id: "proj-005", created_at: "2026-05-05T14:30:00Z" },
];

export const mockDashboardStats: DashboardStats = {
  total_projects: 5, active_projects: 3, completed_projects: 1,
  upcoming_weddings: 4, total_revenue: 604_000_000,
  pending_payments: 301_000_000, total_clients: 5, tasks_due_today: 2,
};

export const mockTimeline: TimelineEvent[] = [
  { id: "tl-001", project_id: "proj-001", title: "Persiapan Pengantin Putri", description: "Makeup, rias, dan pemakaian gaun", time: "06:00", location: "Suite Room Lt. 12", pic: "Lina Permata", category: "preparation" },
  { id: "tl-002", project_id: "proj-001", title: "Persiapan Pengantin Putra", time: "07:00", location: "Suite Room Lt. 11", pic: "Rizky Hidayat", category: "preparation" },
  { id: "tl-003", project_id: "proj-001", title: "Akad Nikah", description: "Prosesi akad nikah sesuai syariat Islam", time: "09:00", location: "Ballroom A", pic: "Sari Dewi Rahayu", category: "ceremony" },
  { id: "tl-004", project_id: "proj-001", title: "Sesi Foto Keluarga", time: "11:00", location: "Taman Outdoor Lt. 2", pic: "Budi Santoso", category: "ceremony" },
  { id: "tl-005", project_id: "proj-001", title: "Resepsi Pernikahan", description: "Penyambutan tamu, makan bersama, hiburan", time: "12:00", location: "Grand Ballroom", pic: "Sari Dewi Rahayu", category: "reception" },
  { id: "tl-006", project_id: "proj-001", title: "Penutupan & Bersih-bersih", time: "17:00", location: "Grand Ballroom", pic: "Budi Santoso", category: "lainnya" },
];

export const mockRevenueData = [
  { bulan: "Jan", pendapatan: 45_000_000, pengeluaran: 32_000_000 },
  { bulan: "Feb", pendapatan: 60_000_000, pengeluaran: 41_000_000 },
  { bulan: "Mar", pendapatan: 38_000_000, pengeluaran: 25_000_000 },
  { bulan: "Apr", pendapatan: 75_000_000, pengeluaran: 52_000_000 },
  { bulan: "Mei", pendapatan: 90_000_000, pengeluaran: 63_000_000 },
  { bulan: "Jun", pendapatan: 120_000_000, pengeluaran: 85_000_000 },
];
