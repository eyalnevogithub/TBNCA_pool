-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/hcljhwzvukxxbicymrga/sql)

-- Residents table
CREATE TABLE IF NOT EXISTS residents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  dues_owed NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(full_name, address)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_resident NUMERIC(10,2) NOT NULL,
  price_guest NUMERIC(10,2) NOT NULL,
  max_quantity INTEGER DEFAULT 10,
  product_type TEXT NOT NULL CHECK (product_type IN ('pool_tag', 'day_pass')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  resident_id UUID REFERENCES residents(id),
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL,
  is_resident BOOLEAN DEFAULT false,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  dues_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  waiver_name TEXT DEFAULT '',
  waiver_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  pass_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_residents_name_address ON residents(LOWER(full_name), LOWER(address));
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Seed default products
INSERT INTO products (name, description, price_resident, price_guest, max_quantity, product_type)
VALUES
  ('Pool Tag', 'Season pool tag for the TBNCA pool. First tag is $20, additional tags are $5 each.', 20.00, 5.00, 20, 'pool_tag'),
  ('Day Pass', 'Single day pass for the TBNCA pool. Valid for the selected date only.', 10.00, 15.00, 5, 'day_pass')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (but allow service role full access)
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access to products
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

-- Service role has full access (API routes use service role key)
-- No additional policies needed since service_role bypasses RLS
