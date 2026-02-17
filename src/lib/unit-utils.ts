export type BaseUnit = "boxes" | "pcs";
export type InputUnit = "boxes" | "pcs";

/**
 * Convert a user-entered quantity to pcs (the internal storage unit).
 * If inputUnit is 'boxes', multiply by pcsPerBox.
 * If inputUnit is 'pcs', return as-is.
 */
export function toPcs(
  qty: number,
  inputUnit: InputUnit,
  pcsPerBox: number
): number {
  return inputUnit === "boxes" ? qty * pcsPerBox : qty;
}

/**
 * Convert pcs to a display value in the given unit.
 */
export function fromPcs(
  pcsQty: number,
  displayUnit: InputUnit,
  pcsPerBox: number
): number {
  if (displayUnit === "pcs" || pcsPerBox <= 1) return pcsQty;
  return pcsQty / pcsPerBox;
}

/**
 * Get the numeric display value in the item's base unit.
 * For items stored in boxes: returns number of full boxes.
 * For items stored in pcs: returns pcs directly.
 */
export function displayQty(
  pcsQty: number,
  baseUnit: BaseUnit,
  pcsPerBox: number
): number {
  if (baseUnit === "pcs" || pcsPerBox <= 1) return pcsQty;
  return Math.floor(pcsQty / pcsPerBox);
}

/**
 * Format a quantity stored in pcs for display in the item's base_unit.
 * Examples: "100 boxes", "8 pcs", "2 boxes + 3 pcs"
 */
export function formatQty(
  pcsQty: number,
  baseUnit: BaseUnit,
  pcsPerBox: number,
  unitLabel?: string
): string {
  if (baseUnit === "pcs") {
    return `${pcsQty} ${unitLabel || "pcs"}`;
  }
  if (pcsPerBox <= 1) {
    return `${pcsQty} ${pcsQty === 1 ? "box" : "boxes"}`;
  }
  const boxes = Math.floor(pcsQty / pcsPerBox);
  const remainder = pcsQty % pcsPerBox;
  const pcsLabel = unitLabel || "pcs";
  if (remainder === 0) {
    return `${boxes} ${boxes === 1 ? "box" : "boxes"}`;
  }
  if (boxes === 0) {
    return `${remainder} ${pcsLabel}`;
  }
  return `${boxes} ${boxes === 1 ? "box" : "boxes"} + ${remainder} ${pcsLabel}`;
}
