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

// ============================================================
// STORAGE HELPERS — Upload file to Supabase Storage
// ============================================================

export const STORAGE_BUCKET = "documents";
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  url: string;
  path: string;
  size: string;
}

/**
 * Format byte size to human-readable string (e.g. "2.4 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/**
 * Upload a file to Supabase Storage bucket "documents".
 * Validates max file size (10 MB).
 * Returns public URL, storage path, and formatted size.
 * Throws an error with a user-friendly Indonesian message on failure.
 */
export const uploadFileToStorage = async (
  file: File,
  folder: string = "uploads"
): Promise<UploadResult> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi. Upload file tidak tersedia.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Ukuran file terlalu besar. Maksimal 10 MB, file Anda ${formatFileSize(file.size)}.`
    );
  }

  // Build a unique path: folder/timestamp-filename
  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Gagal mengunggah file: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    size: formatFileSize(file.size),
  };
};
