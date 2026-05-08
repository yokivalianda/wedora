-- ==========================================
-- Wedora SaaS — Row Level Security (RLS) Policies
-- ==========================================
-- File ini berisi semua kebijakan RLS untuk mengamankan akses data
-- berdasarkan organisasi pengguna (multi-tenant isolation).
--
-- Prasyarat:
-- - Supabase Auth aktif, auth.uid() mengembalikan UUID user yang login
-- - Tabel `users` menghubungkan auth user ke organisasi via org_id
-- - Semua tabel data memiliki kolom org_id (kecuali notifications yang pakai user_id)
--
-- Catatan tentang NULL org_id:
-- - Ketika user baru mendaftar tapi belum onboarding (belum punya org),
--   get_user_org_id() mengembalikan NULL.
-- - Dalam PostgreSQL, NULL = NULL menghasilkan NULL (bukan TRUE),
--   jadi kita perlu menangani kasus ini secara eksplisit dengan IS NULL.
-- - User tanpa org bisa melihat data yang juga memiliki org_id IS NULL (data mereka sendiri).
-- ==========================================

-- ==========================================
-- HELPER FUNCTION: Mendapatkan org_id user yang sedang login
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- 1. ORGANIZATIONS — Kebijakan akses organisasi
-- ==========================================
-- User hanya bisa melihat & mengelola organisasi miliknya sendiri

CREATE POLICY "organizations_select_policy" ON organizations
    FOR SELECT USING (
        id = public.get_user_org_id()
    );

CREATE POLICY "organizations_insert_policy" ON organizations
    FOR INSERT WITH CHECK (
        -- Allow insert saat onboarding (user baru membuat org)
        true
    );

CREATE POLICY "organizations_update_policy" ON organizations
    FOR UPDATE USING (
        id = public.get_user_org_id()
    );

CREATE POLICY "organizations_delete_policy" ON organizations
    FOR DELETE USING (
        id = public.get_user_org_id()
    );

-- ==========================================
-- 2. USERS — Kebijakan akses data pengguna
-- ==========================================
-- User bisa melihat semua anggota di org yang sama
-- User hanya bisa update/delete profil sendiri

CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        org_id = public.get_user_org_id()
        OR id = auth.uid()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        -- Allow insert: user baru (onboarding) atau org_id sesuai
        id = auth.uid()
        OR org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        id = auth.uid()
    );

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        id = auth.uid()
    );

-- ==========================================
-- 3. WEDDING_PROJECTS — Kebijakan akses proyek pernikahan
-- ==========================================

CREATE POLICY "wedding_projects_select_policy" ON wedding_projects
    FOR SELECT USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "wedding_projects_insert_policy" ON wedding_projects
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "wedding_projects_update_policy" ON wedding_projects
    FOR UPDATE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "wedding_projects_delete_policy" ON wedding_projects
    FOR DELETE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

-- ==========================================
-- 4. TASKS — Kebijakan akses tugas/checklist
-- ==========================================

CREATE POLICY "tasks_select_policy" ON tasks
    FOR SELECT USING (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "tasks_insert_policy" ON tasks
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "tasks_update_policy" ON tasks
    FOR UPDATE USING (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "tasks_delete_policy" ON tasks
    FOR DELETE USING (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

-- ==========================================
-- 5. PAYMENTS — Kebijakan akses pembayaran/keuangan
-- ==========================================

CREATE POLICY "payments_select_policy" ON payments
    FOR SELECT USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "payments_insert_policy" ON payments
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "payments_update_policy" ON payments
    FOR UPDATE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "payments_delete_policy" ON payments
    FOR DELETE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

-- ==========================================
-- 6. VENDORS — Kebijakan akses data vendor
-- ==========================================

CREATE POLICY "vendors_select_policy" ON vendors
    FOR SELECT USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "vendors_insert_policy" ON vendors
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "vendors_update_policy" ON vendors
    FOR UPDATE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "vendors_delete_policy" ON vendors
    FOR DELETE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

-- ==========================================
-- 7. DOCUMENTS — Kebijakan akses dokumen/berkas
-- ==========================================

CREATE POLICY "documents_select_policy" ON documents
    FOR SELECT USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "documents_insert_policy" ON documents
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "documents_update_policy" ON documents
    FOR UPDATE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "documents_delete_policy" ON documents
    FOR DELETE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

-- ==========================================
-- 8. ACTIVITIES — Kebijakan akses riwayat aktivitas
-- ==========================================

CREATE POLICY "activities_select_policy" ON activities
    FOR SELECT USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "activities_insert_policy" ON activities
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "activities_update_policy" ON activities
    FOR UPDATE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "activities_delete_policy" ON activities
    FOR DELETE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

-- ==========================================
-- 9. TIMELINE_EVENTS — Kebijakan akses rundown acara
-- ==========================================

CREATE POLICY "timeline_events_select_policy" ON timeline_events
    FOR SELECT USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "timeline_events_insert_policy" ON timeline_events
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "timeline_events_update_policy" ON timeline_events
    FOR UPDATE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

CREATE POLICY "timeline_events_delete_policy" ON timeline_events
    FOR DELETE USING (
        org_id = public.get_user_org_id()
        OR (public.get_user_org_id() IS NULL AND org_id IS NULL)
    );

-- ==========================================
-- 10. NOTIFICATIONS — Kebijakan akses notifikasi
-- ==========================================
-- Notifikasi berbasis user_id langsung (bukan org_id)

CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        OR user_id IS NULL
    );

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (
        user_id = auth.uid()
    );

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (
        user_id = auth.uid()
    );
