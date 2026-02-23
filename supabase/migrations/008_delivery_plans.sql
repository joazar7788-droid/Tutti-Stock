-- Delivery plans: weekly delivery planning for the delivery manager
CREATE TABLE delivery_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  week_of DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_plans_week ON delivery_plans(week_of DESC, status);
-- Only one draft plan per week
CREATE UNIQUE INDEX idx_delivery_plans_draft_week ON delivery_plans(week_of) WHERE status = 'draft';

-- Delivery plan line items
CREATE TABLE delivery_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES delivery_plans(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  to_location_id UUID NOT NULL REFERENCES locations(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_plan_items_plan ON delivery_plan_items(plan_id);
-- Prevent duplicate item+branch in a plan
CREATE UNIQUE INDEX idx_delivery_plan_items_unique ON delivery_plan_items(plan_id, item_id, to_location_id);

-- Auto-update updated_at on delivery_plans
CREATE OR REPLACE FUNCTION update_delivery_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_plan_updated_at
  BEFORE UPDATE ON delivery_plans
  FOR EACH ROW EXECUTE FUNCTION update_delivery_plan_updated_at();

-- RLS
ALTER TABLE delivery_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_plan_items ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read plans
CREATE POLICY "Authenticated read delivery_plans"
  ON delivery_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert delivery_plans"
  ON delivery_plans FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Authenticated update own delivery_plans"
  ON delivery_plans FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Owners update any delivery_plans"
  ON delivery_plans FOR UPDATE TO authenticated
  USING (get_user_role() = 'owner');

-- Plan items: read all, manage own
CREATE POLICY "Authenticated read delivery_plan_items"
  ON delivery_plan_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert delivery_plan_items"
  ON delivery_plan_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM delivery_plans
    WHERE delivery_plans.id = plan_id
    AND delivery_plans.created_by = auth.uid()
  ));

CREATE POLICY "Authenticated update delivery_plan_items"
  ON delivery_plan_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM delivery_plans
    WHERE delivery_plans.id = plan_id
    AND delivery_plans.created_by = auth.uid()
  ));

CREATE POLICY "Authenticated delete delivery_plan_items"
  ON delivery_plan_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM delivery_plans
    WHERE delivery_plans.id = plan_id
    AND delivery_plans.created_by = auth.uid()
  ));
