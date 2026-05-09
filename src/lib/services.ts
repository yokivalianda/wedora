import { supabase, isSupabaseConfigured, getCurrentUserOrgId } from "./supabase";
import { WeddingProject, Task, Payment, Vendor, Document, Activity, TimelineEvent, User } from "@/types";
import { mockProjects, mockTasks, mockPayments, mockVendors, mockDocuments, mockActivities, mockTimeline, mockUsers } from "./mock-data";
import { isDemoAccount } from "./demo";

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
// ORG ID HELPER — Retrieves the authenticated user's org_id
// ============================================================

// Always fetch fresh org_id — no caching to prevent cross-user data leakage
// when multiple users login on the same browser session
async function getCurrentOrgId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!error && data?.org_id) {
      return data.org_id;
    }

    return null;
  } catch (err) {
    console.warn("[getCurrentOrgId] Failed:", err);
    return null;
  }
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
 * Get data with proper isolation.
 * - If Supabase is configured: ONLY use Supabase data (RLS handles isolation)
 * - If Supabase not configured: fall back to localStorage
 * - Demo accounts: merge Supabase data with mock data
 */
const mergeWithLocal = <T extends { id: string }>(
  supabaseData: T[],
  localKey: string,
  fallback: T[]
): T[] => {
  // Demo accounts: merge Supabase + mock data
  if (isDemoAccount()) {
    const supabaseIds = new Set(supabaseData.map((item) => item.id));
    return [...supabaseData, ...fallback.filter((item) => !supabaseIds.has(item.id))];
  }

  // If Supabase is configured, ONLY trust Supabase data (RLS guarantees isolation)
  // Do NOT mix in localStorage data — it may contain data from other users
  if (isSupabaseConfigured()) {
    return supabaseData;
  }

  // Supabase not configured: use localStorage as sole data source
  const localData = getLocalStorage<T[]>(localKey, fallback);
  return localData;
};

// When Supabase is configured, skip localStorage writes for data tables
// to prevent cross-user data leakage via shared browser storage
const shouldWriteLocalStorage = () => !isSupabaseConfigured() && !isDemoAccount();

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
    return mergeWithLocal(supabaseData, "wedora_projects", isDemoAccount() ? mockProjects : []);
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
        const orgId = await getCurrentOrgId();
        
        const insertData = {
          id: projectId,
          org_id: orgId,
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
    if (shouldWriteLocalStorage()) {
      const projects = getLocalStorage<WeddingProject[]>("wedora_projects", []);
      const updated = [created, ...projects.filter((p) => p.id !== created.id)];
      setLocalStorage("wedora_projects", updated);
    }
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
    if (shouldWriteLocalStorage()) {
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
    } else if (!updatedProject) {
      // For demo accounts without Supabase, return merged mock data
      const mockProject = mockProjects.find((p) => p.id === id);
      if (mockProject) updatedProject = { ...mockProject, ...project, updated_at: new Date().toISOString() } as WeddingProject;
    }
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
    if (shouldWriteLocalStorage()) {
      const projects = getLocalStorage<WeddingProject[]>("wedora_projects", []);
      const updated = projects.filter((p) => p.id !== id);
      setLocalStorage("wedora_projects", updated);
    }
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
    return mergeWithLocal(supabaseData, "wedora_tasks", isDemoAccount() ? mockTasks : []);
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
        const orgId = await getCurrentOrgId();
        
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            id: taskId,
            org_id: orgId,
            project_id: task.project_id || null,
            title: task.title,
            description: task.description || null,
            assignee_name: task.assignee_name || null,
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
    if (shouldWriteLocalStorage()) {
      const tasks = getLocalStorage<Task[]>("wedora_tasks", []);
      const updated = [created, ...tasks.filter((t) => t.id !== created.id)];
      setLocalStorage("wedora_tasks", updated);
    }
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

    // Always sync localStorage fallback (except for demo accounts)
    if (shouldWriteLocalStorage()) {
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
    } else if (!targetTask) {
      // For demo accounts without Supabase, toggle in-memory from mock data
      const mockTask = mockTasks.find((t) => t.id === id);
      if (mockTask) {
        const newStatus = mockTask.status === "done" ? "todo" : "done";
        targetTask = { ...mockTask, status: newStatus };
      }
    }

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
        if (task.assignee_name !== undefined) updateData.assignee_name = task.assignee_name;
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
    if (shouldWriteLocalStorage()) {
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
    } else if (!updatedTask) {
      const mockTask = mockTasks.find((t) => t.id === id);
      if (mockTask) updatedTask = { ...mockTask, ...task } as Task;
    }
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
    if (shouldWriteLocalStorage()) {
      const tasks = getLocalStorage<Task[]>("wedora_tasks", []);
      const updated = tasks.filter((t) => t.id !== id);
      setLocalStorage("wedora_tasks", updated);
    }
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
    return mergeWithLocal(supabaseData, "wedora_payments", isDemoAccount() ? mockPayments : []);
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
        const orgId = await getCurrentOrgId();
        
        const { data, error } = await supabase
          .from("payments")
          .insert({
            id: paymentId,
            org_id: orgId,
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
    if (shouldWriteLocalStorage()) {
      const payments = getLocalStorage<Payment[]>("wedora_payments", []);
      const updated = [created, ...payments.filter((p) => p.id !== created.id)];
      setLocalStorage("wedora_payments", updated);
    }
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
    if (shouldWriteLocalStorage()) {
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
    } else if (!updatedPayment) {
      const mockPayment = mockPayments.find((p) => p.id === id);
      if (mockPayment) updatedPayment = { ...mockPayment, ...payment } as Payment;
    }
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
    if (shouldWriteLocalStorage()) {
      const payments = getLocalStorage<Payment[]>("wedora_payments", []);
      const updated = payments.filter((p) => p.id !== id);
      setLocalStorage("wedora_payments", updated);
    }
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
    return mergeWithLocal(supabaseData, "wedora_vendors", isDemoAccount() ? mockVendors : []);
  },

  async create(vendor: Vendor): Promise<Vendor> {
    let created = vendor;
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
        const vendorId = isValidUUID(vendor.id) ? vendor.id : generateUUID();
        const orgId = await getCurrentOrgId();

        const { data, error } = await supabase
          .from("vendors")
          .insert({
            id: vendorId,
            org_id: orgId,
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
        if (error) {
          console.error("Supabase vendor insert error:", JSON.stringify(error, null, 2));
          throw new Error(`Failed to create vendor: ${error.message || JSON.stringify(error)}`);
        }
        if (data) {
          created = data as Vendor;
        } else {
          created = { ...vendor, id: vendorId };
        }
      } catch (err: any) {
        console.error("Failed to create vendor in Supabase:", err);
        throw new Error(err?.message || "Failed to create vendor in Supabase");
      }
    }
    if (shouldWriteLocalStorage()) {
      const vendors = getLocalStorage<Vendor[]>("wedora_vendors", []);
      const updated = [created, ...vendors.filter((v) => v.id !== created.id)];
      setLocalStorage("wedora_vendors", updated);
    }
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
        if (vendor.contact_name !== undefined) updateData.contact_name = vendor.contact_name;
        if (vendor.contact_phone !== undefined) updateData.contact_phone = vendor.contact_phone;
        if (vendor.contact_email !== undefined) updateData.contact_email = vendor.contact_email;
        if (vendor.rating !== undefined) updateData.rating = vendor.rating;
        if (vendor.price_range !== undefined) updateData.price_range = vendor.price_range;
        if (vendor.notes !== undefined) updateData.notes = vendor.notes;
        
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
    if (shouldWriteLocalStorage()) {
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
    } else if (!updatedVendor) {
      const mockVendor = mockVendors.find((v) => v.id === id);
      if (mockVendor) updatedVendor = { ...mockVendor, ...vendor } as Vendor;
    }
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
    if (shouldWriteLocalStorage()) {
      const vendors = getLocalStorage<Vendor[]>("wedora_vendors", []);
      const updated = vendors.filter((v) => v.id !== id);
      setLocalStorage("wedora_vendors", updated);
    }
    return true;
  }
};

// ============================================================
// 5. SERVICES FOR DOCUMENTS
// ============================================================
export const documentService = {
  async getAll(): Promise<Document[]> {
    let supabaseData: Document[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) supabaseData = data as Document[];
      } catch (err) {
        console.warn("Failed to fetch documents from Supabase:", err);
      }
    }
    return mergeWithLocal(supabaseData, "wedora_documents", isDemoAccount() ? mockDocuments : []);
  },

  async create(document: Document): Promise<Document> {
    let created = document;

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
    // Always generate a proper UUID (even for localStorage mode)
    const docId = isValidUUID(document.id) ? document.id : generateUUID();
    created = { ...document, id: docId };

    if (isSupabaseConfigured()) {
      try {
        const orgId = await getCurrentOrgId();

        // Resolve uploader identity from Supabase auth session
        // Priority: authenticated user's email > fallback to passed uploaded_by
        let uploadedBy = document.uploaded_by || null;
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            uploadedBy = authUser.email ?? authUser.id;
          }
        } catch (_) { /* ignore, use fallback */ }

        const { data, error } = await supabase
          .from("documents")
          .insert({
            id: docId,
            org_id: orgId,
            project_id: document.project_id || null,
            name: document.name,
            type: document.type,
            category: document.category || null,
            size: document.size || null,
            url: document.url || "#",
            uploaded_by: uploadedBy,
            created_at: document.created_at || new Date().toISOString()
          })
          .select()
          .single();
        if (error) {
          console.error("[documentService.create] Supabase insert error:", JSON.stringify(error, null, 2));
          throw new Error(`Gagal menyimpan dokumen: ${error.message || JSON.stringify(error)}`);
        }
        if (data) {
          created = data as Document;
        }
      } catch (err: any) {
        console.error("[documentService.create] Failed:", err);
        throw new Error(err?.message || "Gagal menyimpan dokumen ke Supabase");
      }
    }
    if (shouldWriteLocalStorage()) {
      const documents = getLocalStorage<Document[]>("wedora_documents", []);
      const updated = [created, ...documents.filter((d) => d.id !== created.id)];
      setLocalStorage("wedora_documents", updated);
    }
    return created;
  },

  async update(id: string, document: Partial<Document>): Promise<Document | null> {
    let updatedDocument: Document | null = null;
    if (isSupabaseConfigured()) {
      try {
        const updateData: any = {};
        if (document.name !== undefined) updateData.name = document.name;
        if (document.type !== undefined) updateData.type = document.type;
        if (document.category !== undefined) updateData.category = document.category;
        if (document.size !== undefined) updateData.size = document.size;
        if (document.url !== undefined) updateData.url = document.url;
        if (document.uploaded_by !== undefined) updateData.uploaded_by = document.uploaded_by;

        const { data, error } = await supabase
          .from("documents")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) {
          console.error("Supabase document update error:", error);
          throw new Error(`Failed to update document: ${error.message}`);
        }
        if (data) updatedDocument = data as Document;
      } catch (err: any) {
        console.error("Failed to update document in Supabase:", err);
        throw new Error(err?.message || "Failed to update document in Supabase");
      }
    }
    if (shouldWriteLocalStorage()) {
      const documents = getLocalStorage<Document[]>("wedora_documents", []);
      const updated = documents.map((d) => {
        if (d.id === id) {
          const merged = { ...d, ...document } as Document;
          if (!updatedDocument) updatedDocument = merged;
          return merged;
        }
        return d;
      });
      setLocalStorage("wedora_documents", updated);
    } else if (!updatedDocument) {
      const mockDoc = mockDocuments.find((d) => d.id === id);
      if (mockDoc) updatedDocument = { ...mockDoc, ...document } as Document;
    }
    return updatedDocument;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("documents").delete().eq("id", id);
        if (error) console.warn("Failed to delete document from Supabase:", error);
      } catch (err) {
        console.warn("Failed to delete document from Supabase:", err);
      }
    }
    if (shouldWriteLocalStorage()) {
      const documents = getLocalStorage<Document[]>("wedora_documents", []);
      const updated = documents.filter((d) => d.id !== id);
      setLocalStorage("wedora_documents", updated);
    }
    return true;
  }
};

// ============================================================
// 6. SERVICES FOR ACTIVITIES
// ============================================================
export const activityService = {
  async getAll(): Promise<Activity[]> {
    let supabaseData: Activity[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) supabaseData = data as Activity[];
      } catch (err) {
        console.warn("Failed to fetch activities from Supabase:", err);
      }
    }
    return mergeWithLocal(supabaseData, "wedora_activities", isDemoAccount() ? mockActivities : []);
  },

  async create(activity: Activity): Promise<Activity> {
    let created = activity;
    if (isSupabaseConfigured()) {
      try {
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
        const actId = isValidUUID(activity.id) ? activity.id : generateUUID();
        const orgId = await getCurrentOrgId();

        // Also get the authenticated user's ID for user_id field
        let userId = activity.user_id || null;
        if (!userId) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) userId = user.id;
          } catch (_) { /* ignore */ }
        }

        const { data, error } = await supabase
          .from("activities")
          .insert({
            id: actId,
            org_id: orgId,
            user_id: userId,
            user_name: activity.user_name,
            action: activity.action,
            entity_type: activity.entity_type || null,
            entity_id: activity.entity_id || null,
            entity_name: activity.entity_name || null,
            created_at: activity.created_at || new Date().toISOString()
          })
          .select()
          .single();
        if (error) {
          console.error("[activityService.create] Supabase insert error:", JSON.stringify(error, null, 2));
          throw new Error(`Failed to create activity: ${error.message || JSON.stringify(error)}`);
        }
        if (data) {
          created = data as Activity;
        } else {
          created = { ...activity, id: actId };
        }
      } catch (err: any) {
        console.error("[activityService.create] Failed:", err);
        throw new Error(err?.message || "Failed to create activity in Supabase");
      }
    }
    if (shouldWriteLocalStorage()) {
      const activities = getLocalStorage<Activity[]>("wedora_activities", []);
      const updated = [created, ...activities.filter((a) => a.id !== created.id)];
      setLocalStorage("wedora_activities", updated);
    }
    return created;
  }
};

// ============================================================
// 7. SERVICES FOR TIMELINE EVENTS
// ============================================================
export const timelineService = {
  async getAll(projectId?: string): Promise<TimelineEvent[]> {
    let supabaseData: TimelineEvent[] = [];
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from("timeline_events")
          .select("*")
          .order("time", { ascending: true });
        if (projectId) {
          query = query.eq("project_id", projectId);
        }
        const { data, error } = await query;
        if (!error && data) supabaseData = data as TimelineEvent[];
      } catch (err) {
        console.warn("Failed to fetch timeline events from Supabase:", err);
      }
    }
    const fallback = isDemoAccount() ? mockTimeline : [];
    const merged = mergeWithLocal(supabaseData, "wedora_timeline", fallback);
    if (projectId) {
      return merged.filter((e) => e.project_id === projectId);
    }
    return merged;
  },

  async create(event: TimelineEvent): Promise<TimelineEvent> {
    let created = event;
    if (isSupabaseConfigured()) {
      try {
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
        const eventId = isValidUUID(event.id) ? event.id : generateUUID();
        const orgId = await getCurrentOrgId();

        const { data, error } = await supabase
          .from("timeline_events")
          .insert({
            id: eventId,
            org_id: orgId,
            project_id: event.project_id || null,
            title: event.title,
            description: event.description || null,
            time: event.time,
            location: event.location || null,
            pic: event.pic || null,
            category: event.category || "lainnya",
            created_at: event.created_at || new Date().toISOString()
          })
          .select()
          .single();
        if (error) {
          console.error("[timelineService.create] Supabase insert error:", JSON.stringify(error, null, 2));
          throw new Error(`Failed to create timeline event: ${error.message || JSON.stringify(error)}`);
        }
        if (data) {
          created = data as TimelineEvent;
        } else {
          created = { ...event, id: eventId };
        }
      } catch (err: any) {
        console.error("[timelineService.create] Failed:", err);
        throw new Error(err?.message || "Failed to create timeline event in Supabase");
      }
    }
    if (shouldWriteLocalStorage()) {
      const events = getLocalStorage<TimelineEvent[]>("wedora_timeline", []);
      const updated = [created, ...events.filter((e) => e.id !== created.id)];
      setLocalStorage("wedora_timeline", updated);
    }
    return created;
  },

  async update(id: string, event: Partial<TimelineEvent>): Promise<TimelineEvent | null> {
    let updatedEvent: TimelineEvent | null = null;
    if (isSupabaseConfigured()) {
      try {
        const updateData: any = {};
        if (event.title !== undefined) updateData.title = event.title;
        if (event.description !== undefined) updateData.description = event.description;
        if (event.time !== undefined) updateData.time = event.time;
        if (event.location !== undefined) updateData.location = event.location;
        if (event.pic !== undefined) updateData.pic = event.pic;
        if (event.category !== undefined) updateData.category = event.category;

        const { data, error } = await supabase
          .from("timeline_events")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) {
          console.error("Supabase timeline update error:", error);
          throw new Error(`Failed to update timeline event: ${error.message}`);
        }
        if (data) updatedEvent = data as TimelineEvent;
      } catch (err: any) {
        console.error("Failed to update timeline event in Supabase:", err);
        throw new Error(err?.message || "Failed to update timeline event in Supabase");
      }
    }
    if (shouldWriteLocalStorage()) {
      const events = getLocalStorage<TimelineEvent[]>("wedora_timeline", []);
      const updated = events.map((e) => {
        if (e.id === id) {
          const merged = { ...e, ...event } as TimelineEvent;
          if (!updatedEvent) updatedEvent = merged;
          return merged;
        }
        return e;
      });
      setLocalStorage("wedora_timeline", updated);
    } else if (!updatedEvent) {
      const mockEvent = mockTimeline.find((e) => e.id === id);
      if (mockEvent) updatedEvent = { ...mockEvent, ...event } as TimelineEvent;
    }
    return updatedEvent;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("timeline_events").delete().eq("id", id);
        if (error) console.warn("Failed to delete timeline event from Supabase:", error);
      } catch (err) {
        console.warn("Failed to delete timeline event from Supabase:", err);
      }
    }
    if (shouldWriteLocalStorage()) {
      const events = getLocalStorage<TimelineEvent[]>("wedora_timeline", []);
      const updated = events.filter((e) => e.id !== id);
      setLocalStorage("wedora_timeline", updated);
    }
    return true;
  }
};


// ============================================================
// 8. SERVICES FOR USERS (ORG MEMBERS / STAFF)
// ============================================================
export const userService = {
  /**
   * Fetch all users that belong to the same organisation as the
   * currently authenticated user.
   * - Supabase configured  → query public.users filtered by org_id
   * - Demo account         → return mockUsers
   * - Supabase not config  → return mockUsers as fallback
   */
  async getAll(): Promise<User[]> {
    if (isSupabaseConfigured()) {
      try {
        const orgId = await getCurrentOrgId();
        if (orgId) {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("org_id", orgId)
            .order("full_name", { ascending: true });
          if (!error && data && data.length > 0) return data as User[];
        }
        // org_id not set yet (e.g. onboarding not complete) — fall through
      } catch (err) {
        console.warn("[userService.getAll] Failed to fetch from Supabase:", err);
      }
    }
    // Fallback: mock data only for demo accounts
    if (isDemoAccount()) return mockUsers as User[];
    // Supabase not configured (localStorage mode) → return mockUsers so assigned_staff in local/mock projects resolves correctly
    if (!isSupabaseConfigured()) return mockUsers as User[];
    // Supabase configured but org not yet set → empty (user has real account, don't show mock coordinators)
    return [];
  },
};
