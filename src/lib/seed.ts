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

  // Helper to insert rows while skipping duplicates (simple approach: try insert, ignore conflict)
  const insertRows = async <T extends { id: string }>(
    table: string,
    rows: T[],
    mapFn: (row: T) => Record<string, unknown>
  ) => {
    for (const row of rows) {
      try {
        const { error } = await supabase.from(table).insert(mapFn(row));
        if (error) {
          // Ignore duplicate key / unique violation (PostgreSQL code 23505)
          if (error.code === "23505") {
            continue;
          }
          (results as any)[table].failed++;
          (results as any)[table].errors.push(`${row.id}: ${error.message}`);
        } else {
          (results as any)[table].inserted++;
        }
      } catch (err: any) {
        (results as any)[table].failed++;
        (results as any)[table].errors.push(`${row.id}: ${err?.message || err}`);
      }
    }
  };

  await insertRows("wedding_projects", projects, (p) => ({
    id: p.id,
    org_id: p.org_id,
    client_id: p.client_id,
    bride_name: p.bride_name,
    groom_name: p.groom_name,
    wedding_date: p.wedding_date,
    venue: p.venue,
    venue_address: p.venue_address || null,
    budget_total: p.budget_total,
    budget_used: p.budget_used,
    guest_count: p.guest_count,
    status: p.status,
    notes: p.notes,
    assigned_staff: p.assigned_staff,
    tags: p.tags || null,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  }));

  await insertRows("tasks", tasks, (t) => ({
    id: t.id,
    org_id: t.org_id,
    project_id: t.project_id || null,
    title: t.title,
    description: t.description || null,
    assignee_id: t.assignee_id || null,
    assignee_name: t.assignee_name || null,
    due_date: t.due_date || null,
    status: t.status,
    priority: t.priority,
    completed_at: t.completed_at || null,
    created_at: t.created_at || new Date().toISOString(),
  }));

  await insertRows("payments", payments, (p) => ({
    id: p.id,
    org_id: p.org_id,
    project_id: p.project_id,
    amount: p.amount,
    type: p.type,
    status: p.status,
    payment_date: p.payment_date || null,
    due_date: p.due_date || null,
    notes: p.notes || null,
    created_at: p.created_at || new Date().toISOString(),
  }));

  await insertRows("vendors", vendors, (v) => ({
    id: v.id,
    org_id: v.org_id,
    name: v.name,
    category: v.category,
    contact_name: v.contact_name || null,
    contact_phone: v.contact_phone || null,
    contact_email: v.contact_email || null,
    rating: v.rating || 5,
    price_range: v.price_range || null,
    notes: v.notes || null,
    created_at: v.created_at || new Date().toISOString(),
  }));

  console.log("[seedSupabase] Results:", results);
  return { success: true, results };
}
