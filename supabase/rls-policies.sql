-- ==========================================
-- Wedora SaaS — Row Level Security (RLS) Policies
-- ==========================================
-- Prasyarat:
-- - Supabase Auth aktif, auth.uid() mengembalikan UUID user yang login
-- - Tabel `users` menghubungkan auth user ke organisasi via org_id
-- - Semua tabel data memiliki kolom org_id (kecuali notifications yang pakai user_id)
--
-- PENTING tentang isolasi data:
-- - User HANYA bisa melihat data milik org_id mereka sendiri
-- - Jika user belum onboarding (org_id NULL), mereka TIDAK bisa melihat data
--   milik user lain yang juga org_id NULL
-- - Kita gunakan created_by pattern implisit: data tanpa org hanya bisa diakses
--   oleh user yang memilikinya (ditangani di level aplikasi via localStorage)
-- ==========================================

-- ==========================================
-- HELPER FUNCTION: Mendapatkan org_id user yang sedang login
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- 1. ORGANIZATIONS
-- ==========================================

CREATE POLICY "organizations_select_policy" ON organizations
    FOR SELECT USING (
        id = public.get_user_org_id()
    );

CREATE POLICY "organizations_insert_policy" ON organizations
    FOR INSERT WITH CHECK (
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
-- 2. USERS
-- ==========================================

CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        id = auth.uid()
        OR org_id = public.get_user_org_id()
    );

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        id = auth.uid()
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
-- 3. WEDDING_PROJECTS
-- ==========================================

CREATE POLICY "wedding_projects_select_policy" ON wedding_projects
    FOR SELECT USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "wedding_projects_insert_policy" ON wedding_projects
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "wedding_projects_update_policy" ON wedding_projects
    FOR UPDATE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "wedding_projects_delete_policy" ON wedding_projects
    FOR DELETE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

-- ==========================================
-- 4. TASKS
-- ==========================================

CREATE POLICY "tasks_select_policy" ON tasks
    FOR SELECT USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "tasks_insert_policy" ON tasks
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "tasks_update_policy" ON tasks
    FOR UPDATE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "tasks_delete_policy" ON tasks
    FOR DELETE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

-- ==========================================
-- 5. PAYMENTS
-- ==========================================

CREATE POLICY "payments_select_policy" ON payments
    FOR SELECT USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "payments_insert_policy" ON payments
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "payments_update_policy" ON payments
    FOR UPDATE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "payments_delete_policy" ON payments
    FOR DELETE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

-- ==========================================
-- 6. VENDORS
-- ==========================================

CREATE POLICY "vendors_select_policy" ON vendors
    FOR SELECT USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "vendors_insert_policy" ON vendors
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "vendors_update_policy" ON vendors
    FOR UPDATE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "vendors_delete_policy" ON vendors
    FOR DELETE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

-- ==========================================
-- 7. DOCUMENTS
-- ==========================================

CREATE POLICY "documents_select_policy" ON documents
    FOR SELECT USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "documents_insert_policy" ON documents
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "documents_update_policy" ON documents
    FOR UPDATE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "documents_delete_policy" ON documents
    FOR DELETE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

-- ==========================================
-- 8. ACTIVITIES
-- ==========================================

CREATE POLICY "activities_select_policy" ON activities
    FOR SELECT USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "activities_insert_policy" ON activities
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "activities_update_policy" ON activities
    FOR UPDATE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "activities_delete_policy" ON activities
    FOR DELETE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

-- ==========================================
-- 9. TIMELINE_EVENTS
-- ==========================================

CREATE POLICY "timeline_events_select_policy" ON timeline_events
    FOR SELECT USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "timeline_events_insert_policy" ON timeline_events
    FOR INSERT WITH CHECK (
        org_id = public.get_user_org_id()
        OR org_id IS NULL
    );

CREATE POLICY "timeline_events_update_policy" ON timeline_events
    FOR UPDATE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

CREATE POLICY "timeline_events_delete_policy" ON timeline_events
    FOR DELETE USING (
        org_id IS NOT NULL AND org_id = public.get_user_org_id()
    );

-- ==========================================
-- 10. NOTIFICATIONS
-- ==========================================

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
