import { supabase, isSupabaseConfigured } from "./supabase";
import { WeddingProject, Task, Payment, Vendor } from "@/types";
import { mockProjects, mockTasks, mockPayments, mockVendors } from "./mock-data";

if (typeof window !== "undefined" && !isSupabaseConfigured()) {
  console.warn(
    "[Wedora] Supabase is not configured. All data will be stored in localStorage only.\n" +
    "To connect to Supabase:\n" +
    "1. Copy .env.example to .env.local\n" +
    "2. Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
    "3. Restart the dev server (npm run dev)\n" +
    "4. To seed existing localStorage data into Supabase, run: import { seedSupabase } from '@/lib/seed'; await seedSupabase();"
  );
}

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

/**
 * Merge Supabase data with localStorage fallback data.
 * Supabase items take precedence; local-only items are appended.
 */
const mergeWithLocal = <T extends { id: string }>(
  supabaseData: T[],
  localKey: string,
  fallback: T[]
): T[] => {
  const localData = getLocalStorage<T[]>(localKey, fallback);
  const supabaseIds = new Set(supabaseData.map((item) => item.id));
  return [...supabaseData, ...localData.filter((item) => !supabaseIds.has(item.id))];
};

// ============================================================
// 1. SERVICES FOR WEDDING PROJECTS
// ============================================================
export const projectService = {
  async getAll(): Promise<WeddingProject[]> {
    let supabaseData: WeddingProject[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("wedding_projects")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) supabaseData = data as WeddingProject[];
      } catch (err) {
        console.warn("Failed to fetch from Supabase:", err);
      }
    }
    return mergeWithLocal(supabaseData, "wedora_projects", mockProjects);
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
        console.warn("Failed to fetch project by id from Supabase:", err);
      }
    }
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", mockProjects);
    return projects.find((p) => p.id === id) || null;
  },

  async create(project: WeddingProject): Promise<WeddingProject> {
    let created = project;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("wedding_projects")
          .insert({
            id: project.id,
            org_id: project.org_id,
            client_id: project.client_id,
            bride_name: project.bride_name,
            groom_name: project.groom_name,
            wedding_date: project.wedding_date,
            venue: project.venue,
            venue_address: project.venue_address || null,
            budget_total: project.budget_total,
            budget_used: project.budget_used,
            guest_count: project.guest_count,
            status: project.status,
            notes: project.notes,
            assigned_staff: project.assigned_staff,
            tags: project.tags || null,
            created_at: project.created_at || new Date().toISOString(),
            updated_at: project.updated_at || new Date().toISOString()
          })
          .select()
          .single();
        if (!error && data) created = data as WeddingProject;
      } catch (err) {
        console.warn("Failed to create project in Supabase:", err);
      }
    }
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", mockProjects);
    const updated = [created, ...projects.filter((p) => p.id !== created.id)];
    setLocalStorage("wedora_projects", updated);
    return created;
  },

  async update(id: string, project: Partial<WeddingProject>): Promise<WeddingProject | null> {
    let updatedProject: WeddingProject | null = null;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("wedding_projects")
          .update({ ...project, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (!error && data) updatedProject = data as WeddingProject;
      } catch (err) {
        console.warn("Failed to update project in Supabase:", err);
      }
    }
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", mockProjects);
    const updated = projects.map((p) => {
      if (p.id === id) {
        const merged = { ...p, ...project, updated_at: new Date().toISOString() } as WeddingProject;
        if (!updatedProject) updatedProject = merged;
        return merged;
      }
      return p;
    });
    setLocalStorage("wedora_projects", updated);
    return updatedProject;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("wedding_projects").delete().eq("id", id);
        if (error) console.warn("Failed to delete project from Supabase:", error?.message || error);
      } catch (err) {
        console.warn("Failed to delete project from Supabase:", err);
      }
    }
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", mockProjects);
    const updated = projects.filter((p) => p.id !== id);
    setLocalStorage("wedora_projects", updated);
    return true;
  }
};

// ============================================================
// 2. SERVICES FOR TASKS (CHECKLISTS)
// ============================================================
export const taskService = {
  async getAll(): Promise<Task[]> {
    let supabaseData: Task[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) supabaseData = data as Task[];
      } catch (err) {
        console.warn("Failed to fetch tasks from Supabase:", err);
      }
    }
    return mergeWithLocal(supabaseData, "wedora_tasks", mockTasks);
  },

  async create(task: Task): Promise<Task> {
    let created = task;
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
            assignee_id: task.assignee_id || null,
            assignee_name: task.assignee_name || null,
            due_date: task.due_date || null,
            status: task.status,
            priority: task.priority,
            completed_at: null,
            created_at: task.created_at || new Date().toISOString()
          })
          .select()
          .single();
        if (!error && data) created = data as Task;
      } catch (err) {
        console.warn("Failed to create task in Supabase:", err);
      }
    }
    const tasks = getLocalStorage<Task[]>("wedora_tasks", mockTasks);
    const updated = [created, ...tasks.filter((t) => t.id !== created.id)];
    setLocalStorage("wedora_tasks", updated);
    return created;
  },

  async toggle(id: string): Promise<Task | null> {
    let targetTask: Task | null = null;

    // When Supabase is configured, use it as the source of truth
    if (isSupabaseConfigured()) {
      try {
        const { data: existingTask, error: fetchError } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", id)
          .single();

        if (!fetchError && existingTask) {
          const newStatus = existingTask.status === "done" ? "todo" : "done";
          const { data, error } = await supabase
            .from("tasks")
            .update({
              status: newStatus,
              completed_at: newStatus === "done" ? new Date().toISOString() : null
            })
            .eq("id", id)
            .select()
            .single();
          if (!error && data) {
            targetTask = data as Task;
          }
        }
      } catch (err) {
        console.warn("Failed to toggle task in Supabase:", err);
      }
    }

    // Always sync localStorage fallback
    const tasks = getLocalStorage<Task[]>("wedora_tasks", mockTasks);
    const updated = tasks.map((t) => {
      if (t.id === id) {
        if (!targetTask) {
          const newStatus = t.status === "done" ? "todo" : "done";
          targetTask = {
            ...t,
            status: newStatus,
            completed_at: newStatus === "done" ? new Date().toISOString() : undefined
          };
        }
        return targetTask;
      }
      return t;
    });
    setLocalStorage("wedora_tasks", updated);

    return targetTask;
  },

  async update(id: string, task: Partial<Task>): Promise<Task | null> {
    let updatedTask: Task | null = null;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .update(task)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) updatedTask = data as Task;
      } catch (err) {
        console.warn("Failed to update task in Supabase:", err);
      }
    }
    const tasks = getLocalStorage<Task[]>("wedora_tasks", mockTasks);
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const merged = { ...t, ...task } as Task;
        if (!updatedTask) updatedTask = merged;
        return merged;
      }
      return t;
    });
    setLocalStorage("wedora_tasks", updated);
    return updatedTask;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) console.warn("Failed to delete task from Supabase:", error?.message || error);
      } catch (err) {
        console.warn("Failed to delete task from Supabase:", err);
      }
    }
    const tasks = getLocalStorage<Task[]>("wedora_tasks", mockTasks);
    const updated = tasks.filter((t) => t.id !== id);
    setLocalStorage("wedora_tasks", updated);
    return true;
  }
};

// ============================================================
// 3. SERVICES FOR PAYMENTS & BUDGETS
// ============================================================
export const paymentService = {
  async getAll(): Promise<Payment[]> {
    let supabaseData: Payment[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) supabaseData = data as Payment[];
      } catch (err) {
        console.warn("Failed to fetch payments from Supabase:", err);
      }
    }
    return mergeWithLocal(supabaseData, "wedora_payments", mockPayments);
  },

  async create(payment: Payment): Promise<Payment> {
    let created = payment;
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
            notes: payment.notes || null,
            created_at: payment.created_at || new Date().toISOString()
          })
          .select()
          .single();
        if (!error && data) created = data as Payment;
      } catch (err) {
        console.warn("Failed to create payment in Supabase:", err);
      }
    }
    const payments = getLocalStorage<Payment[]>("wedora_payments", mockPayments);
    const updated = [created, ...payments.filter((p) => p.id !== created.id)];
    setLocalStorage("wedora_payments", updated);
    return created;
  },

  async update(id: string, payment: Partial<Payment>): Promise<Payment | null> {
    let updatedPayment: Payment | null = null;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("payments")
          .update(payment)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) updatedPayment = data as Payment;
      } catch (err) {
        console.warn("Failed to update payment in Supabase:", err);
      }
    }
    const payments = getLocalStorage<Payment[]>("wedora_payments", mockPayments);
    const updated = payments.map((p) => {
      if (p.id === id) {
        const merged = { ...p, ...payment } as Payment;
        if (!updatedPayment) updatedPayment = merged;
        return merged;
      }
      return p;
    });
    setLocalStorage("wedora_payments", updated);
    return updatedPayment;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) console.warn("Failed to delete payment from Supabase:", error);
      } catch (err) {
        console.warn("Failed to delete payment from Supabase:", err);
      }
    }
    const payments = getLocalStorage<Payment[]>("wedora_payments", mockPayments);
    const updated = payments.filter((p) => p.id !== id);
    setLocalStorage("wedora_payments", updated);
    return true;
  }
};

// ============================================================
// 4. SERVICES FOR VENDORS
// ============================================================
export const vendorService = {
  async getAll(): Promise<Vendor[]> {
    let supabaseData: Vendor[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) supabaseData = data as Vendor[];
      } catch (err) {
        console.warn("Failed to fetch vendors from Supabase:", err);
      }
    }
    return mergeWithLocal(supabaseData, "wedora_vendors", mockVendors);
  },

  async create(vendor: Vendor): Promise<Vendor> {
    let created = vendor;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .insert({
            id: vendor.id,
            org_id: vendor.org_id,
            name: vendor.name,
            category: vendor.category,
            contact_name: vendor.contact_name || null,
            contact_phone: vendor.contact_phone || null,
            contact_email: vendor.contact_email || null,
            rating: vendor.rating || 5,
            price_range: vendor.price_range || null,
            notes: vendor.notes || null,
            created_at: vendor.created_at || new Date().toISOString()
          })
          .select()
          .single();
        if (!error && data) created = data as Vendor;
      } catch (err) {
        console.warn("Failed to create vendor in Supabase:", err);
      }
    }
    const vendors = getLocalStorage<Vendor[]>("wedora_vendors", mockVendors);
    const updated = [created, ...vendors.filter((v) => v.id !== created.id)];
    setLocalStorage("wedora_vendors", updated);
    return created;
  },

  async update(id: string, vendor: Partial<Vendor>): Promise<Vendor | null> {
    let updatedVendor: Vendor | null = null;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .update(vendor)
          .eq("id", id)
          .select()
          .single();
        if (!error && data) updatedVendor = data as Vendor;
      } catch (err) {
        console.warn("Failed to update vendor in Supabase:", err);
      }
    }
    const vendors = getLocalStorage<Vendor[]>("wedora_vendors", mockVendors);
    const updated = vendors.map((v) => {
      if (v.id === id) {
        const merged = { ...v, ...vendor } as Vendor;
        if (!updatedVendor) updatedVendor = merged;
        return merged;
      }
      return v;
    });
    setLocalStorage("wedora_vendors", updated);
    return updatedVendor;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("vendors").delete().eq("id", id);
        if (error) console.warn("Failed to delete vendor from Supabase:", error);
      } catch (err) {
        console.warn("Failed to delete vendor from Supabase:", err);
      }
    }
    const vendors = getLocalStorage<Vendor[]>("wedora_vendors", mockVendors);
    const updated = vendors.filter((v) => v.id !== id);
    setLocalStorage("wedora_vendors", updated);
    return true;
  }
};
