-- Add counter role (must be outside transaction block)
ALTER TYPE user_role ADD VALUE 'counter';

-- Stock counts: one row per count submission
CREATE TABLE stock_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  counted_by text NOT NULL,
  submitted_by uuid NOT NULL REFERENCES profiles(id),
  week_of date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_counts_location_week ON stock_counts(location_id, week_of DESC);

-- Stock count items: one row per item in a count
CREATE TABLE stock_count_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_id uuid NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  qty integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_stock_count_items_count ON stock_count_items(stock_count_id);

-- RLS
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read stock_counts"
  ON stock_counts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert stock_counts"
  ON stock_counts FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Authenticated read stock_count_items"
  ON stock_count_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert stock_count_items"
  ON stock_count_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stock_counts
    WHERE stock_counts.id = stock_count_items.stock_count_id
    AND stock_counts.submitted_by = auth.uid()
  ));
