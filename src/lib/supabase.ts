import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-placeholder-supabase.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to check if Supabase has been properly configured.
 * Ensures the URL is not the placeholder fallback.
 */
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    url !== undefined &&
    url !== "" &&
    !url.includes("your-placeholder") &&
    key !== undefined &&
    key !== "" &&
    !key.includes("placeholder")
  );
};

/**
 * Get the current authenticated user's org_id from the public.users table.
 * Returns null if not authenticated or no org assigned.
 */
export const getCurrentUserOrgId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("users")
      .select("org_id")
      .eq("id", user.id)
      .single();
    if (error || !data) return null;
    return data.org_id || null;
  } catch {
    return null;
  }
};
