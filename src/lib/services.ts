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
    return mergeWithLocal(supabaseData, "wedora_projects", []);
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
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", []);
    return projects.find((p) => p.id === id) || null;
  },

  async create(project: WeddingProject): Promise<WeddingProject> {
    let created = project;
    console.log("[projectService.create] Supabase configured:", isSupabaseConfigured());
    console.log("[projectService.create] Project data:", JSON.stringify(project, null, 2));
    
    if (isSupabaseConfigured()) {
      try {
        // Generate UUID if ID is not valid UUID format
        const generateUUID = () => {
          if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
          }
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };
        
        // Check if ID is valid UUID v4 format
        const isValidUUID = (id: string) => {
          return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        };
        
        const projectId = isValidUUID(project.id) ? project.id : generateUUID();
        
        const insertData = {
          id: projectId,
          org_id: null,
          bride_name: project.bride_name,
          groom_name: project.groom_name,
          wedding_date: project.wedding_date,
          venue: project.venue,
          budget_total: project.budget_total,
          budget_used: project.budget_used,
          guest_count: project.guest_count,
          status: project.status,
          notes: project.notes,
          assigned_staff: project.assigned_staff,
          created_at: project.created_at || new Date().toISOString(),
          updated_at: project.updated_at || new Date().toISOString()
        };
        console.log("[projectService.create] Inserting to Supabase:", JSON.stringify(insertData, null, 2));
        
        const { data, error } = await supabase
          .from("wedding_projects")
          .insert(insertData)
          .select()
          .single();
        if (error) {
          console.error("[projectService.create] Supabase insert error:", JSON.stringify(error, null, 2));
          throw new Error(`Failed to create project: ${error.message || JSON.stringify(error)}`);
        }
        console.log("[projectService.create] Supabase success:", JSON.stringify(data, null, 2));
        if (data) {
          created = data as WeddingProject;
        } else {
          // If Supabase returns no data, use the UUID we generated
          created = { ...project, id: projectId };
        }
      } catch (err: any) {
        console.error("[projectService.create] Failed:", err);
        throw new Error(err?.message || "Failed to create project in Supabase");
      }
    } else {
      console.log("[projectService.create] Supabase not configured, skipping");
    }
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", []);
    const updated = [created, ...projects.filter((p) => p.id !== created.id)];
    setLocalStorage("wedora_projects", updated);
    return created;
  },

  async update(id: string, project: Partial<WeddingProject>): Promise<WeddingProject | null> {
    let updatedProject: WeddingProject | null = null;
    if (isSupabaseConfigured()) {
      try {
        // Only update fields that exist in Supabase schema
        const updateData: any = { updated_at: new Date().toISOString() };
        if (project.bride_name !== undefined) updateData.bride_name = project.bride_name;
        if (project.groom_name !== undefined) updateData.groom_name = project.groom_name;
        if (project.wedding_date !== undefined) updateData.wedding_date = project.wedding_date;
        if (project.venue !== undefined) updateData.venue = project.venue;
        if (project.budget_total !== undefined) updateData.budget_total = project.budget_total;
        if (project.budget_used !== undefined) updateData.budget_used = project.budget_used;
        if (project.guest_count !== undefined) updateData.guest_count = project.guest_count;
        if (project.status !== undefined) updateData.status = project.status;
        if (project.notes !== undefined) updateData.notes = project.notes;
        if (project.assigned_staff !== undefined) updateData.assigned_staff = project.assigned_staff;
        
        const { data, error } = await supabase
          .from("wedding_projects")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) {
          console.error("Supabase update error:", error);
          throw new Error(`Failed to update project: ${error.message}`);
        }
        if (data) updatedProject = data as WeddingProject;
      } catch (err: any) {
        console.error("Failed to update project in Supabase:", err);
        throw new Error(err?.message || "Failed to update project in Supabase");
      }
    }
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", []);
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
    const projects = getLocalStorage<WeddingProject[]>("wedora_projects", []);
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
    return mergeWithLocal(supabaseData, "wedora_tasks", []);
  },

  async create(task: Task): Promise<Task> {
    let created = task;
    if (isSupabaseConfigured()) {
      try {
        // Generate UUID if ID is not valid UUID format
        const generateUUID = () => {
          if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
          }
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };
        const isValidUUID = (id: string) => {
          return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        };
        const taskId = isValidUUID(task.id) ? task.id : generateUUID();
        
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            id: taskId,
            org_id: null, // Set to null to avoid FK constraint
            project_id: task.project_id || null,
            title: task.title,
            description: task.description || null,
            due_date: task.due_date || null,
            status: task.status,
            priority: task.priority,
            created_at: task.created_at || new Date().toISOString()
          })
          .select()
          .single();
        if (error) {
          console.error("[taskService.create] Supabase insert error:", JSON.stringify(error, null, 2));
          throw new Error(`Failed to create task: ${error.message || JSON.stringify(error)}`);
        }
        console.log("[taskService.create] Supabase success:", JSON.stringify(data, null, 2));
        if (data) {
          created = data as Task;
        } else {
          created = { ...task, id: taskId };
        }
      } catch (err: any) {
        console.error("[taskService.create] Failed:", err);
        throw new Error(err?.message || "Failed to create task in Supabase");
      }
    } else {
      console.log("[taskService.create] Supabase not configured, skipping");
    }
    const tasks = getLocalStorage<Task[]>("wedora_tasks", []);
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
            .update({ status: newStatus })
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
    const tasks = getLocalStorage<Task[]>("wedora_tasks", []);
    const updated = tasks.map((t) => {
      if (t.id === id) {
        if (!targetTask) {
          const newStatus = t.status === "done" ? "todo" : "done";
          targetTask = { ...t, status: newStatus };
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
        // Only update fields that exist in Supabase schema
        const updateData: any = {};
        if (task.title !== undefined) updateData.title = task.title;
        if (task.description !== undefined) updateData.description = task.description;
        if (task.due_date !== undefined) updateData.due_date = task.due_date;
        if (task.status !== undefined) updateData.status = task.status;
        if (task.priority !== undefined) updateData.priority = task.priority;
        
        const { data, error } = await supabase
          .from("tasks")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) {
          console.error("Supabase task update error:", error);
          throw new Error(`Failed to update task: ${error.message}`);
        }
        if (data) updatedTask = data as Task;
      } catch (err: any) {
        console.error("Failed to update task in Supabase:", err);
        throw new Error(err?.message || "Failed to update task in Supabase");
      }
    }
    const tasks = getLocalStorage<Task[]>("wedora_tasks", []);
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
    const tasks = getLocalStorage<Task[]>("wedora_tasks", []);
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
    return mergeWithLocal(supabaseData, "wedora_payments", []);
  },

  async create(payment: Payment): Promise<Payment> {
    let created = payment;
    if (isSupabaseConfigured()) {
      try {
        // Generate UUID if ID is not valid UUID format
        const generateUUID = () => {
          if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
          }
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };
        const isValidUUID = (id: string) => {
          return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        };
        const paymentId = isValidUUID(payment.id) ? payment.id : generateUUID();
        
        const { data, error } = await supabase
          .from("payments")
          .insert({
            id: paymentId,
            org_id: null, // Set to null to avoid FK constraint
            project_id: payment.project_id || null,
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
        if (error) {
          console.error("[paymentService.create] Supabase insert error:", JSON.stringify(error, null, 2));
          throw new Error(`Failed to create payment: ${error.message || JSON.stringify(error)}`);
        }
        console.log("[paymentService.create] Supabase success:", JSON.stringify(data, null, 2));
        if (data) {
          created = data as Payment;
        } else {
          created = { ...payment, id: paymentId };
        }
      } catch (err: any) {
        console.error("[paymentService.create] Failed:", err);
        throw new Error(err?.message || "Failed to create payment in Supabase");
      }
    } else {
      console.log("[paymentService.create] Supabase not configured, skipping");
    }
    const payments = getLocalStorage<Payment[]>("wedora_payments", []);
    const updated = [created, ...payments.filter((p) => p.id !== created.id)];
    setLocalStorage("wedora_payments", updated);
    return created;
  },

  async update(id: string, payment: Partial<Payment>): Promise<Payment | null> {
    let updatedPayment: Payment | null = null;
    if (isSupabaseConfigured()) {
      try {
        // Only update fields that exist in Supabase schema
        const updateData: any = {};
        if (payment.amount !== undefined) updateData.amount = payment.amount;
        if (payment.type !== undefined) updateData.type = payment.type;
        if (payment.status !== undefined) updateData.status = payment.status;
        if (payment.payment_date !== undefined) updateData.payment_date = payment.payment_date;
        if (payment.due_date !== undefined) updateData.due_date = payment.due_date;
        if (payment.notes !== undefined) updateData.notes = payment.notes;
        
        const { data, error } = await supabase
          .from("payments")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) {
          console.error("Supabase payment update error:", error);
          throw new Error(`Failed to update payment: ${error.message}`);
        }
        if (data) updatedPayment = data as Payment;
      } catch (err: any) {
        console.error("Failed to update payment in Supabase:", err);
        throw new Error(err?.message || "Failed to update payment in Supabase");
      }
    }
    const payments = getLocalStorage<Payment[]>("wedora_payments", []);
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
    const payments = getLocalStorage<Payment[]>("wedora_payments", []);
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
    return mergeWithLocal(supabaseData, "wedora_vendors", []);
  },

  async create(vendor: Vendor): Promise<Vendor> {
    let created = vendor;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .insert({
            id: vendor.id,
            org_id: null, // Set to null to avoid FK constraint
            name: vendor.name,
            category: vendor.category,
            rating: vendor.rating || 5,
            created_at: vendor.created_at || new Date().toISOString()
          })
          .select()
          .single();
        if (error) {
          console.error("Supabase vendor insert error:", JSON.stringify(error, null, 2));
          throw new Error(`Failed to create vendor: ${error.message || JSON.stringify(error)}`);
        }
        if (data) created = data as Vendor;
      } catch (err: any) {
        console.error("Failed to create vendor in Supabase:", err);
        throw new Error(err?.message || "Failed to create vendor in Supabase");
      }
    }
    const vendors = getLocalStorage<Vendor[]>("wedora_vendors", []);
    const updated = [created, ...vendors.filter((v) => v.id !== created.id)];
    setLocalStorage("wedora_vendors", updated);
    return created;
  },

  async update(id: string, vendor: Partial<Vendor>): Promise<Vendor | null> {
    let updatedVendor: Vendor | null = null;
    if (isSupabaseConfigured()) {
      try {
        // Only update fields that exist in Supabase schema
        const updateData: any = {};
        if (vendor.name !== undefined) updateData.name = vendor.name;
        if (vendor.category !== undefined) updateData.category = vendor.category;
        if (vendor.rating !== undefined) updateData.rating = vendor.rating;
        
        const { data, error } = await supabase
          .from("vendors")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) {
          console.error("Supabase vendor update error:", error);
          throw new Error(`Failed to update vendor: ${error.message}`);
        }
        if (data) updatedVendor = data as Vendor;
      } catch (err: any) {
        console.error("Failed to update vendor in Supabase:", err);
        throw new Error(err?.message || "Failed to update vendor in Supabase");
      }
    }
    const vendors = getLocalStorage<Vendor[]>("wedora_vendors", []);
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
    const vendors = getLocalStorage<Vendor[]>("wedora_vendors", []);
    const updated = vendors.filter((v) => v.id !== id);
    setLocalStorage("wedora_vendors", updated);
    return true;
  }
};
