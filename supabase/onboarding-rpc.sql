-- ============================================================
-- WEDORA — Onboarding RPC Function
-- ============================================================
-- Jalankan file ini di Supabase Dashboard → SQL Editor
--
-- Fungsi ini menangani seluruh proses onboarding secara atomic:
--   1. Tambah kolom trial_ends_at ke organizations (jika belum ada)
--   2. Insert organization baru dengan plan trial
--   3. Upsert row user di public.users (buat baru atau update org_id)
--
-- SECURITY DEFINER → berjalan sebagai postgres superuser,
-- sehingga bypass RLS timing issue sepenuhnya.
-- ============================================================

-- ── STEP 0: Pastikan kolom trial_ends_at ada ──────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ
  DEFAULT (NOW() + INTERVAL '14 days');

ALTER TABLE public.organizations
  ALTER COLUMN plan SET DEFAULT 'trial';

-- ── STEP 1: Drop versi lama jika ada ─────────────────────────
DROP FUNCTION IF EXISTS public.complete_onboarding(text, text, text);
DROP FUNCTION IF EXISTS public.complete_onboarding(text, text, text, text);

-- ── STEP 2: Buat fungsi baru ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_org_name   TEXT,
  p_slug        TEXT,
  p_full_name   TEXT,
  p_email       TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID;
  v_org_id     UUID;
  v_trial_ends TIMESTAMPTZ;
  v_final_slug TEXT;
BEGIN
  -- Ambil UID dari sesi yang sedang login
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated — pastikan user sudah login sebelum onboarding';
  END IF;

  v_trial_ends  := NOW() + INTERVAL '14 days';
  v_final_slug  := p_slug;

  -- Jika slug sudah dipakai, tambahkan suffix acak
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_final_slug) THEN
    v_final_slug := v_final_slug || '-' || floor(random() * 9000 + 1000)::TEXT;
  END IF;

  -- Insert organization
  INSERT INTO public.organizations (name, slug, plan, trial_ends_at)
  VALUES (p_org_name, v_final_slug, 'trial', v_trial_ends)
  RETURNING id INTO v_org_id;

  -- Upsert user: buat baru jika belum ada, update org_id jika sudah ada
  INSERT INTO public.users (id, email, full_name, role, org_id)
  VALUES (v_user_id, p_email, p_full_name, 'owner', v_org_id)
  ON CONFLICT (id) DO UPDATE
    SET org_id    = EXCLUDED.org_id,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        email     = COALESCE(EXCLUDED.email,     public.users.email);

  RETURN json_build_object(
    'success',        true,
    'org_id',         v_org_id,
    'trial_ends_at',  v_trial_ends,
    'plan',           'trial'
  );
END;
$$;

-- ── STEP 3: Grant eksekusi ke authenticated users ─────────────
GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ── STEP 4: Verifikasi fungsi terpasang ──────────────────────
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name = 'complete_onboarding';
