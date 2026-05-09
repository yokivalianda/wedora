-- ============================================================
-- WEDORA — Onboarding RPC Function
-- ============================================================
-- Jalankan file ini di Supabase Dashboard → SQL Editor
-- SETELAH menjalankan fix-rls-migration.sql
--
-- Fungsi ini menangani seluruh proses onboarding secara atomic:
-- 1. Buat organization baru dengan plan trial
-- 2. Upsert row user di public.users (buat baru atau update)
-- 3. Set org_id pada user
--
-- Menggunakan SECURITY DEFINER agar bisa bypass RLS selama
-- proses setup awal (sebelum user punya org_id).
-- ============================================================

-- Drop fungsi lama jika ada
DROP FUNCTION IF EXISTS public.complete_onboarding(text, text, text);
DROP FUNCTION IF EXISTS public.complete_onboarding(text, text, text, text);

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_org_name   text,
  p_slug        text,
  p_full_name   text,
  p_email       text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid;
  v_org_id     uuid;
  v_trial_ends timestamptz;
  v_result     json;
BEGIN
  -- Ambil uid dari sesi yang sedang login
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Hitung tanggal akhir trial (14 hari dari sekarang)
  v_trial_ends := now() + interval '14 days';

  -- 1. Insert organization baru
  INSERT INTO public.organizations (name, slug, plan, trial_ends_at)
  VALUES (p_org_name, p_slug, 'trial', v_trial_ends)
  RETURNING id INTO v_org_id;

  -- 2. Upsert user — buat baru jika belum ada, update jika sudah ada
  INSERT INTO public.users (id, email, full_name, role, org_id)
  VALUES (v_user_id, p_email, p_full_name, 'owner', v_org_id)
  ON CONFLICT (id) DO UPDATE
    SET org_id    = v_org_id,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        email     = COALESCE(EXCLUDED.email,     public.users.email);

  -- Kembalikan data org yang baru dibuat
  SELECT json_build_object(
    'org_id',       v_org_id,
    'trial_ends_at', v_trial_ends,
    'plan',         'trial'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN unique_violation THEN
    -- slug sudah ada, coba tambahkan suffix acak
    INSERT INTO public.organizations (name, slug, plan, trial_ends_at)
    VALUES (p_org_name, p_slug || '-' || floor(random() * 9000 + 1000)::text, 'trial', v_trial_ends)
    RETURNING id INTO v_org_id;

    INSERT INTO public.users (id, email, full_name, role, org_id)
    VALUES (v_user_id, p_email, p_full_name, 'owner', v_org_id)
    ON CONFLICT (id) DO UPDATE
      SET org_id    = v_org_id,
          full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
          email     = COALESCE(EXCLUDED.email,     public.users.email);

    SELECT json_build_object(
      'org_id',        v_org_id,
      'trial_ends_at', v_trial_ends,
      'plan',          'trial'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Berikan izin eksekusi ke authenticated users
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text, text, text, text) TO authenticated;

-- ============================================================
-- JUGA: pastikan kolom trial_ends_at ada di organizations
-- (aman dijalankan berulang kali)
-- ============================================================
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '14 days');
