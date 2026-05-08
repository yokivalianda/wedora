import { supabase, isSupabaseConfigured } from "./supabase";
import { WeddingProject, Task, Payment, Vendor } from "@/types";
import {
  mockProjects,
  mockTasks,
  mockPayments,
  mockVendors,
} from "./mock-data";

const getLocalStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
};

// Generate a valid UUID v4 (random)
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Map to store original ID -> new UUID mapping for referential integrity
const idMap = new Map<string, string>();

const getOrCreateUUID = (originalId: string): string => {
  if (!idMap.has(originalId)) {
    idMap.set(originalId, generateUUID());
  }
  return idMap.get(originalId)!;
};

/**
 * Seed Supabase tables with data currently stored in localStorage.
 * Useful when switching from localStorage-only mode to Supabase.
 * Call this from the browser console if needed:
 *   import { seedSupabase } from "@/lib/seed";
 *   await seedSupabase();
 */
export async function seedSupabase() {
  if (!isSupabaseConfigured()) {
    console.error(
      "[seedSupabase] Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the dev server."
    );
    return { success: false, error: "Supabase not configured" };
  }

  const projects = getLocalStorage<WeddingProject[]>("wedora_projects", mockProjects);
  const tasks = getLocalStorage<Task[]>("wedora_tasks", mockTasks);
  const payments = getLocalStorage<Payment[]>("wedora_payments", mockPayments);
  const vendors = getLocalStorage<Vendor[]>("wedora_vendors", mockVendors);

  const results = {
    projects: { inserted: 0, failed: 0, errors: [] as string[] },
    tasks: { inserted: 0, failed: 0, errors: [] as string[] },
    payments: { inserted: 0, failed: 0, errors: [] as string[] },
    vendors: { inserted: 0, failed: 0, errors: [] as string[] },
  };

  // Map Supabase table names to results keys
  const tableToKey: Record<string, string> = {
    wedding_projects: "projects",
    tasks: "tasks",
    payments: "payments",
    vendors: "vendors",
  };

  // Helper to insert rows while skipping duplicates (simple approach: try insert, ignore conflict)
  const insertRows = async <T extends { id: string }>(
    table: string,
    rows: T[],
    mapFn: (row: T) => Record<string, unknown>
  ) => {
    const key = tableToKey[table] || table;
    for (const row of rows) {
      try {
        const { error } = await supabase.from(table).insert(mapFn(row));
        if (error) {
          // Ignore duplicate key / unique violation (PostgreSQL code 23505)
          if (error.code === "23505") {
            continue;
          }
          (results as any)[key].failed++;
          (results as any)[key].errors.push(`${row.id}: ${error.message}`);
        } else {
          (results as any)[key].inserted++;
        }
      } catch (err: any) {
        (results as any)[key].failed++;
        (results as any)[key].errors.push(`${row.id}: ${err?.message || err}`);
      }
    }
  };

  await insertRows("wedding_projects", projects, (p) => ({
    id: getOrCreateUUID(p.id),
    org_id: null,
    bride_name: p.bride_name,
    groom_name: p.groom_name,
    wedding_date: p.wedding_date,
    venue: p.venue,
    budget_total: p.budget_total,
    budget_used: p.budget_used,
    guest_count: p.guest_count,
    status: p.status,
    notes: p.notes,
    assigned_staff: Array.isArray(p.assigned_staff) ? p.assigned_staff : [],
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  }));

  await insertRows("tasks", tasks, (t) => ({
    id: getOrCreateUUID(t.id),
    org_id: null,
    project_id: t.project_id ? getOrCreateUUID(t.project_id) : null,
    title: t.title,
    description: t.description || null,
    due_date: t.due_date || null,
    status: t.status,
    priority: t.priority,
    created_at: t.created_at || new Date().toISOString(),
  }));

  await insertRows("payments", payments, (p) => ({
    id: getOrCreateUUID(p.id),
    org_id: null,
    project_id: p.project_id ? getOrCreateUUID(p.project_id) : null,
    amount: p.amount,
    type: p.type,
    status: p.status,
    payment_date: p.payment_date || null,
    due_date: p.due_date || null,
    notes: p.notes || null,
    created_at: p.created_at || new Date().toISOString(),
  }));

  await insertRows("vendors", vendors, (v) => ({
    id: getOrCreateUUID(v.id),
    org_id: null,
    name: v.name,
    category: v.category,
    rating: v.rating || 5,
    created_at: v.created_at || new Date().toISOString(),
  }));

  console.log("[seedSupabase] Results:", results);
  return { success: true, results };
}
