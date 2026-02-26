-- Support 0.5 case quantities (e.g., chocolate sprinkles, M&Ms)
-- Changes qty columns from integer to numeric(10,1) to allow half-case entries

-- Drop the view that depends on transactions.qty and items.reorder_point/target_stock
DROP VIEW IF EXISTS inventory_levels;

-- Transactions ledger
ALTER TABLE transactions
  ALTER COLUMN qty TYPE numeric(10,1) USING qty::numeric(10,1);

-- Stock count items
ALTER TABLE stock_count_items
  ALTER COLUMN qty TYPE numeric(10,1) USING qty::numeric(10,1);

-- Delivery plan items
ALTER TABLE delivery_plan_items
  ALTER COLUMN qty TYPE numeric(10,1) USING qty::numeric(10,1);

-- Item settings (reorder point and target stock)
ALTER TABLE items
  ALTER COLUMN reorder_point TYPE numeric(10,1) USING reorder_point::numeric(10,1),
  ALTER COLUMN target_stock TYPE numeric(10,1) USING target_stock::numeric(10,1);

-- Recreate the inventory_levels view
CREATE VIEW inventory_levels AS
SELECT
  i.id AS item_id,
  i.name AS item_name,
  i.sku,
  i.category,
  i.unit,
  i.base_unit,
  i.pcs_per_box,
  i.reorder_point,
  i.target_stock,
  i.is_favorite,
  l.id AS location_id,
  l.name AS location_name,
  l.type AS location_type,
  coalesce(incoming.total, 0) - coalesce(outgoing.total, 0) AS on_hand
FROM items i
CROSS JOIN locations l
LEFT JOIN LATERAL (
  SELECT sum(t.qty) AS total
  FROM transactions t
  WHERE t.item_id = i.id AND t.to_location_id = l.id
) incoming ON true
LEFT JOIN LATERAL (
  SELECT sum(t.qty) AS total
  FROM transactions t
  WHERE t.item_id = i.id AND t.from_location_id = l.id
) outgoing ON true
WHERE i.is_active = true AND l.is_active = true;
