-- ─────────────────────────────────────────────────────────────
-- PRODUCTS MIGRATION
-- Menambah stok ke tabel promos dan membuat tabel pembelian produk
-- ─────────────────────────────────────────────────────────────

-- 1. Tambah kolom stok ke promos
ALTER TABLE promos ADD COLUMN IF NOT EXISTS stok INTEGER DEFAULT NULL;

-- 2. Tabel pesanan produk
CREATE TABLE IF NOT EXISTS product_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  items         JSONB NOT NULL DEFAULT '[]',
  total_amount  NUMERIC(18,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','cancelled')),
  notes         TEXT,
  source        TEXT DEFAULT 'dashboard',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel pembayaran pesanan produk
CREATE TABLE IF NOT EXISTS product_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES product_orders(id) ON DELETE CASCADE,
  customer_name  TEXT,
  nominal        NUMERIC(18,2) NOT NULL,
  terbayar       NUMERIC(18,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  proof_url      TEXT,
  notes          TEXT,
  verified_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RLS
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_product_orders" ON product_orders;
CREATE POLICY "admin_product_orders" ON product_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('master','admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('master','admin'))
  );

DROP POLICY IF EXISTS "member_own_orders" ON product_orders;
CREATE POLICY "member_own_orders" ON product_orders
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "member_insert_own_order" ON product_orders;
CREATE POLICY "member_insert_own_order" ON product_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_product_payments" ON product_payments;
CREATE POLICY "admin_product_payments" ON product_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('master','admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('master','admin'))
  );
