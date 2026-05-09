-- ============================================================
-- WEDORA — RLS Migration: Drop semua policy lama & buat ulang
-- ============================================================
-- Jalankan file ini di Supabase Dashboard → SQL Editor
-- Ini akan menghapus SEMUA policy yang ada dan membuat ulang
-- dengan benar untuk memastikan isolasi data antar akun.
--
-- URUTAN EKSEKUSI YANG BENAR:
--   1. fix-rls-migration.sql  ← file ini
--   2. onboarding-rpc.sql     ← RPC function untuk onboarding
-- ============================================================

-- ============================================================
-- STEP 0: PASTIKAN KOLOM trial_ends_at ADA DI ORGANIZATIONS
-- (aman dijalankan berulang kali / idempotent)
-- ============================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '14 days');

-- Pastikan kolom plan default ke 'trial' untuk akun baru
ALTER TABLE public.organizations
  ALTER COLUMN plan SET DEFAULT 'trial';

-- ============================================================
-- STEP 1: DROP SEMUA POLICY LAMA
-- ============================================================

-- organizations
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

-- users
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- wedding_projects
DROP POLICY IF EXISTS "wedding_projects_select_policy" ON wedding_projects;
DROP POLICY IF EXISTS "wedding_projects_insert_policy" ON wedding_projects;
DROP POLICY IF EXISTS "wedding_projects_update_policy" ON wedding_projects;
DROP POLICY IF EXISTS "wedding_projects_delete_policy" ON wedding_projects;

-- tasks
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

-- payments
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;

-- vendors
DROP POLICY IF EXISTS "vendors_select_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_insert_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_update_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_delete_policy" ON vendors;

-- documents
DROP POLICY IF EXISTS "documents_select_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;

-- activities
DROP POLICY IF EXISTS "activities_select_policy" ON activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
DROP POLICY IF EXISTS "activities_update_policy" ON activities;
DROP POLICY IF EXISTS "activities_delete_policy" ON activities;

-- timeline_events
DROP POLICY IF EXISTS "timeline_events_select_policy" ON timeline_events;
DROP POLICY IF EXISTS "timeline_events_insert_policy" ON timeline_events;
DROP POLICY IF EXISTS "timeline_events_update_policy" ON timeline_events;
DROP POLICY IF EXISTS "timeline_events_delete_policy" ON timeline_events;

-- notifications
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

-- ============================================================
-- STEP 2: PASTIKAN RLS AKTIF DI SEMUA TABEL
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: BUAT ULANG HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- STEP 4: BUAT POLICY BARU YANG AMAN
-- ============================================================

-- ------------------------------------------------------------
-- ORGANIZATIONS
-- User hanya bisa lihat/edit organisasi miliknya sendiri
-- ------------------------------------------------------------
CREATE POLICY "organizations_select_policy" ON organizations
    FOR SELECT USING (
        id = public.get_user_org_id()
    );

CREATE POLICY "organizations_insert_policy" ON organizations
    FOR INSERT WITH CHECK (true);  -- siapa saja bisa buat org (saat onboarding)

CREATE POLICY "organizations_update_policy" ON organizations
    FOR UPDATE USING (
        id = public.get_user_org_id()
    );

CREATE POLICY "organizations_delete_policy" ON organizations
    FOR DELETE USING (
        id = public.get_user_org_id()
    );

-- ------------------------------------------------------------
-- USERS
-- User hanya bisa lihat dirinya sendiri atau anggota org yang sama
-- ------------------------------------------------------------
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        id = auth.uid()
        OR (
            org_id IS NOT NULL
            AND org_id = public.get_user_org_id()
        )
    );

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        id = auth.uid()  -- hanya bisa insert profil sendiri
    );

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        id = auth.uid()  -- hanya bisa update profil sendiri
    );

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        id = auth.uid()
    );

-- ------------------------------------------------------------
-- WEDDING_PROJECTS
-- Isolasi ketat: HANYA bisa akses data milik org sendiri
-- org_id WAJIB terisi dan cocok dengan org user
-- ------------------------------------------------------------
CREATE POLICY "wedding_projects_select_policy" ON wedding_projects
    FOR SELECT USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "wedding_projects_insert_policy" ON wedding_projects
    FOR INSERT WITH CHECK (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "wedding_projects_update_policy" ON wedding_projects
    FOR UPDATE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "wedding_projects_delete_policy" ON wedding_projects
    FOR DELETE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

-- ------------------------------------------------------------
-- TASKS
-- Isolasi ketat: HANYA bisa akses data milik org sendiri
-- ------------------------------------------------------------
CREATE POLICY "tasks_select_policy" ON tasks
    FOR SELECT USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "tasks_insert_policy" ON tasks
    FOR INSERT WITH CHECK (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "tasks_update_policy" ON tasks
    FOR UPDATE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "tasks_delete_policy" ON tasks
    FOR DELETE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

-- ------------------------------------------------------------
-- PAYMENTS
-- Isolasi ketat: HANYA bisa akses data milik org sendiri
-- ------------------------------------------------------------
CREATE POLICY "payments_select_policy" ON payments
    FOR SELECT USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "payments_insert_policy" ON payments
    FOR INSERT WITH CHECK (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "payments_update_policy" ON payments
    FOR UPDATE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "payments_delete_policy" ON payments
    FOR DELETE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

-- ------------------------------------------------------------
-- VENDORS
-- Isolasi ketat: HANYA bisa akses data milik org sendiri
-- ------------------------------------------------------------
CREATE POLICY "vendors_select_policy" ON vendors
    FOR SELECT USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "vendors_insert_policy" ON vendors
    FOR INSERT WITH CHECK (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "vendors_update_policy" ON vendors
    FOR UPDATE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "vendors_delete_policy" ON vendors
    FOR DELETE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

-- ------------------------------------------------------------
-- DOCUMENTS
-- Isolasi ketat: HANYA bisa akses data milik org sendiri
-- ------------------------------------------------------------
CREATE POLICY "documents_select_policy" ON documents
    FOR SELECT USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "documents_insert_policy" ON documents
    FOR INSERT WITH CHECK (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "documents_update_policy" ON documents
    FOR UPDATE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "documents_delete_policy" ON documents
    FOR DELETE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

-- ------------------------------------------------------------
-- ACTIVITIES
-- Isolasi ketat: HANYA bisa akses data milik org sendiri
-- ------------------------------------------------------------
CREATE POLICY "activities_select_policy" ON activities
    FOR SELECT USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "activities_insert_policy" ON activities
    FOR INSERT WITH CHECK (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "activities_update_policy" ON activities
    FOR UPDATE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "activities_delete_policy" ON activities
    FOR DELETE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

-- ------------------------------------------------------------
-- TIMELINE_EVENTS
-- Isolasi ketat: HANYA bisa akses data milik org sendiri
-- ------------------------------------------------------------
CREATE POLICY "timeline_events_select_policy" ON timeline_events
    FOR SELECT USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "timeline_events_insert_policy" ON timeline_events
    FOR INSERT WITH CHECK (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "timeline_events_update_policy" ON timeline_events
    FOR UPDATE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

CREATE POLICY "timeline_events_delete_policy" ON timeline_events
    FOR DELETE USING (
        org_id IS NOT NULL
        AND org_id = public.get_user_org_id()
    );

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- Berbasis user_id langsung (bukan org_id)
-- ------------------------------------------------------------
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- STEP 5: VERIFIKASI — cek policy yang aktif sekarang
-- ============================================================
-- Uncomment baris berikut untuk melihat semua policy aktif:
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
