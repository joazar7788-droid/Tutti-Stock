-- ============================================
-- SEED: Locations
-- ============================================

insert into locations (name, type) values
  ('Warehouse', 'warehouse'),
  ('Loshusan', 'branch'),
  ('Manor Park', 'branch'),
  ('Sovereign', 'branch'),
  ('Mo-Bay', 'branch'),
  ('Portmore', 'branch'),
  ('Ocho Rios', 'branch');

-- ============================================
-- SEED: Sample items (frozen yogurt business)
-- ============================================

insert into items (sku, name, category, unit, reorder_point, target_stock, is_favorite) values
  ('YOG-VAN', 'Vanilla Yogurt Base', 'Yogurt Base', 'kg', 20, 100, true),
  ('YOG-CHO', 'Chocolate Yogurt Base', 'Yogurt Base', 'kg', 20, 100, true),
  ('YOG-STR', 'Strawberry Yogurt Base', 'Yogurt Base', 'kg', 15, 80, true),
  ('TOP-SPR', 'Rainbow Sprinkles', 'Toppings', 'kg', 5, 30, false),
  ('TOP-ORE', 'Oreo Crumbs', 'Toppings', 'kg', 5, 25, false),
  ('TOP-FRU', 'Mixed Fruit', 'Toppings', 'kg', 10, 40, true),
  ('CUP-SML', 'Small Cups', 'Packaging', 'pcs', 200, 1000, false),
  ('CUP-MED', 'Medium Cups', 'Packaging', 'pcs', 200, 1000, false),
  ('CUP-LRG', 'Large Cups', 'Packaging', 'pcs', 150, 800, false),
  ('SPO-STD', 'Spoons', 'Packaging', 'pcs', 300, 1500, false),
  ('NAP-STD', 'Napkins', 'Packaging', 'pcs', 500, 2000, false),
  ('SAU-CAR', 'Caramel Sauce', 'Sauces', 'litre', 5, 20, false),
  ('SAU-CHO', 'Chocolate Sauce', 'Sauces', 'litre', 5, 20, false);
