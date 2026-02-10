-- 004_import_inventory.sql
-- Import real warehouse inventory from CSV (Feb 2026)
-- Replaces seed/sample items with actual business data

BEGIN;

-- ============================================================
-- Step 1: Clear seed data
-- ============================================================
DELETE FROM transactions;
DELETE FROM items;

-- ============================================================
-- Step 2: Insert all items from CSV
-- ============================================================
INSERT INTO items (sku, name, category, base_unit, pcs_per_box) VALUES

  -- POWDERS (pcs_per_box = 1, delivered by the case)
  ('PWD-CREAM-BASE',   'Cream Base',                'Powders', 'boxes', 1),
  ('PWD-TART-BASE',    'Tart Base',                 'Powders', 'boxes', 1),
  ('PWD-CHOC-BASE',    'Chocolate Base',             'Powders', 'boxes', 1),
  ('PWD-FROST-CHOC',   'Frostline Chocolate Base',   'Powders', 'boxes', 1),
  ('PWD-VANILLA',      'Vanilla',                    'Powders', 'boxes', 1),
  ('PWD-NSA-VANILLA',  'NSA Vanilla',                'Powders', 'boxes', 1),
  ('PWD-FROST-VAN',    'Frostline Vanilla',          'Powders', 'boxes', 1),
  ('PWD-SALT-CARM',    'Salted Caramel',             'Powders', 'boxes', 1),
  ('PWD-RED-VELVET',   'Red Velvet',                 'Powders', 'boxes', 1),
  ('PWD-COFFEE',       'Coffee Powder',              'Powders', 'boxes', 1),
  ('PWD-ALMOND',       'Almond',                     'Powders', 'boxes', 1),
  ('PWD-COCONUT',      'Coconut',                    'Powders', 'boxes', 1),
  ('PWD-COTTON-CAN',   'Cotton Candy',               'Powders', 'boxes', 1),
  ('PWD-PISTACHIO',    'Pistachio',                  'Powders', 'boxes', 1),
  ('PWD-SORBET',       'Sorbet',                     'Powders', 'boxes', 1),

  -- INGREDIENT SYRUPS (pcs_per_box from CSV parentheticals)
  ('SYR-BLUEBERRY',    'Blueberry',                  'Ingredient Syrups', 'boxes', 6),
  ('SYR-BUTTER-PEC',   'Butter Pecan',               'Ingredient Syrups', 'boxes', 12),
  ('SYR-CHEESECAKE',   'Cheesecake Syrup',           'Ingredient Syrups', 'boxes', 12),
  ('SYR-ENG-TOFFEE',   'English Toffee',             'Ingredient Syrups', 'boxes', 12),
  ('SYR-HIBISCUS',     'Hibiscus',                   'Ingredient Syrups', 'boxes', 6),
  ('SYR-LEMON',        'Lemon',                      'Ingredient Syrups', 'boxes', 6),
  ('SYR-LYCHEE',       'Lychee',                     'Ingredient Syrups', 'boxes', 6),
  ('SYR-MANGO',        'Mango',                      'Ingredient Syrups', 'boxes', 6),
  ('SYR-ORANGE',       'Orange',                     'Ingredient Syrups', 'boxes', 6),
  ('SYR-PASSION-FR',   'Passion Fruit',              'Ingredient Syrups', 'boxes', 6),
  ('SYR-PEACH',        'Peach',                      'Ingredient Syrups', 'boxes', 6),
  ('SYR-PINEAPPLE',    'Pineapple',                  'Ingredient Syrups', 'boxes', 6),
  ('SYR-PISTACHIO',    'Pistachio',                  'Ingredient Syrups', 'boxes', 12),
  ('SYR-PLUM',         'Plum',                       'Ingredient Syrups', 'boxes', 6),
  ('SYR-POMEGRANATE',  'Pomegranate',                'Ingredient Syrups', 'boxes', 6),
  ('SYR-RASPBERRY',    'Raspberry',                  'Ingredient Syrups', 'boxes', 6),
  ('SYR-RED-GUAVA',    'Red Guava',                  'Ingredient Syrups', 'boxes', 6),
  ('SYR-STRAWBERRY',   'Strawberry',                 'Ingredient Syrups', 'boxes', 6),
  ('SYR-TIRAMISU',     'Tiramisu',                   'Ingredient Syrups', 'boxes', 12),
  ('SYR-TOAST-MARSH',  'Toasted Marshmallow',        'Ingredient Syrups', 'boxes', 12),
  ('SYR-TROPICAL',     'Tropical',                   'Ingredient Syrups', 'boxes', 6),
  ('SYR-WATERMELON',   'Watermelon',                 'Ingredient Syrups', 'boxes', 1),

  -- TOPPINGS (pcs_per_box from CSV parentheticals, default 1 where not specified)
  ('TOP-ALMOND',       'Almond',                     'Toppings', 'boxes', 1),
  ('TOP-BLUE-RASP',    'Blue Raspberry Rings',       'Toppings', 'boxes', 1),
  ('TOP-BROKEN-OREO',  'Broken Oreo',                'Toppings', 'boxes', 1),
  ('TOP-BUTTER-FIN',   'Butter Fingers',             'Toppings', 'boxes', 1),
  ('TOP-CARM-TURTLE',  'Caramel Turtles',            'Toppings', 'boxes', 1),
  ('TOP-CHO-COOKIE',   'Cho Chip Cookie Bites',      'Toppings', 'boxes', 1),
  ('TOP-CHOC-DOUGH',   'Chocolate Chip Cookie Dough','Toppings', 'boxes', 1),
  ('TOP-CHOC-CHIPS',   'Chocolate Chips',            'Toppings', 'boxes', 1),
  ('TOP-CHOC-SPRINK',  'Chocolate Sprinkles',        'Toppings', 'boxes', 1),
  ('TOP-CHOP-TWIX',    'Chopped Twix Caramel',       'Toppings', 'boxes', 1),
  ('TOP-COCONUT-FL',   'Coconut Flakes',             'Toppings', 'boxes', 1),
  ('TOP-COOKIE-CRM',   'Cookie And Cream Bites',     'Toppings', 'boxes', 1),
  ('TOP-CUPCAKE',      'Cup Cake Bites',             'Toppings', 'boxes', 1),
  ('TOP-DARK-RAISIN',  'Dark Chocolate Raisins',     'Toppings', 'boxes', 1),
  ('TOP-FROST-CRACK',  'Frosted Animal Crackers',    'Toppings', 'boxes', 1),
  ('TOP-GRAHAM',       'Graham Crackers',            'Toppings', 'boxes', 1),
  ('TOP-GREEN-APPLE',  'Green Apple Belts',          'Toppings', 'boxes', 1),
  ('TOP-GUMMY-APPLE',  'Gummy Apple',                'Toppings', 'boxes', 1),
  ('TOP-GUMMY-BEAR',   'Gummy Bears',                'Toppings', 'boxes', 4),
  ('TOP-GUMMY-BFLY',   'Gummy Butterflies',          'Toppings', 'boxes', 4),
  ('TOP-GUMMY-DINO',   'Gummy Dinosaurs',            'Toppings', 'boxes', 1),
  ('TOP-GUMMY-FROG',   'Gummy Frog',                 'Toppings', 'boxes', 4),
  ('TOP-GUMMY-WORM',   'Gummy Fruit Worms',          'Toppings', 'boxes', 4),
  ('TOP-GUMMY-ICEP',   'Gummy Ice Pops',             'Toppings', 'boxes', 1),
  ('TOP-GUMMY-PRING',  'Gummy Peach Rings',          'Toppings', 'boxes', 4),
  ('TOP-GUMMY-SHARK',  'Gummy Shark',                'Toppings', 'boxes', 4),
  ('TOP-GUMMY-SWORM',  'Gummy Sour Worms',           'Toppings', 'boxes', 4),
  ('TOP-GUMMY-SRING',  'Gummy Strawberry Rings',     'Toppings', 'boxes', 4),
  ('TOP-GUMMY-WRING',  'Gummy Watermelon Ring',      'Toppings', 'boxes', 4),
  ('TOP-HEATH',        'Heath Toffee',               'Toppings', 'boxes', 1),
  ('TOP-HERSHEYS',     'Hersheys',                   'Toppings', 'boxes', 1),
  ('TOP-JELLY-BEAN',   'Jelly Bean',                 'Toppings', 'boxes', 1),
  ('TOP-JETS',         'Jets',                       'Toppings', 'boxes', 1),
  ('TOP-KIT-KAT',      'Kit Kat',                    'Toppings', 'boxes', 1),
  ('TOP-M-AND-M',      'M & M',                      'Toppings', 'boxes', 1),
  ('TOP-MARSHMALLOW',  'Marshmallow',                'Toppings', 'boxes', 12),
  ('TOP-NERDS',        'Nerds',                      'Toppings', 'boxes', 1),
  ('TOP-PEANUTS',      'Peanuts',                    'Toppings', 'boxes', 1),
  ('TOP-RAIN-SPRINK',  'Rainbow Sprinkles',          'Toppings', 'boxes', 1),
  ('TOP-REESES',       'Reese''s',                   'Toppings', 'boxes', 1),
  ('TOP-ROYAL-COCO',   'Royal Coco Drops',           'Toppings', 'boxes', 1),
  ('TOP-SKITTLES',     'Skittles',                   'Toppings', 'boxes', 6),
  ('TOP-SNICKERS',     'Snickers',                   'Toppings', 'boxes', 1),
  ('TOP-SOUR-PATCH',   'Sour Patch',                 'Toppings', 'boxes', 4),
  ('TOP-WALNUT-SYR',   'Walnuts In Maple Syrup',     'Toppings', 'boxes', 3),
  ('TOP-YOG-RAISIN',   'Yogurt Raisins',             'Toppings', 'boxes', 1),

  -- TOPPING SAUCES
  ('SAU-CHOC-GROUND',  'Chocolate Sweet Ground',     'Topping Sauces', 'boxes', 6),
  ('SAU-CINNAMON',     'Cinnamon',                   'Topping Sauces', 'boxes', 12),
  ('SAU-HOT-FUDGE',    'Hot Fudge',                  'Topping Sauces', 'boxes', 1),
  ('SAU-KIWI-LIME',    'Kiwi Lime',                  'Topping Sauces', 'boxes', 12),
  ('SAU-MELT-MARSH',   'Melted Marshmallow',         'Topping Sauces', 'boxes', 6),
  ('SAU-STRAW-DESS',   'Strawberry Dessert',         'Topping Sauces', 'boxes', 12),
  ('SAU-CARM-GHIR',    'Caramel Ghirardelli Sauce',  'Topping Sauces', 'boxes', 6),
  ('SAU-CARM-FUDGE',   'Caramel Fudge',              'Topping Sauces', 'boxes', 6),
  ('SAU-WH-CHOC-LG',   'White Chocolate Sauce Lrg',  'Topping Sauces', 'boxes', 6),
  ('SAU-WH-CHOC-SM',   'White Chocolate Sauce Sml',  'Topping Sauces', 'boxes', 12),
  ('SAU-MANGO',        'Mango',                      'Topping Sauces', 'boxes', 6),
  ('SAU-PASSION',      'Passion',                    'Topping Sauces', 'boxes', 6),
  ('SAU-RASPBERRY',    'Raspberry',                  'Topping Sauces', 'boxes', 12),
  ('SAU-GHIR-CHOC',    'Ghirardelli Chocolate',      'Topping Sauces', 'boxes', 12),

  -- BOBAS
  ('BOB-MANGO',        'Mango',                      'Bobas', 'boxes', 4),
  ('BOB-POMEGRANATE',  'Pomegranate',                'Bobas', 'boxes', 4),
  ('BOB-STRAWBERRY',   'Strawberry',                 'Bobas', 'boxes', 4),
  ('BOB-GREEN-APPLE',  'Green Apple',                'Bobas', 'boxes', 4),

  -- CONTAINERS (pcs_per_box = 1, delivered by the case)
  ('CON-TF-SPOONS',    'T.F. Spoons',               'Containers', 'boxes', 1),
  ('CON-16OZ-CUPS',    '16 Oz Cups',                'Containers', 'boxes', 1),
  ('CON-16OZ-LIDS',    '16 Oz Lids',                'Containers', 'boxes', 1),
  ('CON-SAMPLE-CUP',   'Sample Cups',               'Containers', 'boxes', 1),
  ('CON-WAFFLE-BWL',   'Waffle Bowl',               'Containers', 'boxes', 1),
  ('CON-CONES',        'Cones',                     'Containers', 'boxes', 1),
  ('CON-NAPKIN',       'Napkin (White)',             'Containers', 'boxes', 1),
  ('CON-LUBRICANT',    'Lubricant',                 'Containers', 'pcs',   1);

-- ============================================================
-- Step 3: Insert initial inventory adjustments
-- Only for items with quantity > 0
-- Quantities are in pcs (cases × pcs_per_box + loose units)
-- ============================================================
WITH owner AS (
  SELECT id FROM profiles WHERE role = 'owner' LIMIT 1
),
warehouse AS (
  SELECT id FROM locations WHERE type = 'warehouse' LIMIT 1
)
INSERT INTO transactions (created_by, transaction_type, item_id, to_location_id, qty, reason)
SELECT
  owner.id,
  'ADJUST',
  items.id,
  warehouse.id,
  v.qty,
  'Initial inventory import - Feb 2026'
FROM owner, warehouse,
  (VALUES
    -- POWDERS (pcs_per_box=1, qty = cases)
    ('PWD-CREAM-BASE',   14),
    ('PWD-TART-BASE',    71),
    ('PWD-CHOC-BASE',    35),
    ('PWD-VANILLA',      1),
    ('PWD-NSA-VANILLA',  123),
    ('PWD-SALT-CARM',    3),
    ('PWD-COTTON-CAN',   18),
    ('PWD-SORBET',       36),

    -- INGREDIENT SYRUPS (qty = cases × pcs_per_box + loose)
    ('SYR-BLUEBERRY',    165),   -- 27×6 + 3
    ('SYR-BUTTER-PEC',   96),    -- 8×12
    ('SYR-CHEESECAKE',   310),   -- 25×12 + 10
    ('SYR-ENG-TOFFEE',   1),     -- 1 bottle
    ('SYR-LEMON',        114),   -- 19×6
    ('SYR-LYCHEE',       345),   -- 57×6 + 3
    ('SYR-ORANGE',       42),    -- 7×6
    ('SYR-PASSION-FR',   203),   -- 33×6 + 5
    ('SYR-PEACH',        41),    -- 6×6 + 5
    ('SYR-PISTACHIO',    181),   -- 15×12 + 1
    ('SYR-PLUM',         84),    -- 14×6
    ('SYR-POMEGRANATE',  219),   -- 36×6 + 3
    ('SYR-RASPBERRY',    175),   -- 29×6 + 1
    ('SYR-RED-GUAVA',    118),   -- 19×6 + 4
    ('SYR-STRAWBERRY',   361),   -- 60×6 + 1
    ('SYR-TIRAMISU',     24),    -- 2×12
    ('SYR-TOAST-MARSH',  271),   -- 22×12 + 7
    ('SYR-TROPICAL',     48),    -- 8×6

    -- TOPPINGS
    ('TOP-ALMOND',       5),     -- 5 cases (pcs_per_box=1)
    ('TOP-BROKEN-OREO',  16),    -- 16 cases
    ('TOP-CHOC-SPRINK',  9),     -- 9 cases
    ('TOP-COCONUT-FL',   18),    -- 18 cases
    ('TOP-GUMMY-BEAR',   94),    -- 23×4 + 2
    ('TOP-GUMMY-BFLY',   22),    -- 5×4 + 2
    ('TOP-GUMMY-FROG',   29),    -- 6×4 + 5
    ('TOP-GUMMY-WORM',   71),    -- 17×4 + 3
    ('TOP-GUMMY-SWORM',  60),    -- 15×4
    ('TOP-GUMMY-SRING',  40),    -- 10×4
    ('TOP-HERSHEYS',     1),     -- 1 case
    ('TOP-M-AND-M',      29),    -- 29 cases
    ('TOP-MARSHMALLOW',  209),   -- 17×12 + 5
    ('TOP-NERDS',        15),    -- 15 cases
    ('TOP-PEANUTS',      10),    -- 10 cases
    ('TOP-RAIN-SPRINK',  6),     -- 6 cases
    ('TOP-SKITTLES',     309),   -- 51×6 + 3
    ('TOP-WALNUT-SYR',   20),    -- 6×3 + 2

    -- TOPPING SAUCES
    ('SAU-CHOC-GROUND',  42),    -- 7×6
    ('SAU-KIWI-LIME',    3),     -- 3 bottles
    ('SAU-MELT-MARSH',   130),   -- 21×6 + 4
    ('SAU-STRAW-DESS',   156),   -- 13×12
    ('SAU-CARM-GHIR',    85),    -- 14×6 + 1
    ('SAU-CARM-FUDGE',   39),    -- 6×6 + 3
    ('SAU-WH-CHOC-LG',   27),    -- 4×6 + 3
    ('SAU-MANGO',        78),    -- 13×6
    ('SAU-RASPBERRY',    69),    -- 5×12 + 9
    ('SAU-GHIR-CHOC',    58),    -- 4×12 + 10

    -- BOBAS
    ('BOB-MANGO',        16),    -- 4×4
    ('BOB-POMEGRANATE',  16),    -- 4×4
    ('BOB-STRAWBERRY',   28),    -- 7×4

    -- CONTAINERS (pcs_per_box=1, qty = cases)
    ('CON-TF-SPOONS',    106),
    ('CON-16OZ-CUPS',    178),
    ('CON-16OZ-LIDS',    235),
    ('CON-SAMPLE-CUP',   28),
    ('CON-WAFFLE-BWL',   2),
    ('CON-CONES',        24),
    ('CON-NAPKIN',       55),
    ('CON-LUBRICANT',    34)
  ) AS v(sku, qty)
JOIN items ON items.sku = v.sku;

COMMIT;
