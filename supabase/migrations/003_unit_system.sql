-- ============================================
-- Add base_unit and pcs_per_box to items
-- ============================================

alter table items add column base_unit text not null default 'pcs';
alter table items add constraint items_base_unit_check
  check (base_unit in ('boxes', 'pcs'));

alter table items add column pcs_per_box integer not null default 1;
alter table items add constraint items_pcs_per_box_check
  check (pcs_per_box >= 1);

-- ============================================
-- Recreate inventory_levels view with new columns
-- ============================================

drop view if exists inventory_levels;

create view inventory_levels as
select
  i.id as item_id,
  i.name as item_name,
  i.sku,
  i.category,
  i.unit,
  i.base_unit,
  i.pcs_per_box,
  i.reorder_point,
  i.target_stock,
  i.is_favorite,
  l.id as location_id,
  l.name as location_name,
  l.type as location_type,
  coalesce(incoming.total, 0) - coalesce(outgoing.total, 0) as on_hand
from items i
cross join locations l
left join lateral (
  select sum(t.qty) as total
  from transactions t
  where t.item_id = i.id and t.to_location_id = l.id
) incoming on true
left join lateral (
  select sum(t.qty) as total
  from transactions t
  where t.item_id = i.id and t.from_location_id = l.id
) outgoing on true
where i.is_active = true and l.is_active = true;
