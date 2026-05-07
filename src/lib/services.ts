import { supabase, isSupabaseConfigured } from "./supabase";
import { WeddingProject, Task, Payment, Vendor } from "@/types";
import { mockProjects, mockTasks, mockPayments, mockVendors } from "./mock-data";

// ============================================================
// LOCAL PERSISTENCE STORAGE HELPERS
// ============================================================
const getLocalStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
};

const setLocalStorage = <T>(key: string, data: T) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
};

// ============================================================
// 1. SERVICES FOR WEDDING PROJECTS
// ============================================================
export const projectService = {
  async getAll(): Promise<WeddingProject[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("wedding_projects")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) return data as WeddingProject[];
      } catch (err) {
        console.error("Failed to fetch from Supabase:", err);
      }
    }
    return getLocalStorage<WeddingProject[]>("wedora_projects", mockProjects);
  },

  async getById(id: string): Promise<WeddingProject | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("wedding_projects")
          .select("*")
          .eq("id", id)
          .single();
        if (!error && data) return data as WeddingProject;
      } catch (err) {
        console.error("Failed to fetch project by id from Supabase:", err);
      }
    }
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", mockProjects);
    return projects.find((p) => p.id === id) || null;
  },

  async create(project: WeddingProject): Promise<WeddingProject> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("wedding_projects")
          .insert({
            id: project.id,
            org_id: project.org_id,
            bride_name: project.bride_name,
            groom_name: project.groom_name,
            wedding_date: project.wedding_date,
            venue: project.venue,
            budget_total: project.budget_total,
            budget_used: project.budget_used,
            guest_count: project.guest_count,
            status: project.status,
            notes: project.notes,
            assigned_staff: project.assigned_staff
          })
          .select()
          .single();
        if (!error && data) return data as WeddingProject;
      } catch (err) {
        console.error("Failed to create project in Supabase:", err);
      }
    }
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", mockProjects);
    const updated = [project, ...projects];
    setLocalStorage("wedora_projects", updated);
    return project;
  }
};

// ============================================================
// 2. SERVICES FOR TASKS (CHECKLISTS)
// ============================================================
export const taskService = {
  async getAll(): Promise<Task[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) return data as Task[];
      } catch (err) {
        console.error("Failed to fetch tasks from Supabase:", err);
      }
    }
    return getLocalStorage<Task[]>("wedora_tasks", mockTasks);
  },

  async create(task: Task): Promise<Task> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            id: task.id,
            org_id: task.org_id,
            project_id: task.project_id || null,
            title: task.title,
            description: task.description || null,
            assignee_name: task.assignee_name || null,
            due_date: task.due_date || null,
            status: task.status,
            priority: task.priority
          })
          .select()
          .single();
        if (!error && data) return data as Task;
      } catch (err) {
        console.error("Failed to create task in Supabase:", err);
      }
    }
    const tasks = getLocalStorage<Task[]>("wedora_tasks", mockTasks);
    const updated = [task, ...tasks];
    setLocalStorage("wedora_tasks", updated);
    return task;
  },

  async toggle(id: string): Promise<Task | null> {
    const tasks = getLocalStorage<Task[]>("wedora_tasks", mockTasks);
    let targetTask: Task | null = null;
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const newStatus = t.status === "done" ? "todo" : "done";
        targetTask = {
          ...t,
          status: newStatus,
          completed_at: newStatus === "done" ? new Date().toISOString() : undefined
        };
        return targetTask;
      }
      return t;
    });

    if (isSupabaseConfigured()) {
      try {
        if (targetTask) {
          const { data, error } = await supabase
            .from("tasks")
            .update({ 
              status: (targetTask as Task).status, 
              completed_at: (targetTask as Task).completed_at || null 
            })
            .eq("id", id)
            .select()
            .single();
          if (!error && data) return data as Task;
        }
      } catch (err) {
        console.error("Failed to toggle task in Supabase:", err);
      }
    }

    setLocalStorage("wedora_tasks", updated);
    return targetTask;
  }
};

// ============================================================
// 3. SERVICES FOR PAYMENTS & BUDGETS
// ============================================================
export const paymentService = {
  async getAll(): Promise<Payment[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) return data as Payment[];
      } catch (err) {
        console.error("Failed to fetch payments from Supabase:", err);
      }
    }
    return getLocalStorage<Payment[]>("wedora_payments", mockPayments);
  },

  async create(payment: Payment): Promise<Payment> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("payments")
          .insert({
            id: payment.id,
            org_id: payment.org_id,
            project_id: payment.project_id,
            amount: payment.amount,
            type: payment.type,
            status: payment.status,
            payment_date: payment.payment_date || null,
            due_date: payment.due_date || null,
            notes: payment.notes || null
          })
          .select()
          .single();
        if (!error && data) return data as Payment;
      } catch (err) {
        console.error("Failed to create payment in Supabase:", err);
      }
    }
    const payments = getLocalStorage<Payment[]>("wedora_payments", mockPayments);
    const updated = [payment, ...payments];
    setLocalStorage("wedora_payments", updated);
    return payment;
  }
};

// ============================================================
// 4. SERVICES FOR VENDORS
// ============================================================
export const vendorService = {
  async getAll(): Promise<Vendor[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) return data as Vendor[];
      } catch (err) {
        console.error("Failed to fetch vendors from Supabase:", err);
      }
    }
    return getLocalStorage<Vendor[]>("wedora_vendors", mockVendors);
  },

  async create(vendor: Vendor): Promise<Vendor> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .insert({
            id: vendor.id,
            org_id: vendor.org_id,
            name: vendor.name,
            category: vendor.category,
            contact: vendor.contact_name || null,
            rating: vendor.rating || 5
          })
          .select()
          .single();
        if (!error && data) return data as Vendor;
      } catch (err) {
        console.error("Failed to create vendor in Supabase:", err);
      }
    }
    const vendors = getLocalStorage<Vendor[]>("wedora_vendors", mockVendors);
    const updated = [vendor, ...vendors];
    setLocalStorage("wedora_vendors", updated);
    return vendor;
  }
};
