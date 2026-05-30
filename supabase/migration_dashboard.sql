-- ============================================================
-- JALANKAN INI DI SUPABASE > SQL EDITOR
-- ============================================================

-- 1. Admin Permissions
CREATE TABLE IF NOT EXISTS admin_permissions (
  admin_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_approve_transactions boolean DEFAULT true,
  can_input_transactions boolean DEFAULT true,
  can_manage_members boolean DEFAULT true,
  can_manage_promos boolean DEFAULT false,
  can_manage_news boolean DEFAULT false,
  can_view_reports boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- 2. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text DEFAULT 'general',
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS Policies (opsional, aktifkan jika pakai RLS)
-- ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Index untuk performa
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- 5. Tambah kolom amount_after ke transactions jika belum ada
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS approved_at timestamptz;

SELECT 'Migration berhasil!' as result;
