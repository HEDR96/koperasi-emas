ALTER TABLE product_orders
  ADD COLUMN IF NOT EXISTS customer_address text;
