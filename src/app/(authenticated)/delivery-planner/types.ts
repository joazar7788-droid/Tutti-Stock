export type PlannerItem = {
  id: string;
  name: string;
  category: string | null;
  baseUnit: "boxes" | "pcs";
  pcsPerBox: number;
  unit: string;
  branchCounts: Record<string, number | null>; // locationId -> qty in pcs (null = no count)
  warehouseOnHand: number; // pcs
};

export type PlannerBranch = {
  id: string;
  name: string;
  countDate: string | null;
};

export type PlannerPlanItem = {
  id: string;
  itemId: string;
  toLocationId: string;
  qty: number; // pcs
};

export type PlannerPlan = {
  id: string;
  status: "draft" | "finalized";
  weekOf: string;
  items: PlannerPlanItem[];
};
